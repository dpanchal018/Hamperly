'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { MINIMUM_AGE, ageOn, todayInIndia } from '@/lib/age'

/** Creates (or links) a customer account and signs it in. */
async function registerCustomer(formData: FormData): Promise<{ ok: true } | { error: string }> {
  const email = ((formData.get('email') as string) || '').trim()
  const password = formData.get('password') as string
  const full_name = ((formData.get('full_name') as string) || '').trim()

  if (!email || !password || !full_name) {
    return { error: 'All fields are required' }
  }

  // Indian contract law: only adults can enter into the purchase contract. The date of birth is
  // checked here on the server and never stored; only the time the age was confirmed is kept.
  const age = ageOn(((formData.get('date_of_birth') as string) || '').trim(), todayInIndia())
  if (age === null) {
    return { error: 'Please enter a valid date of birth' }
  }
  if (age < MINIMUM_AGE) {
    return { error: `You need to be ${MINIMUM_AGE} or older to create a Hamperly account` }
  }

  // Create an admin client to bypass the email confirmation requirement
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find((u) => u.email === email);

  if (existingUser) {
    return { error: 'An account with this email already exists. Please sign in.' }
  }

  // Create user directly via admin API (auto-confirms email)
  const { error: adminError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      age_confirmed_at: new Date().toISOString(),
    }
  })

  if (adminError) {
    return { error: adminError.message }
  }

  // Now log the user in to establish the session cookies
  const supabase = await createClient()
  const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (loginError) {
    return { error: loginError.message }
  }

  if (authData.user) {
    // 1. Assign CUSTOMER role
    await supabaseAdmin.from('user_roles').insert({
      user_id: authData.user.id,
      role: 'CUSTOMER'
    });

    // 2. Check if a customer record with this email already exists (created by admin)
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingCustomer) {
      // Link account
      await supabaseAdmin.from('customers').update({ user_id: authData.user.id }).eq('id', existingCustomer.id);
    } else {
      // Create new customer profile
      const { data: newCust } = await supabaseAdmin.from('customers').insert({
        user_id: authData.user.id,
        full_name,
        email,
        customer_reference: `CUS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        is_active: true
      }).select('id').single();

      if (newCust) {
        const { createNotification } = await import('./notification.actions');
        await createNotification({
          customer_id: newCust.id,
          type: 'ACCOUNT_WELCOME',
          title: 'Welcome to Hamperly 🎁',
          message: `Welcome to Hamperly, ${full_name}! We're excited to help you create memorable hampers.`
        });
      }
    }
  }

  return { ok: true }
}

/** In-page sign in for the single-page storefront: returns a result instead of redirecting. */
export async function signInInline(formData: FormData): Promise<{ error: string } | { ok: true; isAdmin: boolean }> {
  const email = ((formData.get('email') as string) || '').trim()
  const password = formData.get('password') as string
  const keepLoggedIn = formData.get('keepLoggedIn') === 'on'
  if (!email || !password) return { error: 'Email and password are required' }

  const supabase = await createClient(keepLoggedIn)
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !authData.user) return { error: error?.message || 'Unable to sign in' }

  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', authData.user.id).single();
  return { ok: true, isAdmin: roleData?.role === 'ADMIN' }
}

/** In-page sign up for the single-page storefront. */
export async function signUpInline(formData: FormData): Promise<{ error: string } | { ok: true }> {
  return registerCustomer(formData)
}

/** In-page sign out: clears the session without a redirect. */
export async function signOutInline() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
