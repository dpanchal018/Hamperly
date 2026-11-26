'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { useHamperBuilder } from '@/contexts/HamperBuilderContext';
import { useStorefront } from '@/contexts/StorefrontContext';

const SESSION_KEY = 'hamperly_saved_hamper_reminded';

/** Once per visit, remind shoppers with an unfinished hamper draft that it's waiting for them. */
export function SavedHamperReminder() {
  const pathname = usePathname();
  const { isInitialized, totalProductsCount, recipient } = useHamperBuilder();
  const { openStudio } = useStorefront();

  useEffect(() => {
    if (!isInitialized || totalProductsCount === 0) return;
    if (pathname !== '/') return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* storage blocked */ }
      toast(
        t => (
          <span className="flex items-center gap-3">
            <span>
              Your hamper is saved
              <span className="block text-xs font-medium text-[#E8CBD6]">
                {totalProductsCount} gift{totalProductsCount === 1 ? '' : 's'}{recipient ? ` · for ${recipient}` : ''}
              </span>
            </span>
            <button type="button" onClick={() => { toast.dismiss(t.id); openStudio(); }} className="shrink-0 rounded-full bg-[#F2A7BD] px-3 py-1.5 text-xs font-bold text-plum-deep hover:bg-white">
              Continue
            </button>
          </span>
        ),
        { icon: '🎁', duration: 9000, id: 'saved-hamper' }
      );
    }, 2500);
    return () => clearTimeout(timer);
  }, [isInitialized, totalProductsCount, recipient, pathname, openStudio]);

  return null;
}
