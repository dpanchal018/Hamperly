'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth.service';

export async function fetchCartFromCloud() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, items: [] };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('customers')
      .select('cart_state')
      .eq('user_id', user.id)
      .single();

    if (error || !data || !data.cart_state) {
      return { success: true, items: [] };
    }

    return { success: true, items: data.cart_state };
  } catch (err: any) {
    console.error('Failed to fetch cloud cart:', err);
    return { success: false, items: [] };
  }
}

export async function saveCartToCloud(cartItems: any[]) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false };

    const supabase = await createClient();
    
    // Fire and forget update
    const { error } = await supabase
      .from('customers')
      .update({ cart_state: cartItems })
      .eq('user_id', user.id);

    if (error) throw error;
    
    return { success: true };
  } catch (err: any) {
    console.error('Failed to sync cart to cloud:', err);
    return { success: false };
  }
}
