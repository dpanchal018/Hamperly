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
    .maybeSingle();

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

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/services/auth.service';

const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function getUserWishlistIds(): Promise<{ hampers: string[]; products: string[] }> {
  const user = await getCurrentUser();
  if (!user) return { hampers: [], products: [] };

  const supabase = await createClient();
  const { data } = await supabase
    .from('wishlists')
    .select('hamper_id, product_id')
    .eq('user_id', user.id);

  const hampers: string[] = [];
  const products: string[] = [];

  if (data) {
    data.forEach(item => {
      if (item.hamper_id) hampers.push(item.hamper_id);
      if (item.product_id) products.push(item.product_id);
    });
  }

  return { hampers, products };
}

export async function getAdminCustomerWishlists(): Promise<Record<string, string[]>> {
  await requireAdmin();
  const adminClient = getAdminClient();

  const { data: wishlists, error } = await adminClient
    .from('wishlists')
    .select('user_id, hamper:hampers(name), product:products(name)');

  if (error) {
    console.error('Error fetching customer wishlists for admin:', error);
    return {};
  }

  const userWishlists: Record<string, string[]> = {};
  wishlists?.forEach((w: any) => {
    if (!w.user_id) return;
    if (!userWishlists[w.user_id]) userWishlists[w.user_id] = [];
    const name = w.hamper?.name || w.product?.name;
    if (name) userWishlists[w.user_id].push(name);
  });

  return userWishlists;
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
