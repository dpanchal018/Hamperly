'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth.service';
import { Customer } from '@/types/database.types';

export async function getMyProfile() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const supabase = await createClient();
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, full_name, mobile_number, email, city, address')
    .eq('user_id', user.id)
    .single();

  if (error) return { error: error.message };
  return { customer };
}

export async function updateMyProfile(data: Partial<Customer>) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const supabase = await createClient();
  
  // Explicitly only allow safe fields
  const safeData = {
    full_name: data.full_name,
    mobile_number: data.mobile_number,
    city: data.city,
    address: data.address,
    updated_at: new Date().toISOString()
  };

  const { data: updated, error } = await supabase
    .from('customers')
    .update(safeData)
    .eq('user_id', user.id)
    .select('id, full_name, mobile_number, email, city, address')
    .single();

  if (error) return { error: error.message };
  return { customer: updated };
}

export async function getMyPurchases() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const supabase = await createClient();
  
  // We rely on RLS, but we also specify exactly the customer via user_id -> customer
  const { data: customer } = await supabase.from('customers').select('id').eq('user_id', user.id).single();
  if (!customer) return { error: 'Customer profile not found' };

  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('id, purchase_date, status, payment_status, final_amount, amount_paid, amount_due, purchase_items(id, product_name_snapshot, quantity)')
    .eq('customer_id', customer.id)
    .order('purchase_date', { ascending: false });

  if (error) return { error: error.message };
  return { purchases };
}

export async function getMyPurchaseDetails(purchaseId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const supabase = await createClient();
  
  // Relying on RLS to ensure they only get their own purchase
  const { data: purchase, error } = await supabase
    .from('purchases')
    .select('id, purchase_date, status, payment_status, subtotal, discount, final_amount, amount_paid, amount_due, payment_mode, purchase_items(id, product_name_snapshot, quantity, actual_unit_price, line_total), payment_logs(id, amount, payment_mode, created_at)')
    .eq('id', purchaseId)
    .single();

  if (error) return { error: error.message };
  return { purchase };
}
