import { createClient as createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Package, LogOut } from "lucide-react";
import { PageTransition } from "@/components/ui/AnimatedWrapper";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/account/orders");
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("full_name")
    .eq("user_id", user.id)
    .single();

  const userName = customer?.full_name || user.email?.split("@")[0] || "Customer";

  return (
    <PageTransition className="min-h-screen pt-32 pb-24 bg-[#FAFAFA]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-serif font-bold text-slate-900">Welcome back, {userName}</h1>
          <p className="text-slate-500 mt-2">Manage your orders and personal details.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <nav className="space-y-2">
                <Link 
                  href="/account/orders"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors font-medium"
                >
                  <Package className="w-5 h-5" />
                  <span>My Orders</span>
                </Link>
                <Link 
                  href="/account/profile"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors font-medium"
                >
                  <User className="w-5 h-5" />
                  <span>Profile Settings</span>
                </Link>
                
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <form action="/api/auth/logout" method="post">
                    <button 
                      type="submit"
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </form>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
