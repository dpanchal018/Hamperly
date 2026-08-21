'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelection } from '@/contexts/SelectionContext';
import { Gift, Search, Menu, X, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

import { Logo } from '@/components/ui/Logo';
import { NotificationBell } from './NotificationBell';

export function Navbar({ user }: { user: any }) {
  const pathname = usePathname();
  const { totalItems } = useSelection();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Occasions', href: '/occasions' },
    { name: 'Hampers', href: '/hampers' },
    { name: 'Explore', href: '/products' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Logo */}
        <Logo className="scale-75 origin-left" withTagline={false} />

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href ? 'text-primary' : 'text-foreground'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Link href="/products" className="hidden md:flex text-slate-500 hover:text-slate-900 transition-colors">
            <Search className="w-5 h-5" />
            <span className="sr-only">Search products</span>
          </Link>
          
          <div className="relative group flex items-center space-x-2">
            <Button variant="outline" size="sm" className="hidden md:flex rounded-full border-slate-200 text-slate-700 bg-white">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Build a Hamper
              {totalItems > 0 && (
                <span className="ml-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </Button>

            <CartButton />
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <NotificationBell />
                <Link href="/account" className="inline-flex items-center justify-center rounded-full bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 text-sm font-medium transition-colors">
                  My Account
                </Link>
              </>
            ) : (
              <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-1.5 text-sm font-medium transition-colors">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <nav className="flex flex-col p-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-lg font-medium ${
                  pathname === link.href ? 'text-primary' : 'text-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-border flex items-center justify-between text-foreground">
              <span className="font-medium">Your Selection ({totalItems})</span>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="pt-4 border-t border-border">
              {user ? (
                <Link href="/account" className="block text-lg font-medium text-rose-600" onClick={() => setMobileMenuOpen(false)}>My Account</Link>
              ) : (
                <Link href="/login" className="block text-lg font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function CartButton() {
  const { totalItems, setIsCartOpen } = require('@/contexts/CartContext').useCart();
  
  return (
    <button 
      onClick={() => setIsCartOpen(true)}
      className="relative p-2 text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors flex items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
      {totalItems > 0 && (
        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white ring-2 ring-white">
          {totalItems}
        </span>
      )}
    </button>
  );
}
