import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/services/auth.service';
import CategoryForm from '@/components/admin/CategoryForm';
import { notFound } from 'next/navigation';

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
        <p className="text-gray-500">Update category details.</p>
      </div>
      <CategoryForm initialData={category} />
    </div>
  );
}
