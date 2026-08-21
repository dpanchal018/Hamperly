'use server';

import { createClient } from '@/lib/supabase/server';
import { Customer } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export async function createCustomer(data: Partial<Customer>) {
  const supabase = await createClient();
  
  const { data: customer, error } = await supabase
    .from('customers')
    .insert([{
      ...data,
      customer_reference: data.customer_reference || `CUS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/customers-purchases');
  return { customer };
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  const supabase = await createClient();
  
  const { data: customer, error } = await supabase
    .from('customers')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/customers-purchases');
  revalidatePath(`/admin/customers-purchases/customer/${id}`);
  return { customer };
}

export async function searchCustomers(query: string) {
  const supabase = await createClient();
  
  // Basic search across name, mobile, email
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .or(`full_name.ilike.%${query}%,mobile_number.ilike.%${query}%,email.ilike.%${query}%`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching customers:', error);
    return { error: error.message };
  }

  return { customers };
}

export async function getCustomerDetails(id: string) {
  const supabase = await createClient();
  
  const { data: customer, error } = await supabase
    .from('customers')
    .select(`
      *,
      purchases (
        *,
        purchase_items ( * )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error getting customer details:', error);
    return { error: error.message };
  }

  return { customer };
}

export async function checkDuplicateCustomer(mobile?: string, email?: string) {
  const supabase = await createClient();
  let query = supabase.from('customers').select('id, full_name, mobile_number, email').eq('is_active', true);
  
  if (mobile && email) {
    query = query.or(`mobile_number.eq.${mobile},email.eq.${email}`);
  } else if (mobile) {
    query = query.eq('mobile_number', mobile);
  } else if (email) {
    query = query.eq('email', email);
  } else {
    return { duplicates: [] };
  }

  const { data: duplicates, error } = await query.limit(5);

  if (error) {
    console.error('Error checking duplicate customer:', error);
    return { error: error.message };
  }

  return { duplicates };
}
