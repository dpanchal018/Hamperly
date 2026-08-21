import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import CategoryForm from '@/components/admin/CategoryForm';
import { notFound } from 'next/navigation';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
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
