'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// `popstate` only ever fires for real back/forward history traversal — never for the
// pushState/replaceState navigations Next.js's <Link> and router.push/replace use. So a
// recent `popstate` is a reliable "the user just pressed back/forward" signal, independent
// of any per-order bookkeeping (which would otherwise also block legitimate later visits,
// e.g. reprinting an order from Account > Orders).
let lastPopstateAt = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    lastPopstateAt = Date.now();
  });
}

const POPSTATE_WINDOW_MS = 800;
const MESSAGE = 'This order confirmation is no longer available after navigating back or forward.';

function cameViaBackForward() {
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navEntry?.type === 'back_forward') return true;
  return Date.now() - lastPopstateAt < POPSTATE_WINDOW_MS;
}

/**
 * Order confirmation pages carry customer PII (address, phone, email) and should never
 * reappear via browser back/forward once the user has moved on. This redirects away when:
 * - The page's own document load was itself a back/forward navigation (hard nav, bfcache miss).
 * - A `popstate` just fired (soft, client-side back/forward within the app).
 * - The page is restored live from bfcache (`pageshow` with `persisted`), which skips
 *   React's mount cycle entirely.
 * A direct visit (typed URL, clicking a Link — e.g. reprinting from Account > Orders) is
 * a `push`/`navigate`, never fires `popstate`, and is always allowed through.
 */
export function OrderSuccessGuard({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();

  useEffect(() => {
    if (cameViaBackForward()) {
      toast.error(MESSAGE);
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        toast.error(MESSAGE);
        router.replace(redirectTo);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [redirectTo, router]);

  return null;
}
