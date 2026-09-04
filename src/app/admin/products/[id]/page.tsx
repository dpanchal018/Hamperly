import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import ProductForm from '@/components/admin/ProductForm';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  // Load categories and occasions
  const [
    { data: categories },
    { data: occasions },
    { data: product, error: prodError },
    { data: pricing },
    { data: productOccasions },
    { data: productImages },
    { data: genders },
    { data: recipientTags },
    { data: productRecipientTags }
  ] = await Promise.all([
    supabase.from('categories').select('*').order('display_order'),
    supabase.from('occasions').select('*').order('display_order'),
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('product_pricing').select('*').eq('product_id', id).single(),
    supabase.from('product_occasions').select('occasion_id').eq('product_id', id),
    supabase.from('product_images').select('image_url').eq('product_id', id).eq('is_primary', true).limit(1),
    supabase.from('genders').select('*').order('name'),
    supabase.from('recipient_tags').select('*').order('name'),
    supabase.from('product_recipient_tags').select('recipient_tag_id').eq('product_id', id)
  ]);

  if (prodError || !product) {
    notFound();
  }

  const initialData = {
    ...product,
    pricing: pricing || undefined,
    occasionIds: productOccasions ? productOccasions.map(po => po.occasion_id) : [],
    recipientTagIds: productRecipientTags ? productRecipientTags.map(pt => pt.recipient_tag_id) : [],
    primaryImageUrl: productImages && productImages.length > 0 ? productImages[0].image_url : undefined
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-gray-500">Update product information and pricing.</p>
      </div>
      
      <ProductForm 
        initialData={initialData}
        categories={categories || []} 
        occasions={occasions || []} 
        genders={genders || []}
        recipientTags={recipientTags || []}
      />
    </div>
  );
}
