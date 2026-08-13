import { supabase } from '@/lib/supabase';
import { getCurrentUser } from './auth.service';
import { CustomHamper, CustomHamperItem } from '@/types/database.types';
import { getProductById } from './catalog.service';

export async function createCustomHamper(occasionId: string): Promise<CustomHamper> {
  const user = await getCurrentUser();
  const userId = user ? user.id : null;

  const { data, error } = await supabase
    .from('custom_hampers')
    .insert({
      user_id: userId,
      occasion_id: occasionId,
      status: 'draft',
      total_price: 0
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create custom hamper');
  }
  return data as CustomHamper;
}

export async function addHamperItem(hamperId: string, productId: string, quantity: number): Promise<CustomHamperItem> {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  // Authoritative product check
  const product = await getProductById(productId);
  if (!product) {
    throw new Error('Product not found or not active');
  }

  // Insert item with snapshot price
  const { data, error } = await supabase
    .from('custom_hamper_items')
    .insert({
      hamper_id: hamperId,
      product_id: productId,
      quantity: quantity,
      unit_price: product.selling_price
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to add hamper item');
  }

  // We should also recalculate the total_price of the hamper (handled via DB trigger or manual update)
  // For now, manual update:
  const { data: hamperData } = await supabase
    .from('custom_hampers')
    .select('total_price')
    .eq('id', hamperId)
    .single();

  if (hamperData) {
    await supabase
      .from('custom_hampers')
      .update({ total_price: hamperData.total_price + (product.selling_price * quantity) })
      .eq('id', hamperId);
  }

  return data as CustomHamperItem;
}
