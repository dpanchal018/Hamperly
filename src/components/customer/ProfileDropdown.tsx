'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LayoutDashboard, ShoppingBag, Package, LogOut, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProfileDropdown({ user, role }: { user?: any; role?: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Extract initials
  const fullName = user?.user_metadata?.full_name || (role === 'ADMIN' ? 'Admin' : 'Customer');
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-9 h-9 rounded-full text-white font-semibold transition-colors ring-2 shadow-sm ${
          role === 'ADMIN' ? 'bg-indigo-600 hover:bg-indigo-700 ring-indigo-100' : 'bg-rose-600 hover:bg-rose-700 ring-rose-100'
        }`}
        title={fullName}
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-2">
            {role === 'ADMIN' ? (
              <>
                <Link 
                  href="/admin" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 mr-3" />
                  Admin Dashboard
                </Link>
                <Link 
                  href="/admin/products" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  <Package className="w-4 h-4 mr-3" />
                  Manage Products
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/account" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 mr-3" />
                  Overview
                </Link>
                <Link 
                  href="/account/profile" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile Settings
                </Link>
                <Link 
                  href="/account/purchases" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 mr-3" />
                  Purchase History
                </Link>
                <Link 
                  href="/account/hampers" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                >
                  <Package className="w-4 h-4 mr-3" />
                  My Hampers
                </Link>
              </>
            )}
          </div>
          <div className="border-t border-slate-100 py-2">
            <form action="/api/auth/logout" method="POST">
              <button 
                type="submit" 
                className="flex items-center w-full px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
