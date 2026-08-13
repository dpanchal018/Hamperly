import CategoryForm from '@/components/admin/CategoryForm';
import { requireAdmin } from '@/services/auth.service';

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Category</h1>
        <p className="text-gray-500">Add a new category to organize products.</p>
      </div>
      <CategoryForm />
    </div>
  );
}
