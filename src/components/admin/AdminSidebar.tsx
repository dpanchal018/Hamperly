'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Calendar, Folder, LayoutDashboard, Image as ImageIcon, Settings, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export function AdminSidebar() {
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
  const closeMobile = () => setIsMobileOpen(false);
  const toggleDesktop = () => setIsDesktopOpen(!isDesktopOpen);

  return (
    <>
      {/* Mobile Burger Menu Button */}
      <button 
        onClick={toggleMobile}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40 flex flex-col
        bg-white/90 md:bg-white/80 backdrop-blur-xl border-r border-slate-200 shadow-lg md:shadow-sm 
        transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isDesktopOpen ? 'md:w-64' : 'md:w-20'}
        w-64
      `}>
        {/* Sidebar Header */}
        <div className={`p-6 md:pt-6 pt-16 flex items-center overflow-hidden h-24 ${isDesktopOpen ? 'justify-between' : 'justify-center'}`}>
          <div className={`transition-opacity duration-300 whitespace-nowrap ${isDesktopOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden md:block'}`}>
             <Logo className="scale-75 origin-left" />
          </div>
          <button 
            onClick={toggleDesktop}
            className="hidden md:block p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto overflow-x-hidden whitespace-nowrap">
          <Link href="/admin" onClick={closeMobile} className={`flex items-center py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200 ${isDesktopOpen ? 'px-4' : 'justify-center'}`}>
            <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${isDesktopOpen ? 'mr-3' : ''}`} />
            <span className={isDesktopOpen ? 'block' : 'hidden'}>Dashboard</span>
          </Link>
          <Link href="/admin/products" onClick={closeMobile} className={`flex items-center py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200 ${isDesktopOpen ? 'px-4' : 'justify-center'}`}>
            <Package className={`w-5 h-5 flex-shrink-0 ${isDesktopOpen ? 'mr-3' : ''}`} />
            <span className={isDesktopOpen ? 'block' : 'hidden'}>Products</span>
          </Link>
          <Link href="/admin/hampers" onClick={closeMobile} className={`flex items-center py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200 ${isDesktopOpen ? 'px-4' : 'justify-center'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${isDesktopOpen ? 'mr-3' : ''}`}><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            <span className={isDesktopOpen ? 'block' : 'hidden'}>Hampers</span>
          </Link>
          <Link href="/admin/occasions" onClick={closeMobile} className={`flex items-center py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200 ${isDesktopOpen ? 'px-4' : 'justify-center'}`}>
            <Calendar className={`w-5 h-5 flex-shrink-0 ${isDesktopOpen ? 'mr-3' : ''}`} />
            <span className={isDesktopOpen ? 'block' : 'hidden'}>Occasions</span>
          </Link>
          <Link href="/admin/categories" onClick={closeMobile} className={`flex items-center py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200 ${isDesktopOpen ? 'px-4' : 'justify-center'}`}>
            <Folder className={`w-5 h-5 flex-shrink-0 ${isDesktopOpen ? 'mr-3' : ''}`} />
            <span className={isDesktopOpen ? 'block' : 'hidden'}>Categories</span>
          </Link>
          <Link href="/admin/customers" onClick={closeMobile} className={`flex items-center py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200 ${isDesktopOpen ? 'px-4' : 'justify-center'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${isDesktopOpen ? 'mr-3' : ''}`}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span className={isDesktopOpen ? 'block' : 'hidden'}>Customers</span>
          </Link>
          <Link href="/admin/customers-purchases" onClick={closeMobile} className={`flex items-center py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200 ${isDesktopOpen ? 'px-4' : 'justify-center'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${isDesktopOpen ? 'mr-3' : ''}`}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span className={isDesktopOpen ? 'block' : 'hidden'}>Purchases</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-100 mt-auto">
          <Link href="/admin/settings" onClick={closeMobile} className={`flex items-center w-full py-2.5 text-sm font-medium text-slate-500 rounded-lg hover:bg-slate-100 transition-colors duration-200 ${isDesktopOpen ? 'px-4' : 'justify-center'}`}>
            <Settings className={`w-5 h-5 flex-shrink-0 ${isDesktopOpen ? 'mr-3' : ''}`} />
            <span className={isDesktopOpen ? 'block' : 'hidden'}>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
