'use client';

import { Toaster } from 'react-hot-toast';

// Storefront toasts (added to wishlist, checkout errors, saved hamper, back in stock...).
// Bottom-left on desktop; bottom-centre above the tab bar on phones.
export function StoreToaster() {
  return (
    <Toaster
      position="bottom-left"
      containerClassName="!bottom-24 md:!bottom-6"
      toastOptions={{
        duration: 4000,
        className: '!rounded-[18px] !px-4 !py-3 !text-sm !font-semibold !shadow-[0_16px_36px_-18px_rgba(58,18,48,.5)] !max-w-sm',
        style: { background: '#3A1230', color: '#FFFFFF' },
        success: { iconTheme: { primary: '#F2A7BD', secondary: '#3A1230' } },
        error: { style: { background: '#FFFFFF', color: '#2A1523', border: '1px solid #F0CFDA' }, iconTheme: { primary: '#B83D72', secondary: '#FFFFFF' } },
      }}
    />
  );
}
