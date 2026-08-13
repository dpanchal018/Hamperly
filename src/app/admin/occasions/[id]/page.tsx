import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/services/auth.service';
import OccasionForm from '@/components/admin/OccasionForm';
import { notFound } from 'next/navigation';

export default async function EditOccasionPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const { data: occasion, error } = await supabase
    .from('occasions')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !occasion) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Occasion</h1>
        <p className="text-gray-500">Update occasion details.</p>
      </div>
      <OccasionForm initialData={occasion} />
    </div>
  );
}
