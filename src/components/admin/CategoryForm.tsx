'use client';

import { useState, useTransition } from 'react';
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
import { createClient } from '@/lib/supabase/client';

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional(),
  image_url: z.string().optional(),
  display_order: z.number().int().nonnegative(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoryForm({ initialData }: { initialData?: Category }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      image_url: initialData?.image_url || '',
      display_order: initialData?.display_order || 0,
    }
  });

  const imageUrl = watch('image_url');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Only image files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be less than 5MB.');
      return;
    }

    setImageError('');
    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const supabase = createClient();

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setValue('image_url', publicUrl);
    } catch (err: any) {
      setImageError(err.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: CategoryFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('slug', data.slug);
        formData.append('description', data.description || '');
        formData.append('image_url', data.image_url || '');
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
        <Label>Category Image</Label>
        <div className="flex flex-col space-y-4">
          {imageUrl && (
            <img src={imageUrl} alt="Category" className="w-32 h-32 object-cover rounded-xl border border-slate-200" />
          )}
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="max-w-xs"
            />
            {uploadingImage && <p className="text-sm text-indigo-600 mt-2">Uploading image...</p>}
            {imageError && <p className="text-sm text-red-600 mt-2">{imageError}</p>}
          </div>
        </div>
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
