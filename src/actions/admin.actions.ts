'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

// Occasions

export async function createOccasionAction(formData: FormData) {
  await requireAdmin();
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const is_active = formData.get('is_active') === 'true';
  const display_order = parseInt(formData.get('display_order') as string) || 0;

  if (!name || !slug) throw new Error('Name and Slug are required');

  const supabase = await createClient();
  const { error } = await supabase.from('occasions').insert({
    name, slug, description, is_active, display_order
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin/occasions');
}

export async function updateOccasionAction(id: string, formData: FormData) {
  await requireAdmin();
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const is_active = formData.get('is_active') === 'true';
  const display_order = parseInt(formData.get('display_order') as string) || 0;

  if (!name || !slug) throw new Error('Name and Slug are required');

  const supabase = await createClient();
  const { error } = await supabase.from('occasions').update({
    name, slug, description, is_active, display_order, updated_at: new Date().toISOString()
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/occasions');
  revalidatePath(`/admin/occasions/${id}`);
}

// Categories

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const display_order = parseInt(formData.get('display_order') as string) || 0;

  if (!name || !slug) throw new Error('Name and Slug are required');

  const supabase = await createClient();
  const { error } = await supabase.from('categories').insert({
    name, slug, description, display_order
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin/categories');
}

export async function updateCategoryAction(id: string, formData: FormData) {
  await requireAdmin();
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const display_order = parseInt(formData.get('display_order') as string) || 0;

  if (!name || !slug) throw new Error('Name and Slug are required');

  const supabase = await createClient();
  const { error } = await supabase.from('categories').update({
    name, slug, description, display_order, updated_at: new Date().toISOString()
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/categories');
  revalidatePath(`/admin/categories/${id}`);
}
