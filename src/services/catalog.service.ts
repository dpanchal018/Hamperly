import { supabase } from '@/lib/supabase';
import { Occasion, Category, Product } from '@/types/database.types';

export interface PublicProduct extends Omit<Product, 'status'> {
  primary_image_url: string | null;
  category: { name: string, slug: string } | null;
}

export async function getPublicOccasions(): Promise<Occasion[]> {
  const { data, error } = await supabase
    .from('occasions')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Supabase error in getPublicOccasions:', error);
    throw new Error(`Failed to fetch occasions: ${error.message}`);
  }
  return data as Occasion[];
}

export async function getPublicOccasionBySlug(slug: string): Promise<Occasion | null> {
  const { data, error } = await supabase
    .from('occasions')
    .select('*')
    .eq('is_active', true)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as Occasion;
}

export async function getPublicCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch categories');
  }
  return data as Category[];
}

export async function getPublicProducts(options?: {
  categoryId?: string;
  occasionId?: string;
  searchQuery?: string;
  inStockOnly?: boolean;
}): Promise<PublicProduct[]> {
  let query = supabase
    .from('products')
    .select(`
      id, category_id, name, slug, description, stock_quantity, selling_price, created_at, updated_at,
      categories ( name, slug ),
      product_images ( image_url )
    `)
    .eq('status', 'active');

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  if (options?.searchQuery) {
    query = query.or(`name.ilike.%${options.searchQuery}%,description.ilike.%${options.searchQuery}%`);
  }

  if (options?.inStockOnly) {
    query = query.gt('stock_quantity', 0);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error('Failed to fetch products');
  }

  let products = data as any[];

  if (options?.occasionId) {
    const { data: mappingData, error: mappingError } = await supabase
        .from('product_occasions')
        .select('product_id')
        .eq('occasion_id', options.occasionId);
        
    if (mappingError) throw new Error('Failed to filter by occasion');
    const productIds = mappingData.map(m => m.product_id);
    products = products.filter(p => productIds.includes(p.id));
  }

  return products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    stock_quantity: p.stock_quantity,
    selling_price: p.selling_price,
    created_at: p.created_at,
    updated_at: p.updated_at,
    category_id: p.category_id,
    category: p.categories ? { name: p.categories.name, slug: p.categories.slug } : null,
    primary_image_url: p.product_images && p.product_images.length > 0 ? p.product_images[0].image_url : null
  }));
}

export async function getPublicProductBySlug(slug: string): Promise<PublicProduct | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, category_id, name, slug, description, stock_quantity, selling_price, created_at, updated_at,
      categories ( name, slug ),
      product_images ( image_url )
    `)
    .eq('status', 'active')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    stock_quantity: data.stock_quantity,
    selling_price: data.selling_price,
    created_at: data.created_at,
    updated_at: data.updated_at,
    category_id: data.category_id,
    category: data.categories ? { name: data.categories.name, slug: data.categories.slug } : null,
    primary_image_url: data.product_images && data.product_images.length > 0 ? data.product_images[0].image_url : null
  };
}

export async function getProductById(productId: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, category_id, name, slug, description, stock_quantity, status, selling_price, created_at, updated_at')
    .eq('id', productId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return null;
  }
  return data as Product;
}
