import { HamperForm } from '@/components/admin/HamperForm';
import { getHamperById, getHamperItems } from '@/actions/hamper.actions';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';

export default async function EditHamperPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const hamper = await getHamperById(resolvedParams.id);
  
  if (!hamper) {
    notFound();
  }

  await requireAdmin();
  const supabase = await createClient();

  const [
    { data: occasions },
    { data: events },
    { data: packagingTypes },
    { data: genders },
    { data: recipientTags },
    { data: products },
    { data: hamperRecipientTags },
    recipeItems
  ] = await Promise.all([
    supabase.from('occasions').select('*').order('name'),
    supabase.from('events').select('*').order('name'),
    supabase.from('packaging_types').select('*').order('name'),
    supabase.from('genders').select('*').order('name'),
    supabase.from('recipient_tags').select('*').order('name'),
    supabase.from('products').select('id, name, stock_quantity, selling_price, sku').order('name'),
    supabase.from('hamper_recipient_tags').select('recipient_tag_id').eq('hamper_id', hamper.id),
    getHamperItems(hamper.id)
  ]);

  const hamperWithTags = {
    ...hamper,
    recipientTagIds: hamperRecipientTags ? hamperRecipientTags.map((t: any) => t.recipient_tag_id) : []
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Hamper</h1>
        <p className="text-slate-500 mt-1">Update details for {hamper.name}.</p>
      </div>

      <HamperForm
        initialData={hamperWithTags}
        initialItems={recipeItems}
        occasions={occasions || []}
        events={events || []}
        packagingTypes={packagingTypes || []}
        genders={genders || []}
        recipientTags={recipientTags || []}
        products={products || []}
      />
    </div>
  );
}
