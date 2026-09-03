'use server';

import { createClient } from '@/lib/supabase/server';
import { Customer } from '@/types/database.types';
import { revalidatePath } from 'next/cache';
import { validatePhoneNumber } from '@/lib/phone';

export async function createCustomer(data: Partial<Customer>) {
  if (data.mobile_number) {
    const phoneValidation = validatePhoneNumber(data.mobile_number);
    if (!phoneValidation.isValid) {
      return { error: phoneValidation.error || "Please enter a valid phone number." };
    }
    data.mobile_number = phoneValidation.normalized || data.mobile_number;
  }

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
  if (data.mobile_number) {
    const phoneValidation = validatePhoneNumber(data.mobile_number);
    if (!phoneValidation.isValid) {
      return { error: phoneValidation.error || "Please enter a valid phone number." };
    }
    data.mobile_number = phoneValidation.normalized || data.mobile_number;
  }

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
  if (mobile) {
    const parsed = validatePhoneNumber(mobile);
    if (parsed.isValid && parsed.normalized) {
      mobile = parsed.normalized;
    }
  }

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

export async function getAllCustomers() {
  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting all customers:', error);
    return { error: error.message };
  }

  return { customers };
}

export async function updateCustomerProfile(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const fullName = formData.get("fullName") as string;
    const mobileNumber = formData.get("mobileNumber") as string;

    if (!fullName || fullName.trim().length < 2) {
      return { success: false, error: "Please enter a valid full name." };
    }

    let normalizedPhone = null;
    if (mobileNumber) {
      const phoneValidation = validatePhoneNumber(mobileNumber);
      if (!phoneValidation.isValid) {
        return { success: false, error: phoneValidation.error || "Please enter a valid phone number." };
      }
      normalizedPhone = phoneValidation.normalized;
    }

    const { error } = await supabase
      .from("customers")
      .update({
        full_name: fullName.trim(),
        mobile_number: normalizedPhone
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Profile update error:", error);
      return { success: false, error: "Failed to update profile." };
    }

    revalidatePath("/account/profile");
    revalidatePath("/account/layout");
    
    return { success: true };
  } catch (error: any) {
    console.error("Profile update exception:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
