'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  // Extract basic info
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const category_id = formData.get('category_id') as string;
  const stock_quantity = parseInt(formData.get('stock_quantity') as string) || 0;
  const status = formData.get('status') as string || 'draft';

  // Extract pricing info
  const cost_price = parseFloat(formData.get('cost_price') as string);
  const target_margin = parseFloat(formData.get('target_margin') as string);

  // Extract occasions
  const occasionIdsStr = formData.get('occasion_ids') as string;
  const occasionIds: string[] = occasionIdsStr ? JSON.parse(occasionIdsStr) : [];

  if (!name || !slug || !category_id) throw new Error('Name, Slug, and Category are required');
  if (target_margin < 0 || target_margin >= 1) throw new Error('Invalid target margin');
  if (cost_price < 0) throw new Error('Cost price cannot be negative');

  const supabase = await createClient();

  // 1. Create Product
  const { data: product, error: productError } = await supabase.from('products').insert({
    name, slug, description, category_id, stock_quantity, status
  }).select('id').single();

  if (productError || !product) throw new Error(productError?.message || 'Failed to create product');

  // 2. Create Pricing (Strictly Admin only table)
  const { error: pricingError } = await supabase.from('product_pricing').insert({
    product_id: product.id,
    cost_price,
    target_margin
  });

  if (pricingError) {
    // Rollback product manually if pricing fails
    await supabase.from('products').delete().eq('id', product.id);
    throw new Error(pricingError.message);
  }

  // 3. Assign Occasions
  if (occasionIds.length > 0) {
    const occasionMappings = occasionIds.map(id => ({
      product_id: product.id,
      occasion_id: id
    }));
    await supabase.from('product_occasions').insert(occasionMappings);
  }

  // Note: Image upload URL handling would also be here, but for now we expect it to be handled via direct storage upload client-side and then updated here, or handled via a separate action.
  const imageUrl = formData.get('image_url') as string;
  if (imageUrl) {
     await supabase.from('product_images').insert({
        product_id: product.id,
        image_url: imageUrl,
        is_primary: true
     });
  }

  revalidatePath('/admin/products');
  return product.id;
}

export async function updateProductAction(id: string, formData: FormData) {
  await requireAdmin();

  // Extract basic info
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const category_id = formData.get('category_id') as string;
  const stock_quantity = parseInt(formData.get('stock_quantity') as string) || 0;
  const status = formData.get('status') as string || 'draft';

  // Extract pricing info
  const cost_price = parseFloat(formData.get('cost_price') as string);
  const target_margin = parseFloat(formData.get('target_margin') as string);

  // Extract occasions
  const occasionIdsStr = formData.get('occasion_ids') as string;
  const occasionIds: string[] = occasionIdsStr ? JSON.parse(occasionIdsStr) : [];

  if (!name || !slug || !category_id) throw new Error('Name, Slug, and Category are required');
  if (target_margin < 0 || target_margin >= 1) throw new Error('Invalid target margin');
  if (cost_price < 0) throw new Error('Cost price cannot be negative');

  const supabase = await createClient();

  // 1. Update Product
  const { error: productError } = await supabase.from('products').update({
    name, slug, description, category_id, stock_quantity, status, updated_at: new Date().toISOString()
  }).eq('id', id);

  if (productError) throw new Error(productError.message);

  // 2. Update Pricing
  const { error: pricingError } = await supabase.from('product_pricing').upsert({
    product_id: id,
    cost_price,
    target_margin,
    updated_at: new Date().toISOString()
  });

  if (pricingError) throw new Error(pricingError.message);

  // 3. Update Occasions (Delete old, insert new)
  await supabase.from('product_occasions').delete().eq('product_id', id);
  if (occasionIds.length > 0) {
    const occasionMappings = occasionIds.map(occId => ({
      product_id: id,
      occasion_id: occId
    }));
    await supabase.from('product_occasions').insert(occasionMappings);
  }
  
  // Image URL handling
  const imageUrl = formData.get('image_url') as string;
  if (imageUrl) {
     // Check if primary image exists
     const { data: existingImages } = await supabase.from('product_images').select('id').eq('product_id', id).eq('is_primary', true);
     if (existingImages && existingImages.length > 0) {
        await supabase.from('product_images').update({ image_url: imageUrl }).eq('id', existingImages[0].id);
     } else {
        await supabase.from('product_images').insert({ product_id: id, image_url: imageUrl, is_primary: true });
     }
  }

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
}
