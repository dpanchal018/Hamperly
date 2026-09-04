import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import ProductForm from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Load categories, occasions, and events for the form dropdowns
  const [
    { data: categories, error: catError },
    { data: occasions, error: occError },
    { data: events, error: eventError },
    { data: genders, error: genError },
    { data: recipientTags, error: recError }
  ] = await Promise.all([
    supabase.from('categories').select('*').order('display_order'),
    supabase.from('occasions').select('*').order('display_order'),
    supabase.from('events').select('*').order('display_order'),
    supabase.from('genders').select('*').order('name'),
    supabase.from('recipient_tags').select('*').order('name')
  ]);

  if (catError || occError || eventError || genError || recError) {
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
        events={events || []}
        genders={genders || []}
        recipientTags={recipientTags || []}
      />
    </div>
  );
}
