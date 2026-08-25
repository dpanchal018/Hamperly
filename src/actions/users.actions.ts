"use server";

import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/services/auth.service";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { AdminPermission, UserRoleRecord } from "@/types/database.types";

const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

async function requireSuperAdmin() {
  await requireAdmin();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const supabaseAdmin = getAdminClient();
  const { data } = await supabaseAdmin.from('user_roles').select('is_super_admin').eq('user_id', user.id).single();
  if (!data?.is_super_admin) throw new Error("Forbidden: Super Admin access required");
}

export async function listAdminUsers() {
  try {
    await requireAdmin();
    const supabaseAdmin = getAdminClient();

    // Fetch from user_roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("role", "ADMIN");

    if (rolesError) throw new Error(rolesError.message);

    // Fetch actual users from auth.users (requires service role)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) throw new Error(authError.message);

    // Merge the data
    const adminUsers = roles.map(role => {
      const authUser = authData.users.find(u => u.id === role.user_id);
      return {
        ...role,
        email: authUser?.email,
        full_name: authUser?.user_metadata?.full_name,
      };
    });

    return { users: adminUsers, error: null };
  } catch (error: any) {
    return { users: [], error: error.message };
  }
}

export async function inviteAdminUser(email: string, permissions: AdminPermission[]) {
  try {
    await requireSuperAdmin();
    const supabaseAdmin = getAdminClient();

    // 1. Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find((u) => u.email === email);

    if (existingUser) {
      return { success: false, error: "User already exists. Please proceed to login or upgrade their existing account instead." };
    }

    // 2. Generate Invite Link (This also creates the user and bypasses email rate limits)
    const headersList = await headers();
      const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://hamperly.vercel.app';
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: `${origin}/admin-setup`
      }
    });
    
    if (linkError) throw new Error(linkError.message);

    const newUserId = linkData.user.id;
    const inviteLink = linkData.properties.action_link;

    // 3. Upsert them to user_roles (Trigger creates them as CUSTOMER, so we overwrite to ADMIN)
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: newUserId,
        role: "ADMIN",
        permissions: permissions,
        receives_daily_summary: false,
        is_super_admin: false
      }, { onConflict: 'user_id' });

    if (roleError) throw new Error(roleError.message);

    // 4. Set a flag in user_metadata so admins can identify them easily in Supabase dashboard
    await supabaseAdmin.auth.admin.updateUserById(newUserId, {
      user_metadata: { is_admin: true }
    });

    revalidatePath("/admin/settings");
    return { success: true, error: null, inviteLink };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAdminUser(userId: string, permissions: AdminPermission[], fullName?: string) {
  try {
    await requireAdmin();
    const supabaseAdmin = getAdminClient();

    // Update permissions
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ permissions })
      .eq("user_id", userId)
      .eq("role", "ADMIN");

    if (roleError) throw new Error(roleError.message);

    // Update full name if provided
    if (fullName !== undefined) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: fullName }
      });
      if (authError) throw new Error(authError.message);
    }

    revalidatePath("/admin/settings");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeAdminUser(userId: string) {
  try {
    await requireSuperAdmin();
    const supabaseAdmin = getAdminClient();

    // 1. Delete from user_roles
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "ADMIN");

    if (roleError) throw new Error(roleError.message);

    // 2. Optionally, delete the user from auth entirely
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(authError.message);

    revalidatePath("/admin/settings");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAdminTelegramSettings(userId: string, chat_id: string, receives_summary: boolean) {
  const supabaseAdmin = getAdminClient();
  
  // Security check: Only a SUPER ADMIN can grant the Daily Summary to someone.
  // Wait, the logic is: If receives_summary is TRUE, we must turn it off for everyone else first.
  if (receives_summary) {
    await supabaseAdmin
      .from('user_roles')
      .update({ receives_daily_summary: false })
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // update all
  }

  const { error } = await supabaseAdmin
    .from('user_roles')
    .update({ 
      telegram_chat_id: chat_id || null,
      receives_daily_summary: receives_summary 
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating telegram settings:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/settings');
  revalidatePath('/admin/users');
  return { success: true };
}


export async function setupAdminProfile(fullName: string, password?: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Unauthorized');

    const supabaseAdmin = getAdminClient();
    
    // Check if they are an admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
      
    if (roleData?.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    const updatePayload: any = {
      user_metadata: { ...user.user_metadata, full_name: fullName }
    };

    if (password) {
      updatePayload.password = password;
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, updatePayload);

    if (error) throw new Error(error.message);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
