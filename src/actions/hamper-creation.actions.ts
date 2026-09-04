'use server';

import { createClient } from '@/lib/supabase/server';
import { getPublicCustomizations } from './customization.actions';
import { SelectedCustomizationDetail } from '@/types/customization.types';

export interface HamperCreationProductInput {
  productId: string;
  quantity: number;
}

export interface HamperCreationValidationRequest {
  draftId?: string;
  occasionId?: string;
  products: HamperCreationProductInput[];
  selectedCustomizations: Record<string, string[]>; // categoryId -> array of optionIds
  personalMessage?: string;
  recipient?: string;
}

export interface ValidatedPersonalizedHamper {
  id: string;
  name: string;
  occasion: { id: string; name: string } | null;
  products: {
    id: string;
    name: string;
    price: number;
    actualCost: number;
    quantity: number;
    imageUrl: string | null;
    categoryName: string;
  }[];
  customizations: SelectedCustomizationDetail[];
  personalMessage: string | null;
  recipient: string | null;
  productsSubtotal: number;
  customizationsSubtotal: number;
  totalPrice: number;
}

export interface HamperValidationResult {
  success: boolean;
  error?: string;
  validatedHamper?: ValidatedPersonalizedHamper;
}

export async function validateAndConfirmHamper(
  request: HamperCreationValidationRequest
): Promise<HamperValidationResult> {
  try {
    const supabase = await createClient();

    // 1. Validate Products Presence
    if (!request.products || request.products.length === 0) {
      return { success: false, error: 'Please select at least one product for your hamper.' };
    }

    // 2. Validate Occasion (if provided)
    let occasionData: { id: string; name: string } | null = null;
    if (request.occasionId) {
      const { data: occ } = await supabase
        .from('occasions')
        .select('id, name, is_active')
        .eq('id', request.occasionId)
        .maybeSingle();

      if (occ && occ.is_active) {
        occasionData = { id: occ.id, name: occ.name };
      }
    }

    // 3. Authoritative Products Validation (Active status, Stock, Selling Price)
    const productIds = request.products.map(p => p.productId);
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        product_images(image_url, is_primary)
      `)
      .in('id', productIds);

    if (prodErr || !dbProducts || dbProducts.length === 0) {
      console.error('Failed to verify products:', prodErr);
      return { success: false, error: 'Failed to verify selected products.' };
    }

    const validatedProducts = [];
    let productsSubtotal = 0;

    for (const input of request.products) {
      const dbProd = dbProducts.find(p => p.id === input.productId);
      if (!dbProd) {
        return { success: false, error: `A selected product is no longer available in the catalog.` };
      }
      if (dbProd.status !== 'active') {
        return { success: false, error: `"${dbProd.name}" is no longer active.` };
      }
      if (input.quantity <= 0) {
        return { success: false, error: `Invalid quantity for "${dbProd.name}".` };
      }
      if (dbProd.stock_quantity !== null && dbProd.stock_quantity < input.quantity) {
        return { 
          success: false, 
          error: `Only ${dbProd.stock_quantity} unit(s) of "${dbProd.name}" are in stock.` 
        };
      }

      const primaryImg = dbProd.product_images?.find((img: any) => img.is_primary)?.image_url 
        || dbProd.product_images?.[0]?.image_url 
        || null;

      const unitPrice = Number(dbProd.selling_price) || 0;
      const actualCost = Number(dbProd.selling_price) || 0;
      const lineTotal = unitPrice * input.quantity;
      productsSubtotal += lineTotal;

      validatedProducts.push({
        id: dbProd.id,
        name: dbProd.name,
        price: unitPrice,
        actualCost: actualCost,
        quantity: input.quantity,
        imageUrl: primaryImg,
        categoryName: (dbProd.category as any)?.name || 'Gift Item'
      });
    }

    // 4. Authoritative Customizations Validation
    const categories = await getPublicCustomizations();
    const selectedCustomizationDetails: SelectedCustomizationDetail[] = [];
    let customizationsSubtotal = 0;
    const totalProductQuantity = request.products.reduce((sum, p) => sum + p.quantity, 0);

    for (const cat of categories) {
      const selectedOptionIds = request.selectedCustomizations?.[cat.id] || [];

      // Check required rules
      if (cat.is_required && selectedOptionIds.length === 0) {
        return { 
          success: false, 
          error: `Please select a required option for "${cat.name}".` 
        };
      }

      // Check single-select rules
      if (!cat.allow_multiple && selectedOptionIds.length > 1) {
        return { 
          success: false, 
          error: `Only one selection is permitted for "${cat.name}".` 
        };
      }

      // Validate options exist and are active in category
      for (const optId of selectedOptionIds) {
        const opt = (cat.options || []).find(o => o.id === optId);
        if (!opt) {
          return { 
            success: false, 
            error: `Selected option for "${cat.name}" is no longer available.` 
          };
        }

        // Box capacity check: this option's max_items caps the total number of products in the hamper
        if (cat.id === 'cat-packaging' && opt.max_items != null && totalProductQuantity > opt.max_items) {
          return {
            success: false,
            error: `Your hamper has ${totalProductQuantity} items, which exceeds the ${opt.max_items}-item capacity of "${opt.name}". Please remove some items or choose a larger box.`
          };
        }

        const optPrice = Number(opt.price) || 0;
        customizationsSubtotal += optPrice;

        selectedCustomizationDetails.push({
          categoryId: cat.id,
          categoryName: cat.name,
          optionId: opt.id,
          optionName: opt.name,
          price: optPrice
        });
      }
    }

    // 5. Authoritative Personal Message Validation & Sanitization
    let sanitizedMessage: string | null = null;
    if (request.personalMessage && request.personalMessage.trim()) {
      const raw = request.personalMessage.trim();
      if (raw.length > 250) {
        return { success: false, error: 'Personal message cannot exceed 250 characters.' };
      }
      // Reject HTML or script tags
      if (/<[a-z][\s\S]*>/i.test(raw)) {
        return { success: false, error: 'HTML tags and formatting scripts are not permitted in personal messages.' };
      }
      sanitizedMessage = raw;
    }

    // 6. Calculate Final Total
    const finalTotal = productsSubtotal + customizationsSubtotal;
    const hamperId = request.draftId || `hamp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const hamperName = occasionData ? `${occasionData.name} Celebration Hamper` : 'Bespoke Personalized Hamper';

    return {
      success: true,
      validatedHamper: {
        id: hamperId,
        name: hamperName,
        occasion: occasionData,
        products: validatedProducts,
        customizations: selectedCustomizationDetails,
        personalMessage: sanitizedMessage,
        recipient: request.recipient?.trim() || null,
        productsSubtotal,
        customizationsSubtotal,
        totalPrice: finalTotal
      }
    };
  } catch (err: any) {
    console.error('Error in validateAndConfirmHamper:', err);
    return { success: false, error: err.message || 'Failed to validate hamper.' };
  }
}
