'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { createOccasionAction, updateOccasionAction } from '@/actions/admin.actions';
import { Occasion } from '@/types/database.types';
import { createClient } from '@/lib/supabase/client';

const occasionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional(),
  image_url: z.string().optional(),
  display_order: z.number().int().nonnegative(),
  is_active: z.boolean(),
  parent_id: z.string().nullable(),
  occasion_type: z.enum(['FESTIVAL', 'CORPORATE', 'WEDDING', 'BIRTHDAY', 'ANNIVERSARY', 'MILESTONE', 'BABY_SHOWER', 'JUST_BECAUSE', 'GENERAL'] as const),
});

type OccasionFormValues = z.infer<typeof occasionSchema>;

export default function OccasionForm({ initialData, allOccasions = [] }: { initialData?: Occasion, allOccasions?: Occasion[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<OccasionFormValues>({
    resolver: zodResolver(occasionSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      image_url: initialData?.image_url || '',
      display_order: initialData?.display_order || 0,
      is_active: initialData ? initialData.is_active : true,
      parent_id: initialData?.parent_id || null,
      occasion_type: initialData?.occasion_type || 'GENERAL',
    }
  });

  const isActive = watch('is_active');
  const parentId = watch('parent_id');
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
      const filePath = `occasions/${fileName}`;

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

  // Exclude this occasion and all of its descendants from the parent dropdown,
  // otherwise an admin could create a cycle in the hierarchy (A -> B -> ... -> A).
  const selectableParents = useMemo(() => {
    if (!initialData) return allOccasions;

    const excludedIds = new Set<string>([initialData.id]);
    let frontier = [initialData.id];
    while (frontier.length > 0) {
      const children = allOccasions.filter(o => o.parent_id && frontier.includes(o.parent_id));
      frontier = children.map(c => c.id).filter(id => !excludedIds.has(id));
      frontier.forEach(id => excludedIds.add(id));
    }

    return allOccasions.filter(o => !excludedIds.has(o.id));
  }, [allOccasions, initialData]);

  const onSubmit = async (data: OccasionFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('slug', data.slug);
        formData.append('description', data.description || '');
        formData.append('image_url', data.image_url || '');
        formData.append('display_order', data.display_order.toString());
        formData.append('is_active', data.is_active.toString());
        if (data.parent_id) formData.append('parent_id', data.parent_id);
        formData.append('occasion_type', data.occasion_type);

        if (initialData) {
          await updateOccasionAction(initialData.id, formData);
        } else {
          await createOccasionAction(formData);
        }
        router.push('/admin/occasions');
      } catch (error: any) {
        alert(error.message || 'Something went wrong');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-white p-6 rounded-md shadow-sm border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} placeholder="e.g. Diwali" />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register('slug')} placeholder="e.g. diwali" />
          {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="occasion_type">Type</Label>
          <select 
            id="occasion_type" 
            {...register('occasion_type')}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="GENERAL">General</option>
            <option value="FESTIVAL">Festival</option>
            <option value="CORPORATE">Corporate</option>
            <option value="WEDDING">Wedding</option>
            <option value="BIRTHDAY">Birthday</option>
            <option value="ANNIVERSARY">Anniversary</option>
            <option value="MILESTONE">Milestone (Birthday/Anniversary)</option>
            <option value="BABY_SHOWER">Baby Shower</option>
            <option value="JUST_BECAUSE">Just Because</option>
          </select>
          {errors.occasion_type && <p className="text-sm text-red-500">{errors.occasion_type.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="parent_id">Parent Occasion (Optional)</Label>
          <select 
            id="parent_id" 
            value={parentId || ''}
            onChange={(e) => setValue('parent_id', e.target.value || null)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">None (Top-Level)</option>
            {selectableParents.map(occ => (
              <option key={occ.id} value={occ.id}>{occ.name}</option>
            ))}
          </select>
          {errors.parent_id && <p className="text-sm text-red-500">{errors.parent_id.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} rows={3} />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Occasion Image</Label>
        <div className="flex flex-col space-y-4">
          {imageUrl && (
            <img src={imageUrl} alt="Occasion" className="w-32 h-32 object-cover rounded-xl border border-slate-200" />
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

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="is_active" 
          checked={isActive} 
          onCheckedChange={(checked) => setValue('is_active', checked as boolean)} 
        />
        <Label htmlFor="is_active">Active (Visible to customers)</Label>
      </div>

      <div className="pt-4 flex space-x-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Occasion'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/occasions')} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
