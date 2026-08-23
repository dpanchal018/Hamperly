"use server";

import { createClient } from "@supabase/supabase-js";
import { getCurrentUserRole } from "@/services/auth.service";
import { revalidatePath } from "next/cache";

export async function updateSiteContent(sectionId: string, content: any) {
  try {
    const role = await getCurrentUserRole();
    if (role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    // Use service role key to bypass RLS for this specific admin action
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { error } = await supabaseAdmin
      .from("site_content")
      .update({ content: content })
      .eq('section_id', sectionId);

    if (error) {
      console.error("Error updating site content:", error);
      return { error: error.message };
    }

    revalidatePath('/', 'layout');
    revalidatePath('/admin/content');
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update content" };
  }
}
