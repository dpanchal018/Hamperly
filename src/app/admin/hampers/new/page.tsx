import { HamperForm } from '@/components/admin/HamperForm';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';

export default async function NewHamperPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [
    { data: occasions },
    { data: packagingTypes },
    { data: genders },
    { data: recipientTags },
    { data: products },
  ] = await Promise.all([
    supabase.from('occasions').select('*').order('name'),
    supabase.from('packaging_types').select('*').order('name'),
    supabase.from('genders').select('*').order('name'),
    supabase.from('recipient_tags').select('*').order('name'),
    supabase.from('products').select('id, name, stock_quantity, selling_price, sku').order('name'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Hamper</h1>
        <p className="text-slate-500 mt-1">Create a new pre-made hamper bundle.</p>
      </div>
      
      <HamperForm 
        occasions={occasions || []}
        packagingTypes={packagingTypes || []}
        genders={genders || []}
        recipientTags={recipientTags || []}
        products={products || []}
      />
    </div>
  );
}
