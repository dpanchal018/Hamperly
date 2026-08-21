import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/types/database.types';

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return null;
  }
  
  return data.role as UserRole;
}

export async function requireAdmin(): Promise<boolean> {

  const role = await getCurrentUserRole();
  if (role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  return true;
}

export async function requireCustomer(): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (role !== 'CUSTOMER') {
    throw new Error('Unauthorized: Customer access required');
  }
  return true;
}
