import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import OccasionForm from '@/components/admin/OccasionForm';
import { EventsManager } from '@/components/admin/EventsManager';
import { getEventsByOccasion } from '@/actions/event.actions';
import { notFound } from 'next/navigation';

export default async function EditOccasionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: occasion, error }, { data: allOccasions }, events] = await Promise.all([
    supabase.from('occasions').select('*').eq('id', id).single(),
    supabase.from('occasions').select('*').order('name'),
    getEventsByOccasion(id),
  ]);

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
      <EventsManager occasionId={id} initialEvents={events} />
    </div>
  );
}
