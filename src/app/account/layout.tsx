import { redirect } from 'next/navigation';
import { requireCustomer } from '@/services/auth.service';
import Link from 'next/link';
import { User, Package, ShoppingBag, LayoutDashboard, LogOut } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Toaster } from 'react-hot-toast';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireCustomer();
  } catch (error) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Toaster position="top-right" />
      
      {/* Sidebar for Desktop */}
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 flex justify-between md:justify-center items-center">
          <Logo className="scale-75 origin-left md:origin-center" />
        </div>
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible p-4 gap-2 md:gap-1 flex-1">
          <Link href="/account" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors shrink-0">
            <LayoutDashboard className="w-4 h-4 mr-3" />
            Overview
          </Link>
          <Link href="/account/purchases" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors shrink-0">
            <ShoppingBag className="w-4 h-4 mr-3" />
            Purchase History
          </Link>
          <Link href="/account/hampers" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors shrink-0">
            <Package className="w-4 h-4 mr-3" />
            My Hampers
          </Link>
          <Link href="/account/profile" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors shrink-0">
            <User className="w-4 h-4 mr-3" />
            My Profile
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-100 hidden md:block">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-slate-500 rounded-lg hover:bg-slate-100 transition-colors">
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
