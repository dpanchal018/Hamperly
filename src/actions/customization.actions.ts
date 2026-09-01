'use server';

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { requireAdmin } from '@/services/auth.service';
import { CustomizationCategory, CustomizationOption } from '@/types/customization.types';
import { DEFAULT_CUSTOMIZATION_CATEGORIES } from '@/config/customization.config';
import { revalidatePath } from 'next/cache';

const getAdminClient = () => {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function getPublicCustomizations(): Promise<CustomizationCategory[]> {
  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('site_content')
      .select('content')
      .eq('section_id', 'customization_categories')
      .maybeSingle();

    if (error || !data || !data.content || !Array.isArray(data.content) || data.content.length === 0) {
      // Seed default categories into site_content if not present
      await adminClient.from('site_content').upsert({
        section_id: 'customization_categories',
        content: DEFAULT_CUSTOMIZATION_CATEGORIES,
        updated_at: new Date().toISOString()
      });
      return DEFAULT_CUSTOMIZATION_CATEGORIES.filter(c => c.is_active).map(c => ({
        ...c,
        options: (c.options || []).filter(o => o.is_active)
      }));
    }

    const categories: CustomizationCategory[] = data.content;
    return categories
      .filter(c => c.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(c => ({
        ...c,
        options: (c.options || [])
          .filter(o => o.is_active)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      }));
  } catch (err) {
    console.error('Error in getPublicCustomizations:', err);
    return DEFAULT_CUSTOMIZATION_CATEGORIES;
  }
}

export async function getAdminCustomizations(): Promise<CustomizationCategory[]> {
  await requireAdmin();
  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('site_content')
      .select('content')
      .eq('section_id', 'customization_categories')
      .maybeSingle();

    if (error || !data || !data.content || !Array.isArray(data.content) || data.content.length === 0) {
      await adminClient.from('site_content').upsert({
        section_id: 'customization_categories',
        content: DEFAULT_CUSTOMIZATION_CATEGORIES,
        updated_at: new Date().toISOString()
      });
      return DEFAULT_CUSTOMIZATION_CATEGORIES;
    }

    return (data.content as CustomizationCategory[]).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  } catch (err) {
    console.error('Error in getAdminCustomizations:', err);
    return DEFAULT_CUSTOMIZATION_CATEGORIES;
  }
}

export async function saveCustomizationCategory(category: CustomizationCategory): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    const adminClient = getAdminClient();
    const current = await getAdminCustomizations();

    const existingIndex = current.findIndex(c => c.id === category.id);
    let updated: CustomizationCategory[];

    if (existingIndex >= 0) {
      const existingOptions = current[existingIndex].options || [];
      updated = [...current];
      updated[existingIndex] = {
        ...category,
        options: category.options !== undefined ? category.options : existingOptions
      };
    } else {
      updated = [...current, { ...category, options: category.options || [] }];
    }

    const { error } = await adminClient.from('site_content').upsert({
      section_id: 'customization_categories',
      content: updated,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;
    revalidatePath('/admin/customizations');
    revalidatePath('/build');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save customization category:', err);
    return { success: false, error: err.message || 'Failed to save category.' };
  }
}

export async function deleteCustomizationCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    const adminClient = getAdminClient();
    const current = await getAdminCustomizations();
    const filtered = current.filter(c => c.id !== categoryId);

    const { error } = await adminClient.from('site_content').upsert({
      section_id: 'customization_categories',
      content: filtered,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;
    revalidatePath('/admin/customizations');
    revalidatePath('/build');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete customization category:', err);
    return { success: false, error: err.message || 'Failed to delete category.' };
  }
}

export async function saveCustomizationOption(option: CustomizationOption): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    const adminClient = getAdminClient();
    const current = await getAdminCustomizations();

    const catIndex = current.findIndex(c => c.id === option.category_id);
    if (catIndex === -1) {
      return { success: false, error: 'Target customization category not found.' };
    }

    const category = current[catIndex];
    const options = category.options || [];
    const optIndex = options.findIndex(o => o.id === option.id);

    let updatedOptions: CustomizationOption[];
    if (optIndex >= 0) {
      updatedOptions = [...options];
      updatedOptions[optIndex] = { ...option, price: Number(option.price) || 0 };
    } else {
      updatedOptions = [...options, { ...option, price: Number(option.price) || 0 }];
    }

    const updatedCategories = [...current];
    updatedCategories[catIndex] = { ...category, options: updatedOptions };

    const { error } = await adminClient.from('site_content').upsert({
      section_id: 'customization_categories',
      content: updatedCategories,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;
    revalidatePath('/admin/customizations');
    revalidatePath('/build');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save customization option:', err);
    return { success: false, error: err.message || 'Failed to save option.' };
  }
}

export async function deleteCustomizationOption(categoryId: string, optionId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    const adminClient = getAdminClient();
    const current = await getAdminCustomizations();

    const catIndex = current.findIndex(c => c.id === categoryId);
    if (catIndex === -1) return { success: false, error: 'Category not found.' };

    const category = current[catIndex];
    const filteredOptions = (category.options || []).filter(o => o.id !== optionId);

    const updatedCategories = [...current];
    updatedCategories[catIndex] = { ...category, options: filteredOptions };

    const { error } = await adminClient.from('site_content').upsert({
      section_id: 'customization_categories',
      content: updatedCategories,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;
    revalidatePath('/admin/customizations');
    revalidatePath('/build');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete customization option:', err);
    return { success: false, error: err.message || 'Failed to delete option.' };
  }
}
