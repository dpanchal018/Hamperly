'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * The storefront is a single page. Sections are scrolled to, and everything that used to be a
 * separate page (hamper details, checkout, order confirmation, sign in, account, policies)
 * opens as an overlay. This context is the one place that drives all of that.
 */

export const SECTIONS = ['top', 'finder', 'occasions', 'shop', 'studio', 'museum', 'stories', 'how', 'contact'] as const;
export type SectionId = (typeof SECTIONS)[number];

export interface ShopFilter {
  q: string;
  occasion: string; // occasion id
  event: string; // event id
  recipient: string; // recipient tag id
  gender: string; // gender id
  priceRange: string; // under_1000 | 1000_2500 | 2500_5000 | above_5000
}

export const EMPTY_FILTER: ShopFilter = { q: '', occasion: '', event: '', recipient: '', gender: '', priceRange: '' };

export type AccountTab = 'orders' | 'wishlist' | 'profile' | 'notifications';
export type AuthMode = 'login' | 'signup';

export interface PlacedOrder {
  id: string;
  ref: string;
  total: number;
}

interface StorefrontContextType {
  goTo: (section: SectionId) => void;
  shopFilter: ShopFilter;
  setShopFilter: (next: Partial<ShopFilter>, options?: { replace?: boolean; scroll?: boolean }) => void;
  quickViewId: string | null;
  openHamper: (id: string) => void;
  closeHamper: () => void;
  checkoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  placedOrder: PlacedOrder | null;
  showPlacedOrder: (order: PlacedOrder | null) => void;
  authMode: AuthMode | null;
  /** Opens sign in; `then` runs after a successful sign in (e.g. reopen checkout) */
  openAuth: (mode: AuthMode, then?: 'checkout') => void;
  closeAuth: () => void;
  authThen: 'checkout' | null;
  accountTab: AccountTab | null;
  openAccount: (tab?: AccountTab) => void;
  closeAccount: () => void;
  policyOpen: boolean;
  setPolicyOpen: (open: boolean) => void;
  /** Opens a cart hamper (or loose cart products) in the studio section */
  openStudio: (params?: Record<string, string>) => void;
}

const StorefrontContext = createContext<StorefrontContextType | null>(null);

function setQuery(mutate: (p: URLSearchParams) => void) {
  const params = new URLSearchParams(window.location.search);
  mutate(params);
  const qs = params.toString();
  // Native history updates keep Next's useSearchParams in sync without a navigation
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
}

export function scrollToSection(section: SectionId) {
  const el = document.getElementById(section);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

interface ProviderProps {
  children: React.ReactNode;
  occasions: { id: string; slug: string }[];
  events: { id: string; slug: string }[];
}

export function StorefrontProvider({ children, occasions, events }: ProviderProps) {
  const [shopFilter, setFilterState] = useState<ShopFilter>(EMPTY_FILTER);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [authThen, setAuthThen] = useState<'checkout' | null>(null);
  const [accountTab, setAccountTab] = useState<AccountTab | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const bootstrapped = useRef(false);

  const goTo = useCallback((section: SectionId) => {
    // Close overlays that would hide the section
    setQuickViewId(null);
    setCheckoutOpen(false);
    setAccountTab(null);
    requestAnimationFrame(() => scrollToSection(section));
  }, []);

  const setShopFilter = useCallback((next: Partial<ShopFilter>, options?: { replace?: boolean; scroll?: boolean }) => {
    setFilterState(prev => (options?.replace ? { ...EMPTY_FILTER, ...next } : { ...prev, ...next }));
    if (options?.scroll) goTo('shop');
  }, [goTo]);

  const openHamper = useCallback((id: string) => {
    setQuickViewId(id);
    setQuery(p => p.set('hamper', id));
  }, []);

  const closeHamper = useCallback(() => {
    setQuickViewId(null);
    setQuery(p => p.delete('hamper'));
  }, []);

  const openAuth = useCallback((mode: AuthMode, then?: 'checkout') => {
    setAuthThen(then ?? null);
    setAuthMode(mode);
  }, []);

  const openStudio = useCallback((params?: Record<string, string>) => {
    if (params) setQuery(p => Object.entries(params).forEach(([k, v]) => p.set(k, v)));
    goTo('studio');
  }, [goTo]);

  // Old page URLs are redirected to `/?…` (next.config.ts); apply them once on load
  useEffect(() => {
    // Deferred to after hydration so the server and first client render match
    const timer = setTimeout(() => applyInitialUrl(), 0);
    return () => clearTimeout(timer);

    function applyInitialUrl() {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const params = new URLSearchParams(window.location.search);
    const occasionSlug = params.get('occasion');
    const eventSlug = params.get('event');
    const occasionId = occasionSlug ? occasions.find(o => o.slug === occasionSlug || o.id === occasionSlug)?.id : undefined;
    const eventId = eventSlug ? events.find(e => e.slug === eventSlug || e.id === eventSlug)?.id : undefined;
    const filter: Partial<ShopFilter> = {};
    if (occasionId) filter.occasion = occasionId;
    if (eventId) filter.event = eventId;
    (['q', 'recipient', 'priceRange', 'gender'] as const).forEach(k => { const v = params.get(k); if (v) filter[k] = v; });

    let section = params.get('section') as SectionId | null;
    if (Object.keys(filter).length > 0 && !params.get('editCartId') && !params.get('fromCart')) {
      setFilterState({ ...EMPTY_FILTER, ...filter });
      section = section ?? 'shop';
    }
    if (params.get('editCartId') || params.get('fromCart')) section = 'studio';

    const hamper = params.get('hamper');
    if (hamper) setQuickViewId(hamper);
    if (params.get('checkout')) setCheckoutOpen(true);
    const auth = params.get('auth');
    if (auth === 'login' || auth === 'signup') setAuthMode(auth);
    const account = params.get('account');
    if (account) setAccountTab((['orders', 'wishlist', 'profile', 'notifications'].includes(account) ? account : 'orders') as AccountTab);
    if (params.get('policy')) setPolicyOpen(true);

    // Strip one-shot params so a refresh doesn't reopen overlays (keep hamper + studio params)
    setQuery(p => ['section', 'occasion', 'event', 'q', 'recipient', 'priceRange', 'gender', 'checkout', 'auth', 'account', 'policy'].forEach(k => p.delete(k)));
    if (section && (SECTIONS as readonly string[]).includes(section)) {
      const target = section;
      // Wait for the page (and lazily loaded sections) to lay out before scrolling
      setTimeout(() => scrollToSection(target), 350);
    }
    }
  }, [occasions, events]);

  const value = useMemo<StorefrontContextType>(() => ({
    goTo,
    shopFilter,
    setShopFilter,
    quickViewId,
    openHamper,
    closeHamper,
    checkoutOpen,
    openCheckout: () => { setQuickViewId(null); setCheckoutOpen(true); },
    closeCheckout: () => setCheckoutOpen(false),
    placedOrder,
    showPlacedOrder: setPlacedOrder,
    authMode,
    openAuth,
    closeAuth: () => { setAuthMode(null); setAuthThen(null); },
    authThen,
    accountTab,
    openAccount: (tab: AccountTab = 'orders') => setAccountTab(tab),
    closeAccount: () => setAccountTab(null),
    policyOpen,
    setPolicyOpen,
    openStudio,
  }), [goTo, shopFilter, setShopFilter, quickViewId, openHamper, closeHamper, checkoutOpen, placedOrder, authMode, openAuth, authThen, accountTab, policyOpen, openStudio]);

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function useStorefront() {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error('useStorefront must be used within StorefrontProvider');
  return ctx;
}

/** Maps legacy page hrefs (e.g. from admin-managed header/footer links) to a page section */
export function sectionForHref(href: string): SectionId | null {
  if (href.startsWith('#')) {
    const id = href.slice(1);
    return (SECTIONS as readonly string[]).includes(id) ? (id as SectionId) : null;
  }
  const path = href.split('?')[0];
  if (path === '/' || path === '') return 'top';
  if (path.startsWith('/hampers') || path.startsWith('/products')) return 'shop';
  if (path.startsWith('/build')) return 'studio';
  if (path.startsWith('/occasions') || path.startsWith('/events')) return 'occasions';
  if (path.startsWith('/exhibitions') || path.startsWith('/museum')) return 'museum';
  if (path.startsWith('/contact')) return 'contact';
  return null;
}
