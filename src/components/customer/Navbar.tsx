'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useHamperBuilder } from '@/contexts/HamperBuilderContext';
import { useStorefront, type SectionId } from '@/contexts/StorefrontContext';
import { Search, Menu, X, Heart, ShoppingBag, Gift, ChevronDown, User } from 'lucide-react';

import { NotificationBell } from './NotificationBell';
import { ProfileDropdown } from './ProfileDropdown';
import { HamperIndicator } from './HamperIndicator';

import { HeaderContent, Occasion } from '@/types/database.types';

// The storefront is one page: the menu scrolls to its sections
const NAV: { id: SectionId; label: string }[] = [
  { id: 'shop', label: 'Shop' },
  { id: 'occasions', label: 'Occasions' },
  { id: 'studio', label: 'Hamper Studio' },
  { id: 'museum', label: 'Museum' },
  { id: 'stories', label: 'Stories' },
];

/** Highlights the menu item for the section currently in view */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<SectionId | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const els = NAV.map(n => document.getElementById(n.id)).filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id as SectionId);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5] }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [enabled]);
  return enabled ? active : null;
}

function WishlistNavButton() {
  const { wishlistedHampers, wishlistedProducts, isLoaded } = useWishlist();
  const { openAccount } = useStorefront();
  const totalItems = wishlistedHampers.size + wishlistedProducts.size;

  return (
    <button
      type="button"
      onClick={() => openAccount('wishlist')}
      className="relative grid place-items-center w-11 h-11 rounded-full text-ink hover:bg-petal transition-colors"
      aria-label={`Wishlist${isLoaded && totalItems > 0 ? `, ${totalItems} saved` : ''}`}
    >
      <Heart className="w-5 h-5" strokeWidth={1.5} />
      {isLoaded && totalItems > 0 && (
        <span className="absolute top-0.5 right-0.5 bg-rose text-white text-[10px] font-bold min-w-4 h-4 px-1 grid place-items-center rounded-full">
          {totalItems}
        </span>
      )}
    </button>
  );
}

function CartButton() {
  const { setIsCartOpen, totalItems } = useCart();
  return (
    <button
      onClick={() => setIsCartOpen(true)}
      aria-label={`Bag, ${totalItems} item${totalItems === 1 ? '' : 's'}`}
      className="flex items-center gap-2 h-11 pl-3.5 pr-4 rounded-full bg-plum text-white text-sm font-semibold hover:bg-plum-soft transition-colors"
    >
      <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={2} />
      <span className="hidden sm:inline">Bag</span>
      {totalItems > 0 && <span className="tabular-nums">· {totalItems}</span>}
    </button>
  );
}

export function Navbar({ user, role, content, occasions = [] }: { user: { id: string } | null; role?: string | null; content: HeaderContent, occasions?: Occasion[] }) {
  const pathname = usePathname();
  const onHome = pathname === '/';
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalProductsCount, totalPrice, isInitialized } = useHamperBuilder();
  const { goTo, setShopFilter, openStudio, openAuth, openAccount } = useStorefront();
  const active = useActiveSection(onHome);
  const hasHamperItems = isInitialized && totalProductsCount > 0;
  const parentOccasions = occasions.filter(o => !o.parent_id);

  // Off the home page (only the printable invoice now), menu items go back to the page sections
  const jump = (id: SectionId) => {
    setMobileMenuOpen(false);
    if (onHome) goTo(id);
    else router.push(`/?section=${id}`);
  };
  const filterOccasion = (occasionId: string) => {
    setMobileMenuOpen(false);
    if (onHome) setShopFilter({ occasion: occasionId }, { replace: true, scroll: true });
    else router.push(`/?occasion=${occasionId}`);
  };

  return (
    <header className="w-full px-3 sm:px-6 pt-3">
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border border-plum/10 rounded-full shadow-[0_10px_30px_-18px_rgba(58,18,48,.35)] pl-5 sm:pl-7 pr-2 py-1.5 flex items-center gap-4">

        <button type="button" onClick={() => jump('top')} className="font-script text-[32px] leading-none text-rose pt-1 shrink-0 transition-transform hover:scale-105" aria-label="Hamperly, back to top">
          {content.logoText}
        </button>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1 ml-4 flex-1 whitespace-nowrap" aria-label="Main">
          {NAV.map(item => {
            const isActive = active === item.id;
            if (item.id === 'occasions' && parentOccasions.length > 0) {
              return (
                <div key={item.id} className="group/nav relative">
                  <button
                    type="button"
                    onClick={() => jump('occasions')}
                    aria-current={isActive ? 'true' : undefined}
                    className={`px-4 py-2.5 rounded-full text-[15px] font-semibold transition-colors flex items-center ${isActive ? 'bg-petal text-plum' : 'text-ink hover:bg-blush'}`}
                  >
                    Occasions
                    <ChevronDown className="w-4 h-4 ml-1 transition-transform group-hover/nav:rotate-180" />
                  </button>
                  <ul className="absolute left-0 top-full hidden group-hover/nav:block group-focus-within/nav:block bg-white border border-petal-line shadow-xl rounded-2xl py-2 min-w-[240px] z-50">
                    {parentOccasions.map(o => (
                      <li key={o.id}>
                        <button type="button" onClick={() => filterOccasion(o.id)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-ink hover:bg-blush hover:text-rose">
                          {o.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => jump(item.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`px-4 py-2.5 rounded-full text-[15px] font-semibold transition-colors ${isActive ? 'bg-petal text-plum' : 'text-ink hover:bg-blush'}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 ml-auto">
          <button type="button" onClick={() => jump('shop')} className="hidden md:grid place-items-center w-11 h-11 rounded-full text-ink hover:bg-petal transition-colors" aria-label="Search hampers">
            <Search className="w-5 h-5" strokeWidth={2} />
          </button>

          <WishlistNavButton />
          <HamperIndicator />
          {user && <NotificationBell />}
          <CartButton />

          <div className="hidden xl:flex items-center ml-1">
            {user ? (
              <ProfileDropdown user={user} role={role} />
            ) : (
              <button type="button" onClick={() => openAuth('login')} className="h-11 px-4 grid place-items-center rounded-full text-sm font-semibold text-rose hover:bg-petal transition-colors">
                Sign in
              </button>
            )}
          </div>

          <button
            className="xl:hidden grid place-items-center w-11 h-11 rounded-full text-ink hover:bg-petal"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" strokeWidth={1.5} /> : <Menu className="w-6 h-6" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden max-w-7xl mx-auto mt-2 rounded-3xl border border-petal-line bg-white shadow-xl max-h-[75vh] overflow-y-auto">
          <nav className="flex flex-col p-3" aria-label="Main">
            {NAV.map(item => (
              <button key={item.id} type="button" onClick={() => jump(item.id)} className={`text-left px-4 py-3 rounded-2xl text-base font-semibold ${active === item.id ? 'bg-petal text-plum' : 'text-ink hover:bg-blush'}`}>
                {item.label}
              </button>
            ))}
            {parentOccasions.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-petal-line mt-2">
                {parentOccasions.map(o => (
                  <button key={o.id} type="button" onClick={() => filterOccasion(o.id)} className="h-9 px-3 rounded-full bg-blush text-sm font-semibold text-plum">
                    {o.name}
                  </button>
                ))}
              </div>
            )}
            <div className="border-t border-petal-line mt-2 pt-2 flex flex-col">
              <button type="button" onClick={() => { setMobileMenuOpen(false); openStudio(); }} className="flex items-center justify-between px-4 py-3 rounded-2xl text-ink hover:bg-blush">
                <span className="flex items-center font-semibold"><Gift className="w-5 h-5 mr-3 text-rose" />{hasHamperItems ? 'Finish my hamper' : 'Start a hamper'}</span>
                {hasHamperItems && (
                  <span className="text-xs font-bold text-rose bg-petal px-2.5 py-1 rounded-full">
                    {totalProductsCount} item{totalProductsCount !== 1 ? 's' : ''} · ₹{totalPrice.toFixed(0)}
                  </span>
                )}
              </button>
              {user ? (
                <button type="button" onClick={() => { setMobileMenuOpen(false); openAccount('orders'); }} className="flex items-center px-4 py-3 rounded-2xl font-semibold text-ink hover:bg-blush">
                  <User className="w-5 h-5 mr-3 text-rose" />My account
                </button>
              ) : (
                <button type="button" onClick={() => { setMobileMenuOpen(false); openAuth('login'); }} className="m-2 h-12 rounded-full bg-rose text-white font-bold">
                  Sign in
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
