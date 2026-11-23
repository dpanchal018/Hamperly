'use client';

import dynamic from 'next/dynamic';
import { useCart } from '@/contexts/CartContext';
import { useStorefront } from '@/contexts/StorefrontContext';
import type { MuseumExhibit } from '@/components/customer/museum/types';

// three.js runs only in the browser
const HamperMuseum = dynamic(() => import('@/components/customer/museum/HamperMuseum'), {
  ssr: false,
  loading: () => <div className="h-[380px] sm:h-[480px] lg:h-[620px] rounded-[32px] bg-plum animate-pulse" aria-hidden="true" />,
});

/** Mounts the 3D museum tour and connects it to the bag and the hamper details overlay. */
export function MuseumSection({ exhibits }: { exhibits: MuseumExhibit[] }) {
  const { addItem } = useCart();
  const { openHamper } = useStorefront();
  return (
    <HamperMuseum
      exhibits={exhibits}
      onViewDetails={openHamper}
      onAddToBag={exhibit =>
        addItem({
          id: exhibit.id,
          name: exhibit.name,
          price: exhibit.price,
          imageUrl: exhibit.imageUrl,
          maxQuantity: exhibit.stock,
          itemType: 'HAMPER',
        })
      }
    />
  );
}
