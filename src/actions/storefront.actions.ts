'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getStorefrontProducts() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select(`
        id, 
        name, 
        stock_quantity, 
        status,
        product_images ( image_url ),
        product_pricing ( cost_price, target_margin )
      `)
      .eq('status', 'active')
      .gt('stock_quantity', 0);

    if (error) throw error;

    // Compute selling price securely on server and strip internal cost data
    const safeProducts = products.map((p: any) => {
      const pricing = p.product_pricing?.[0];
      const cost = pricing?.cost_price || 0;
      const margin = pricing?.target_margin || 0.5;
      const sellingPrice = cost / (1 - margin);
      
      const imageUrl = p.product_images?.[0]?.image_url || null;

      return {
        id: p.id,
        name: p.name,
        stock_quantity: p.stock_quantity,
        selling_price: Math.ceil(sellingPrice),
        image_url: imageUrl
      };
    });

    return { products: safeProducts };
  } catch (error: any) {
    console.error('Error fetching storefront products:', error);
    return { error: 'Failed to load products' };
  }
}
export async function searchHamperByName(name: string) {
  try {
    const { data: hamper, error } = await supabaseAdmin
      .from('hampers')
      .select('id, name, selling_price, image_url, stock_quantity')
      .eq('name', name)
      .eq('is_active', true)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return { hamper: null }; // Not found
      throw error;
    }
    
    return { hamper };
  } catch (error: any) {
    console.error('Error fetching hamper by name:', error);
    return { error: 'Failed to load hamper' };
  }
}
