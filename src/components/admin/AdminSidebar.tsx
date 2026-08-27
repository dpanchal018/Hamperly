"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, Calendar, Folder, LayoutDashboard, 
  Image as ImageIcon, Settings, Star, Users, 
  ShoppingBag, CheckCircle
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Hampers", href: "/admin/hampers", icon: ShoppingBag },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Occasions", href: "/admin/occasions", icon: Calendar },
  { name: "Categories", href: "/admin/categories", icon: Folder },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Purchases", href: "/admin/customers-purchases", icon: CheckCircle },
  { name: "Content", href: "/admin/content", icon: ImageIcon },
];

export function AdminSidebar({ currentUser, initials }: { currentUser: any, initials: string }) {
  const pathname = usePathname();

  return (
    <aside className="group flex flex-col h-full bg-white border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-[width] duration-300 ease-in-out w-[80px] hover:w-[260px] relative z-50 overflow-hidden">
      
      {/* Top Logo Section */}
      <div className="h-20 flex items-center justify-center shrink-0 border-b border-slate-50 relative">
        {/* Collapsed Icon */}
        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm">
            H
          </div>
        </div>
        {/* Expanded Logo */}
        <div className="absolute inset-0 flex items-center justify-start px-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap">
          <Logo className="scale-[0.65] origin-left" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex items-center px-4 mx-3 py-3 rounded-xl transition-all duration-200 relative
                ${isActive 
                  ? 'bg-indigo-50/80 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.1)]' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center justify-center shrink-0 w-6">
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              </div>
              <span className={`ml-3 text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 ${isActive ? 'translate-x-0' : '-translate-x-2 group-hover:translate-x-0'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
      
      {/* Bottom Settings & User Profile */}
      <div className="shrink-0 border-t border-slate-100 bg-white">
        
        {/* Settings Link */}
        <div className="p-3 w-[260px]">
          <Link href="/admin/settings" className="flex items-center px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors duration-200">
            <div className="flex items-center justify-center shrink-0 w-6">
              <Settings className="w-[18px] h-[18px] stroke-[2px]" />
            </div>
            <span className="ml-3 text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Settings
            </span>
          </Link>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-50 flex items-center justify-between h-[72px] w-[260px]">
          <div className="flex items-center overflow-hidden">
            <div className="relative shrink-0 flex items-center justify-center w-12 h-12">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-rose-50 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200/50 shadow-sm transition-transform duration-300 group-hover:scale-100">
                {initials}
              </div>
              <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="ml-3 flex-1 flex flex-col justify-center whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {currentUser?.user_metadata?.full_name || 'Admin User'}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                {currentUser?.email}
              </p>
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0">
            <AdminLogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
