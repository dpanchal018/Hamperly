import { redirect } from 'next/navigation';
import { requireAdmin } from '@/services/auth.service';
import Link from 'next/link';
import { Package, Calendar, Folder, LayoutDashboard, Image as ImageIcon, Settings } from 'lucide-react';
import { PageTransition } from '@/components/ui/AnimatedWrapper';
import { Logo } from '@/components/ui/Logo';
import { Toaster } from 'react-hot-toast';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-rose-200">
      <Toaster position="top-right" />
      {/* Sidebar with Glassmorphism */}
      <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col shadow-sm relative z-20">
        <div className="p-6">
          <Logo className="scale-75 origin-left" />
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-2">
          <Link href="/admin" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
            <LayoutDashboard className="w-4 h-4 mr-3" />
            Dashboard
          </Link>
          <Link href="/admin/products" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
            <Package className="w-4 h-4 mr-3" />
            Products
          </Link>
          <Link href="/admin/hampers" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            Hampers
          </Link>
          <Link href="/admin/occasions" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
            <Calendar className="w-4 h-4 mr-3" />
            Occasions
          </Link>
          <Link href="/admin/categories" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
            <Folder className="w-4 h-4 mr-3" />
            Categories
          </Link>
          {/* Parked for future: Requires OpenAI license
          <Link href="/admin/ai-designs" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
            <ImageIcon className="w-4 h-4 mr-3" />
            AI Designs
          </Link>
          */}
          <Link href="/admin/customers" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Customers
          </Link>
          <Link href="/admin/customers-purchases" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Purchases
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <Link href="/admin/settings" className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-slate-500 rounded-lg hover:bg-slate-100 transition-colors duration-200">
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50/20 to-slate-50">
        <PageTransition className="p-8 max-w-7xl mx-auto min-h-full">
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
