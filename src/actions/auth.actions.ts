'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const keepLoggedIn = formData.get('keepLoggedIn') === 'on'

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient(keepLoggedIn)

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // Check their role
  if (authData.user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .single();

    if (roleData?.role === 'ADMIN') {
      redirect('/admin');
    } else {
      const redirectTo = formData.get('redirect') as string;
      if (redirectTo && redirectTo.startsWith('/')) {
        redirect(redirectTo);
      }
      redirect('/');
    }
  }

  redirect('/')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string

  if (!email || !password || !full_name) {
    redirect('/signup?error=All fields are required')
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
    redirect('/signup?error=User already exists. Please proceed to login.')
  }

  // Create user directly via admin API (auto-confirms email)
  const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
    }
  })

  if (adminError) {
    redirect(`/signup?error=${encodeURIComponent(adminError.message)}`)
  }

  // Now log the user in to establish the session cookies
  const supabase = await createClient()
  const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (loginError) {
    redirect(`/signup?error=${encodeURIComponent(loginError.message)}`)
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

  const redirectTo = formData.get('redirect') as string;
  if (redirectTo && redirectTo.startsWith('/')) {
    redirect(redirectTo);
  }
  redirect('/');
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
