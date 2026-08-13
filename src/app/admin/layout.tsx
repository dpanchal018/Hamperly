import { redirect } from 'next/navigation';
import { requireAdmin } from '@/services/auth.service';
import Link from 'next/link';
import { Package, Calendar, Folder, LayoutDashboard, Image as ImageIcon, Settings } from 'lucide-react';
import { PageTransition } from '@/components/ui/AnimatedWrapper';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/unauthorized');
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      {/* Sidebar with Glassmorphism */}
      <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col shadow-sm relative z-20">
        <div className="p-6">
          <Link href="/admin" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform duration-300">
              H
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">Hamperly</h1>
          </Link>
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
          <Link href="/admin/occasions" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
            <Calendar className="w-4 h-4 mr-3" />
            Occasions
          </Link>
          <Link href="/admin/categories" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
            <Folder className="w-4 h-4 mr-3" />
            Categories
          </Link>
          <Link href="/admin/ai-designs" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200">
            <ImageIcon className="w-4 h-4 mr-3" />
            AI Designs
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-slate-500 rounded-lg hover:bg-slate-100 transition-colors duration-200">
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </button>
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
