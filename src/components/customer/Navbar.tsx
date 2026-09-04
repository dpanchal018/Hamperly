'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Search, Menu, X, Heart, ShoppingBag, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

import { NotificationBell } from './NotificationBell';
import { ProfileDropdown } from './ProfileDropdown';

import { HeaderContent, Occasion } from '@/types/database.types';


function WishlistNavButton() {
  const { wishlistedHampers, wishlistedProducts, isLoaded } = useWishlist();
  const totalItems = wishlistedHampers.size + wishlistedProducts.size;
  
  return (
    <Link 
      href="/account/wishlist"
      className="relative text-foreground/70 hover:text-primary transition-colors p-2"
      aria-label="Wishlist"
    >
      <Heart className="w-5 h-5" strokeWidth={1.5} />
      {isLoaded && totalItems > 0 && (
        <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
          {totalItems}
        </span>
      )}
      <span className="sr-only">Wishlist</span>
    </Link>
  );
}

function CartButton() {
  const { setIsCartOpen, totalItems } = useCart();
  return (
    <button 
      onClick={() => setIsCartOpen(true)}
      className="relative text-foreground/70 hover:text-primary transition-colors p-2"
    >
      <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
      {totalItems > 0 && (
        <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
          {totalItems}
        </span>
      )}
    </button>
  );
}

export function Navbar({ user, role, content, occasions = [] }: { user: any; role?: string | null; content: HeaderContent, occasions?: Occasion[] }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOccasionsOpen, setMobileOccasionsOpen] = useState(false);

  // Filter out Occasions from header nav links
  const navLinks = (content.navLinks || []).filter(link => link.href !== '/occasions');

  const parentOccasions = occasions.filter(o => !o.parent_id);
  const childOccasions = occasions.filter(o => o.parent_id);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-primary/10 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold transition-colors hover:text-primary ${
                pathname === link.href ? 'text-primary' : 'text-foreground/70'
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Occasions Flyout Dropdown */}
          {parentOccasions.length > 0 && (
            <div className="group/nav relative">
              <button className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors flex items-center py-4">
                Occasions
                <ChevronDown className="w-4 h-4 ml-1 transition-transform group-hover/nav:rotate-180" />
              </button>
              
              {/* Level 1 Dropdown */}
              <ul className="absolute left-0 top-full hidden group-hover/nav:block bg-white border border-slate-100 shadow-xl rounded-xl py-2 min-w-[240px] z-50">
                {parentOccasions.map(parent => {
                  const children = childOccasions.filter(child => child.parent_id === parent.id);
                  const hasChildren = children.length > 0;
                  
                  return (
                    <li key={parent.id} className="group/item relative px-4 py-2 hover:bg-slate-50 transition-colors">
                      <Link href={`/occasions/${parent.slug}`} className="flex justify-between items-center w-full text-sm font-medium text-slate-700 hover:text-primary">
                        {parent.name}
                        {hasChildren && <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </Link>
                      
                      {/* Level 2 Flyout (Right side) */}
                      {hasChildren && (
                        <ul className="absolute left-full top-0 hidden group-hover/item:block bg-white border border-slate-100 shadow-xl rounded-xl py-2 min-w-[200px] z-50 -ml-1">
                          {children.map(child => (
                            <li key={child.id} className="px-4 py-2 hover:bg-slate-50 transition-colors">
                              <Link href={`/occasions/${child.slug}`} className="text-sm text-slate-600 hover:text-primary block">
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>

        {/* Logo */}
        <div className="flex-1 flex md:justify-center">
          <Link href="/" className="inline-block group">
             <div className="bg-white border border-primary/20 shadow-sm shadow-primary/5 rounded-full px-6 py-2 transition-transform group-hover:scale-105">
                <h2 className="text-3xl font-script text-primary leading-none pt-1">{content.logoText}</h2>
             </div>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 flex-1">
          <Link href="/products" className="hidden md:flex text-foreground/70 hover:text-primary transition-colors p-2">
            <Search className="w-5 h-5" strokeWidth={1.5} />
            <span className="sr-only">Search</span>
          </Link>

          <WishlistNavButton />
          {user && <NotificationBell />}
          <CartButton />

          <div className="hidden md:flex items-center gap-3 ml-2">
            {user ? (
              <ProfileDropdown user={user} role={role} />
            ) : (
              <Link href="/login">
                <Button variant="outline" className="rounded-full border-primary/20 text-primary hover:bg-primary/5">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-foreground/70 hover:text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" strokeWidth={1.5} /> : <Menu className="w-6 h-6" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary/10 bg-white max-h-[80vh] overflow-y-auto">
          <nav className="flex flex-col p-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-semibold ${
                  pathname === link.href ? 'text-primary' : 'text-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Mobile Occasions Accordion */}
            {parentOccasions.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <button 
                  className="flex items-center justify-between w-full text-base font-semibold text-foreground"
                  onClick={() => setMobileOccasionsOpen(!mobileOccasionsOpen)}
                >
                  Occasions
                  <ChevronDown className={`w-5 h-5 transition-transform ${mobileOccasionsOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileOccasionsOpen && (
                  <div className="mt-4 pl-4 space-y-4">
                    {parentOccasions.map(parent => (
                      <div key={parent.id} className="space-y-2">
                        <Link 
                          href={`/occasions/${parent.slug}`} 
                          className="block font-semibold text-primary"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {parent.name}
                        </Link>
                        {childOccasions.filter(child => child.parent_id === parent.id).map(child => (
                          <Link 
                            key={child.id}
                            href={`/occasions/${child.slug}`} 
                            className="block text-sm text-slate-600 pl-4 py-1"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-primary/10 flex flex-col space-y-4">
              <Link href="/products" className="flex items-center text-foreground hover:text-primary py-2" onClick={() => setMobileMenuOpen(false)}>
                <Search className="w-5 h-5 mr-3" strokeWidth={1.5} />
                Search
              </Link>
              {user ? (
                <Link href="/account" className="text-foreground hover:text-primary font-semibold py-2" onClick={() => setMobileMenuOpen(false)}>
                  My Account
                </Link>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-full bg-primary text-white hover:bg-primary/90">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
