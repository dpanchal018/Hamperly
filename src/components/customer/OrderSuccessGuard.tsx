'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'hamperly:consumedOrderSuccess';
const UNMOUNT_GRACE_MS = 300;

// Module-scoped (not component state) so it survives React StrictMode's dev-only
// mount -> cleanup -> mount cycle, which runs on the same fiber/instance.
const pendingConsume: Record<string, ReturnType<typeof setTimeout>> = {};

function getConsumed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function markConsumed(orderId: string) {
  const consumed = getConsumed();
  if (!consumed.includes(orderId)) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...consumed, orderId]));
  }
}

// A real navigation-away unmount and StrictMode's synthetic diagnostic unmount both
// call this cleanup. We can't tell them apart synchronously, so we delay the write and
// let the following real mount (if any) cancel it via `cancelScheduledConsume`.
// StrictMode's remount happens within the same tick; a real "user came back" remount
// only happens after real navigation, which always takes far longer than the grace window.
function scheduleConsume(orderId: string) {
  clearTimeout(pendingConsume[orderId]);
  pendingConsume[orderId] = setTimeout(() => {
    markConsumed(orderId);
    delete pendingConsume[orderId];
  }, UNMOUNT_GRACE_MS);
}

function cancelScheduledConsume(orderId: string) {
  clearTimeout(pendingConsume[orderId]);
  delete pendingConsume[orderId];
}

/**
 * Order confirmation pages carry customer PII (address, phone, email) and are meant to be
 * seen once. This blocks the page from reappearing via browser back/forward:
 * - Marks the order "consumed" once the user genuinely navigates away within the app.
 * - Redirects away immediately if a later mount finds it already consumed.
 * - Also catches bfcache restores (pageshow with `persisted`), which skip React's mount cycle.
 */
export function OrderSuccessGuard({ orderId, redirectTo }: { orderId: string; redirectTo: string }) {
  const router = useRouter();

  useEffect(() => {
    if (getConsumed().includes(orderId)) {
      toast.error('This order confirmation has already been viewed and is no longer available.');
      router.replace(redirectTo);
    }
  }, [orderId, redirectTo, router]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        toast.error('This order confirmation has already been viewed and is no longer available.');
        router.replace(redirectTo);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [orderId, redirectTo, router]);

  useEffect(() => {
    cancelScheduledConsume(orderId);
    return () => {
      scheduleConsume(orderId);
    };
  }, [orderId]);

  return null;
}
