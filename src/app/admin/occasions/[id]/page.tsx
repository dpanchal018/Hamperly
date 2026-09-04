import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import OccasionForm from '@/components/admin/OccasionForm';
import { notFound } from 'next/navigation';

export default async function EditOccasionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: occasion, error } = await supabase
    .from('occasions')
    .select('*')
    .eq('id', id)
    .single();

  const { data: allOccasions } = await supabase
    .from('occasions')
    .select('*')
    .order('name');

  if (error || !occasion) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Occasion</h1>
        <p className="text-gray-500">Update occasion details.</p>
      </div>
      <OccasionForm initialData={occasion} allOccasions={allOccasions || []} />
    </div>
  );
}
