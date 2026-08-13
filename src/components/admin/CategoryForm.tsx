'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCategoryAction, updateCategoryAction } from '@/actions/admin.actions';
import { Category } from '@/types/database.types';

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional(),
  display_order: z.number().int().nonnegative(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoryForm({ initialData }: { initialData?: Category }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      display_order: initialData?.display_order || 0,
    }
  });

  const onSubmit = async (data: CategoryFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('slug', data.slug);
        formData.append('description', data.description || '');
        formData.append('display_order', data.display_order.toString());

        if (initialData) {
          await updateCategoryAction(initialData.id, formData);
        } else {
          await createCategoryAction(formData);
        }
        router.push('/admin/categories');
      } catch (error: any) {
        alert(error.message || 'Something went wrong');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-white p-6 rounded-md shadow-sm border">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} placeholder="e.g. Chocolates" />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" {...register('slug')} placeholder="e.g. chocolates" />
        {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} rows={3} />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_order">Display Order</Label>
        <Input id="display_order" type="number" {...register('display_order', { valueAsNumber: true })} />
        {errors.display_order && <p className="text-sm text-red-500">{errors.display_order.message}</p>}
      </div>

      <div className="pt-4 flex space-x-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Category'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/categories')} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
