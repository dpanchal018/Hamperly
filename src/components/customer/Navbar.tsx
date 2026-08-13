'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelection } from '@/contexts/SelectionContext';
import { Gift, Search, Menu, X, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const { totalItems } = useSelection();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Occasions', href: '/occasions' },
    { name: 'Explore', href: '/products' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-300">
            <Gift className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            Hamperly
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-rose-600 ${
                pathname === link.href ? 'text-rose-600' : 'text-slate-600'
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
          
          <div className="relative group">
            <Button variant="outline" size="sm" className="hidden md:flex rounded-full border-slate-200 text-slate-700 bg-white">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Your Selection
              {totalItems > 0 && (
                <span className="ml-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </Button>
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
        <div className="md:hidden border-t border-slate-100 bg-white">
          <nav className="flex flex-col p-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-lg font-medium ${
                  pathname === link.href ? 'text-rose-600' : 'text-slate-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-slate-600">
              <span className="font-medium">Your Selection ({totalItems})</span>
              <ShoppingBag className="w-5 h-5" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
