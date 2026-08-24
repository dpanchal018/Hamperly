"use server";

import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/services/auth.service";
import { revalidatePath } from "next/cache";
import { AdminPermission, UserRoleRecord } from "@/types/database.types";

const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

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
    await requireAdmin();
    const supabaseAdmin = getAdminClient();

    // 1. Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find((u) => u.email === email);

    if (existingUser) {
      return { success: false, error: "User already exists. Please proceed to login or upgrade their existing account instead." };
    }

    // 2. Invite the user
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (inviteError) throw new Error(inviteError.message);

    const newUserId = inviteData.user.id;

    // 3. Upsert them to user_roles (Trigger creates them as CUSTOMER, so we overwrite to ADMIN)
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: newUserId,
        role: "ADMIN",
        permissions: permissions
      }, { onConflict: 'user_id' });

    if (roleError) throw new Error(roleError.message);

    // 4. Set a flag in user_metadata so admins can identify them easily in Supabase dashboard
    await supabaseAdmin.auth.admin.updateUserById(newUserId, {
      user_metadata: { is_admin: true }
    });

    revalidatePath("/admin/settings");
    return { success: true, error: null };
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
    await requireAdmin();
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
