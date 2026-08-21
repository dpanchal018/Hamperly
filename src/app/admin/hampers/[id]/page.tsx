import { HamperForm } from '@/components/admin/HamperForm';
import { getHamperById } from '@/actions/hamper.actions';
import { notFound } from 'next/navigation';

export default async function EditHamperPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const hamper = await getHamperById(resolvedParams.id);
  
  if (!hamper) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Hamper</h1>
        <p className="text-slate-500 mt-1">Update details for {hamper.name}.</p>
      </div>
      
      <HamperForm initialData={hamper} />
    </div>
  );
}
