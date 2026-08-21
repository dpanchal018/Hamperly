'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { NotificationType } from '@/types/database.types';
import { getCurrentUser } from '@/services/auth.service';

// --- INTERNAL ADMIN/SYSTEM ACTIONS ---
// These are not exported for direct client use, but are called by other trusted server actions

export async function createNotification(data: {
  customer_id: string;
  purchase_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: any;
}) {
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin.from('notifications').insert([{
    ...data,
    is_read: false
  }]);

  if (error) {
    console.error('Error creating notification:', error);
  }
}

// --- CUSTOMER FACING ACTIONS ---

export async function getMyNotifications() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized', notifications: [] };

  const supabase = await createClient();

  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!customers) return { error: 'Customer profile not found', notifications: [] };

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id, type, title, message, is_read, created_at, purchase_id')
    .eq('customer_id', customers.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return { error: error.message, notifications: [] };
  
  return { notifications };
}

export async function getUnreadNotificationCount() {
  const user = await getCurrentUser();
  if (!user) return { count: 0 };

  const supabase = await createClient();

  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!customers) return { count: 0 };

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customers.id)
    .eq('is_read', false);

  if (error) return { count: 0 };

  return { count: count || 0 };
}

export async function markNotificationAsRead(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
    // RLS ensures they can only update their own notification

  if (error) return { error: error.message };
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const supabase = await createClient();
  
  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!customers) return { error: 'Customer not found' };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('customer_id', customers.id)
    .eq('is_read', false);

  if (error) return { error: error.message };
  
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/account/notifications');
  
  return { success: true };
}
