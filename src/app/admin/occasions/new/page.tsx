import OccasionForm from '@/components/admin/OccasionForm';
import { requireAdmin } from '@/services/auth.service';

export default async function NewOccasionPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Occasion</h1>
        <p className="text-gray-500">Add a new occasion to the catalog.</p>
      </div>
      <OccasionForm />
    </div>
  );
}
