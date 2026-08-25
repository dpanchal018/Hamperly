import { createClient as createServerClient } from "@/lib/supabase/server";
import { User, Phone, Mail, ShieldCheck } from "lucide-react";
import { ProfileForm } from "./ProfileForm";

export const metadata = {
  title: "Profile Settings | Hamperly",
};

export default async function ProfilePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-rose-100 p-3 rounded-full text-rose-600">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900">Profile Settings</h2>
      </div>

      <div className="max-w-xl">
        {/* Read-only Auth Info */}
        <div className="mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
          <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0 mt-1">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Account Security</h4>
            <p className="text-sm text-slate-500 mb-2">You are logged in with a secure, verified account.</p>
            <div className="flex items-center text-sm font-medium text-slate-700">
              <Mail className="w-4 h-4 mr-2 text-slate-400" />
              {user.email}
            </div>
          </div>
        </div>

        {/* Update Form */}
        <ProfileForm 
          initialName={customer?.full_name || ""} 
          initialPhone={customer?.mobile_number || ""} 
        />
      </div>
    </div>
  );
}
