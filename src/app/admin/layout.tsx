import { redirect } from 'next/navigation';
import { requireAdmin } from '@/services/auth.service';
import { PageTransition } from '@/components/ui/AnimatedWrapper';
import { Toaster } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/server';
import AdminCopilotWrapper from '@/components/admin/AdminCopilotWrapper';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let currentUser;
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    currentUser = data.user;
  } catch (error) {
    redirect('/login');
  }

  // Get initial letters for avatar
  const initials = currentUser?.user_metadata?.full_name
    ? currentUser.user_metadata.full_name.substring(0, 2).toUpperCase()
    : currentUser?.email?.substring(0, 2).toUpperCase() || 'AD';

  return (
    <div className="fixed inset-0 flex bg-slate-50 text-slate-900 font-sans selection:bg-rose-200">
      <Toaster position="top-right" />
      
      {/* Sleek Mini Sidebar */}
      <AdminSidebar currentUser={currentUser} initials={initials} />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50/20 to-slate-50">
        <PageTransition className="p-8 max-w-7xl mx-auto min-h-full">
          {children}
        </PageTransition>
      </main>
      
      <AdminCopilotWrapper />
    </div>
  );
}
