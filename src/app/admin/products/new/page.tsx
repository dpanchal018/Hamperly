import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import ProductForm from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Load categories and occasions for the form dropdowns
  const [
    { data: categories, error: catError },
    { data: occasions, error: occError }
  ] = await Promise.all([
    supabase.from('categories').select('*').order('display_order'),
    supabase.from('occasions').select('*').order('display_order')
  ]);

  if (catError || occError) {
    return <div>Error loading form dependencies.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
        <p className="text-gray-500">Add a new product to the catalog.</p>
      </div>
      
      <ProductForm 
        categories={categories || []} 
        occasions={occasions || []} 
      />
    </div>
  );
}
