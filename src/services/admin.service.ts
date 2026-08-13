import { supabase } from '@/lib/supabase';
import { requireAdmin } from './auth.service';
import { ProductPricing } from '@/types/database.types';

export async function setProductPricing(productId: string, costPrice: number, targetMargin: number): Promise<ProductPricing> {
  // 1. Authorize
  await requireAdmin();

  // 2. Validate bounds
  if (targetMargin < 0 || targetMargin >= 1) {
    throw new Error('Invalid target margin. Must be between 0 and 0.99');
  }
  if (costPrice < 0) {
    throw new Error('Invalid cost price. Cannot be negative.');
  }

  // 3. Upsert pricing
  const { data, error } = await supabase
    .from('product_pricing')
    .upsert({
      product_id: productId,
      cost_price: costPrice,
      target_margin: targetMargin,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to set product pricing');
  }

  return data as ProductPricing;
}

export async function getProductPricing(productId: string): Promise<ProductPricing | null> {
  // 1. Authorize
  await requireAdmin();

  const { data, error } = await supabase
    .from('product_pricing')
    .select('*')
    .eq('product_id', productId)
    .single();

  if (error || !data) {
    return null;
  }
  return data as ProductPricing;
}
