'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import { Event } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export async function getPublicEvents(occasionId?: string): Promise<Event[]> {
  const supabase = await createClient();
  let query = supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (occasionId) {
    query = query.eq('occasion_id', occasionId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching public events:', error.message || error);
    return [];
  }
  return data as Event[];
}

export async function getPublicEventBySlug(slug: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as Event;
}

// Admin: all events for one occasion, including inactive ones (used to manage
// the inline "Events" list on that occasion's edit page)
export async function getEventsByOccasion(occasionId: string): Promise<Event[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('occasion_id', occasionId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching events for occasion:', error.message || error);
    return [];
  }
  return data as Event[];
}

// Admin: full event list across all occasions (used by Product form's event tagging)
export async function getAllEvents(): Promise<Event[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching all events:', error.message || error);
    return [];
  }
  return data as Event[];
}

export async function createEvent(data: {
  occasion_id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  display_order?: number;
}) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      occasion_id: data.occasion_id,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      image_url: data.image_url || null,
      is_active: data.is_active ?? true,
      display_order: data.display_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/occasions');
  revalidatePath(`/admin/occasions/${data.occasion_id}`);
  return { event: event as Event };
}

export async function updateEvent(id: string, data: {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  display_order?: number;
}) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from('events')
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      image_url: data.image_url || null,
      is_active: data.is_active ?? true,
      display_order: data.display_order ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating event:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/occasions');
  if (event?.occasion_id) revalidatePath(`/admin/occasions/${event.occasion_id}`);
  return { event: event as Event };
}

export async function deleteEvent(id: string, occasionId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) {
    if (error.code === '23503') {
      return { error: 'Cannot delete this event because it is currently linked to products or hampers.' };
    }
    return { error: error.message };
  }

  revalidatePath('/admin/occasions');
  revalidatePath(`/admin/occasions/${occasionId}`);
  return { success: true };
}
