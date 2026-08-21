'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import { StoreSettings } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export async function getStoreSettings(): Promise<{ settings: StoreSettings | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { settings: null, error: null }; // No rows found
      }
      return { settings: null, error: error.message };
    }

    return { settings: data as StoreSettings, error: null };
  } catch (error: any) {
    return { settings: null, error: error.message || 'Failed to fetch settings' };
  }
}

export async function updateStoreSettings(settingsData: Partial<StoreSettings>): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    const { error } = await supabase
      .from('store_settings')
      .update({
        ...settingsData,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update settings' };
  }
}
