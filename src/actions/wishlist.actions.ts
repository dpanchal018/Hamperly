'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

export async function toggleWishlistItem(itemId: string, itemType: 'HAMPER' | 'PRODUCT') {
  const user = await getCurrentUser();
  if (!user) return { error: 'You must be logged in to save items to your wishlist.' };

  const supabase = await createClient();
  const column = itemType === 'HAMPER' ? 'hamper_id' : 'product_id';

  // Check if it exists
  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq(column, itemId)
    .single();

  if (existing) {
    // Remove it
    await supabase.from('wishlists').delete().eq('id', existing.id);
  } else {
    // Add it
    await supabase.from('wishlists').insert({
      user_id: user.id,
      [column]: itemId
    });
  }

  revalidatePath('/account/wishlist');
  revalidatePath('/admin/customers');
  return { success: true, isWishlisted: !existing };
}

export async function getUserWishlistIds() {
  const user = await getCurrentUser();
  if (!user) return { hampers: new Set<string>(), products: new Set<string>() };

  const supabase = await createClient();
  const { data } = await supabase
    .from('wishlists')
    .select('hamper_id, product_id')
    .eq('user_id', user.id);

  const hampers = new Set<string>();
  const products = new Set<string>();

  if (data) {
    data.forEach(item => {
      if (item.hamper_id) hampers.add(item.hamper_id);
      if (item.product_id) products.add(item.product_id);
    });
  }

  return { hampers, products };
}

export async function getFullUserWishlist(userId: string) {
  const supabase = await createClient();
  
  // Need to fetch the full details for the dashboard/admin
  // Since we don't have FK set up in our type definition strictly yet, we fetch manually
  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!wishlists || wishlists.length === 0) return { hampers: [], products: [] };

  const hamperIds = wishlists.map(w => w.hamper_id).filter(Boolean);
  const productIds = wishlists.map(w => w.product_id).filter(Boolean);

  const { data: hampers } = await supabase.from('hampers').select('*').in('id', hamperIds);
  const { data: products } = await supabase.from('products').select('*, product_images(*)').in('id', productIds);

  return { 
    hampers: hampers || [], 
    products: products || [],
    wishlists
  };
}
