'use server';
import { requireAdmin } from '@/services/auth.service';
import { createClient } from '@/lib/supabase/server';
import { PreMadeHamper } from '@/types/database.types';
import { revalidatePath } from 'next/cache';
import { PublicProduct } from '@/services/catalog.service';

export async function getHampers() {
  const supabase = await createClient();
  const { data: hampers, error } = await supabase
    .from('hampers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching hampers:', error);
    return [];
  }
  return hampers as PreMadeHamper[];
}

export async function getPublicHampers() {
  const supabase = await createClient();
  const { data: hampers, error } = await supabase
    .from('hampers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public hampers:', error.message || error);
    return [];
  }
  return hampers as PreMadeHamper[];
}

export async function getHamperById(id: string) {
  if (!id) return null;
  const supabase = await createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let query = supabase.from('hampers').select('*, occasion:occasions(name, slug)');
  if (isUuid) {
    query = query.eq('id', id);
  } else {
    query = query.eq('slug', id);
  }

  const { data: hamper, error } = await query.maybeSingle();

  if (error) {
    console.error('Error fetching hamper:', error.message || error);
    return null;
  }
  return hamper as PreMadeHamper | null;
}

export async function createHamper(data: Partial<PreMadeHamper>) {
  const supabase = await createClient();
  await requireAdmin();
  
  const { data: hamper, error } = await supabase
    .from('hampers')
    .insert([{
      name: data.name,
      description: data.description || null,
      image_url: data.image_url || null,
      stock_quantity: data.stock_quantity || 0,
      selling_price: data.selling_price || 0,
      actual_cost: data.actual_cost || 0,
      is_active: data.is_active ?? true,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating hamper:', error);
    return { error: error.message };
  }
  
  revalidatePath('/admin/hampers');
  return { hamper: hamper as PreMadeHamper };
}

export async function updateHamper(id: string, data: Partial<PreMadeHamper>) {
  const supabase = await createClient();
  await requireAdmin();
  
  const { data: hamper, error } = await supabase
    .from('hampers')
    .update({
      name: data.name,
      description: data.description,
      image_url: data.image_url,
      stock_quantity: data.stock_quantity,
      selling_price: data.selling_price,
      actual_cost: data.actual_cost,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating hamper:', error);
    return { error: error.message };
  }
  
  revalidatePath('/admin/hampers');
  revalidatePath(`/admin/hampers/${id}`);
  return { hamper: hamper as PreMadeHamper };
}

export async function deleteHamper(id: string) {
  const supabase = await createClient();
  await requireAdmin();
  const { error } = await supabase
    .from('hampers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting hamper:', error);
    return { error: error.message };
  }
  
  revalidatePath('/admin/hampers');
  return { success: true };
}

export interface HamperItemRequest {
  productId: string;
  quantity: number;
}

export type HamperValidationIssueType = 'PRODUCT_NOT_FOUND' | 'PRODUCT_INACTIVE' | 'INSUFFICIENT_STOCK' | 'INVALID_QUANTITY';

export interface HamperValidationIssue {
  productId: string;
  type: HamperValidationIssueType;
  availableQuantity?: number;
  message: string;
}

export interface ValidatedHamperItem {
  product: PublicProduct;
  requestedQuantity: number;
  validatedQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface HamperValidationResponse {
  status: 'VALID' | 'REVALIDATION_REQUIRED';
  items: ValidatedHamperItem[];
  subtotal: number;
  issues: HamperValidationIssue[];
}

export async function validateAndCalculateHamper(requestedItems: HamperItemRequest[]): Promise<HamperValidationResponse> {
  const supabase = await createClient();
  
  const response: HamperValidationResponse = {
    status: 'VALID',
    items: [],
    subtotal: 0,
    issues: []
  };

  if (!requestedItems || requestedItems.length === 0) {
    return response;
  }

  // Deduplicate requested items (merge quantities for duplicate product IDs)
  const mergedItems = requestedItems.reduce((acc, item) => {
    if (!item.productId) return acc;
    if (acc[item.productId]) {
      acc[item.productId] += item.quantity;
    } else {
      acc[item.productId] = item.quantity;
    }
    return acc;
  }, {} as Record<string, number>);

  const productIds = Object.keys(mergedItems);

  // Fetch all authoritative product data in one go
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      product_images(image_url, is_primary)
    `)
    .in('id', productIds);

  if (error) {
    console.error('Error fetching products for hamper validation:', error);
    return response;
  }

  for (const productId of productIds) {
    const requestedQuantity = mergedItems[productId];
    
    // 1. Basic quantity check
    if (requestedQuantity <= 0) {
      response.issues.push({
        productId,
        type: 'INVALID_QUANTITY',
        message: 'Quantity must be at least 1.'
      });
      response.status = 'REVALIDATION_REQUIRED';
      continue;
    }

    const productRecord = products?.find(p => p.id === productId);

    // 2. Product exists?
    if (!productRecord) {
      response.issues.push({
        productId,
        type: 'PRODUCT_NOT_FOUND',
        message: 'This product is no longer available.'
      });
      response.status = 'REVALIDATION_REQUIRED';
      continue;
    }

    // 3. Product active?
    if (productRecord.status !== 'active') {
      response.issues.push({
        productId,
        type: 'PRODUCT_INACTIVE',
        message: 'This product is currently inactive.'
      });
      response.status = 'REVALIDATION_REQUIRED';
      continue;
    }

    // 4. Stock validation
    let validatedQuantity = requestedQuantity;
    if (productRecord.stock_quantity === 0) {
      response.issues.push({
        productId,
        type: 'INSUFFICIENT_STOCK',
        availableQuantity: 0,
        message: 'This product is out of stock.'
      });
      response.status = 'REVALIDATION_REQUIRED';
      continue; // Can't add an out of stock product
    } else if (requestedQuantity > productRecord.stock_quantity) {
      validatedQuantity = productRecord.stock_quantity;
      response.issues.push({
        productId,
        type: 'INSUFFICIENT_STOCK',
        availableQuantity: productRecord.stock_quantity,
        message: `Only ${productRecord.stock_quantity} units are currently available.`
      });
      response.status = 'REVALIDATION_REQUIRED';
    }

    // Construct the PublicProduct shape
    const primaryImage = productRecord.product_images?.find((img: any) => img.is_primary)?.image_url 
      || productRecord.product_images?.[0]?.image_url 
      || null;

    const publicProduct: PublicProduct = {
      id: productRecord.id,
      category_id: productRecord.category_id,
      name: productRecord.name,
      slug: productRecord.slug || '',
      description: productRecord.description,
      selling_price: productRecord.selling_price,
      stock_quantity: productRecord.stock_quantity,
      created_at: productRecord.created_at,
      updated_at: productRecord.updated_at,
      primary_image_url: primaryImage,
      category: productRecord.category ? { 
        name: (productRecord.category as any).name, 
        slug: (productRecord.category as any).slug 
      } : null,
    };

    const unitPrice = productRecord.selling_price;
    const lineTotal = unitPrice * validatedQuantity;

    response.items.push({
      product: publicProduct,
      requestedQuantity,
      validatedQuantity,
      unitPrice,
      lineTotal
    });

    response.subtotal += lineTotal;
  }

  return response;
}

export async function bulkUpsertHampers(data: Partial<PreMadeHamper>[]) {
  const supabase = await createClient();
  
  const { data: existingHampers } = await supabase.from('hampers').select('id, name');
  const existingMap = new Map();
  if (existingHampers) {
    existingHampers.forEach(h => {
      if (h.name) existingMap.set(h.name.toLowerCase(), h.id);
    });
  }

  let successCount = 0;
  let errors = [];

  for (const item of data) {
    if (!item.name) continue;
    
    const existingId = existingMap.get(item.name.toLowerCase());
    
    const payload = {
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      stock_quantity: item.stock_quantity,
      selling_price: item.selling_price,
      actual_cost: item.actual_cost,
      is_active: item.is_active !== undefined ? item.is_active : true,
      updated_at: new Date().toISOString(),
    };

    if (existingId) {
      const { error } = await supabase.from('hampers').update(payload).eq('id', existingId);
      if (error) errors.push(`Failed to update ${item.name}: ${error.message}`);
      else successCount++;
    } else {
      const { error } = await supabase.from('hampers').insert({
        ...payload,
        created_at: new Date().toISOString(),
      });
      if (error) errors.push(`Failed to insert ${item.name}: ${error.message}`);
      else successCount++;
    }
  }

  revalidatePath('/admin/hampers');
  
  if (errors.length > 0) {
    console.error('Errors during bulk upsert:', errors);
    return { success: false, successCount, error: errors.join(', ') };
  }
  
  return { success: true, successCount };
}
