'use client';

import { useEffect, useRef, useState } from 'react';
import { PreMadeHamper } from '@/types/database.types';
import { useCart } from '@/contexts/CartContext';
import { Check, Clock, PackageOpen, Plus, Truck } from 'lucide-react';
import { WishlistButton } from '@/components/customer/WishlistButton';
import { WhatsAppIcon } from '@/components/customer/SocialIcons';
import vadodaraPincodes from '@/data/vadodara_pincodes.json';
import { getInventoryStatus } from '@/lib/inventory';

interface HamperDetailActionsProps {
  hamper: PreMadeHamper;
  whatsAppNumber?: string;
}

type DeliveryStatus = { kind: 'idle' } | { kind: 'checking' } | { kind: 'local' } | { kind: 'national'; place: string } | { kind: 'invalid' };

const MESSAGE_LIMIT = 200;

export function HamperDetailActions({ hamper, whatsAppNumber }: HamperDetailActionsProps) {
  const { items, addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [pincode, setPincode] = useState('');
  const [delivery, setDelivery] = useState<DeliveryStatus>({ kind: 'idle' });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const isOutOfStock = getInventoryStatus(hamper.stock_quantity) === 'OUT OF STOCK';
  const selectedItem = items.find(i => i.id === hamper.id && i.itemType === 'HAMPER');
  const selectedCount = selectedItem?.quantity ?? 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    setAdding(true);
    addItem({
      id: hamper.id,
      name: hamper.name,
      price: hamper.selling_price,
      imageUrl: hamper.image_url,
      maxQuantity: hamper.stock_quantity,
      itemType: 'HAMPER',
      personalMessage: message.trim() || selectedItem?.personalMessage,
    });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAdding(false), 900);
  };

  const checkPincode = async (value: string) => {
    const pin = value.replace(/\D/g, '').slice(0, 6);
    setPincode(pin);
    if (pin.length !== 6) { setDelivery({ kind: 'idle' }); return; }
    if ((vadodaraPincodes as string[]).includes(pin)) { setDelivery({ kind: 'local' }); return; }
    setDelivery({ kind: 'checking' });
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      const office = data?.[0]?.Status === 'Success' ? data[0].PostOffice?.[0] : null;
      setDelivery(office ? { kind: 'national', place: office.District || office.Name } : { kind: 'invalid' });
    } catch {
      setDelivery({ kind: 'invalid' });
    }
  };

  const askText = encodeURIComponent(`Hi Hamperly! I'm interested in the ${hamper.name} (₹${hamper.selling_price.toLocaleString('en-IN')}). Can you tell me more?`);

  return (
    <div className="flex flex-col gap-4">
      {/* Free card message with live handwritten preview */}
      <div className="bg-white border border-petal-line rounded-3xl p-5 grid xl:grid-cols-[minmax(0,1fr)_180px] gap-4 items-center">
        <div className="flex flex-col gap-2">
          <label htmlFor="card-message" className="text-[13px] font-bold tracking-[0.12em] text-rose">PERSONALISE THE CARD · FREE</label>
          <textarea
            id="card-message"
            rows={3}
            maxLength={MESSAGE_LIMIT}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write a few words for them. We'll handwrite it on the card."
            className="rounded-2xl border-[1.5px] border-[#E5C2CF] px-3.5 py-2.5 text-[15px] text-ink resize-none focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
          />
          <span className="text-xs text-ink-muted">{message.length}/{MESSAGE_LIMIT}</span>
        </div>
        <div className="hidden xl:block bg-[#FFFDF8] rounded-lg p-4 rotate-[3deg] shadow-[0_14px_30px_-16px_rgba(58,18,48,.45)] font-script text-lg leading-snug text-plum min-h-28 break-words" aria-hidden="true">
          {message.trim() || 'Your words, in our handwriting.'}
        </div>
      </div>

      {/* Delivery check */}
      <div className="bg-white border border-petal-line rounded-3xl px-5 py-4 flex flex-wrap items-center gap-3">
        <label htmlFor="pdp-pincode" className="font-bold text-plum">Deliver to</label>
        <input
          id="pdp-pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="Pincode"
          value={pincode}
          onChange={e => checkPincode(e.target.value)}
          className="w-32 h-11 rounded-2xl border-[1.5px] border-[#E5C2CF] px-3.5 font-semibold tracking-[0.12em] text-ink focus:outline-none focus:border-rose"
        />
        <span role="status" aria-live="polite" className="text-sm font-semibold">
          {delivery.kind === 'checking' && <span className="flex items-center gap-1.5 text-ink-muted"><Clock className="w-4 h-4" />Checking…</span>}
          {delivery.kind === 'local' && <span className="flex items-center gap-1.5 text-[#1F6B3E]"><Truck className="w-4 h-4" />Vadodara · next-day delivery</span>}
          {delivery.kind === 'national' && <span className="flex items-center gap-1.5 text-[#1F2F55]"><PackageOpen className="w-4 h-4" />Ships to {delivery.place} in 4–5 days</span>}
          {delivery.kind === 'invalid' && <span className="text-rose">We couldn&apos;t find that pincode</span>}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`flex-[1_1_100%] xl:flex-1 h-14 rounded-full text-base font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_14px_30px_-12px_rgba(184,61,114,.7)] ${
            isOutOfStock ? 'bg-[#EEE6EA] text-ink-muted shadow-none cursor-not-allowed' : adding ? 'bg-plum text-white' : 'bg-rose hover:bg-rose-deep text-white'
          }`}
        >
          {isOutOfStock ? 'Sold out' : adding ? <><Check className="w-5 h-5" strokeWidth={2.5} /> Added to bag</> : <><Plus className="w-5 h-5" strokeWidth={2.5} /> {selectedCount > 0 ? `Add another · ${selectedCount} in bag` : `Add to bag · ₹${hamper.selling_price.toLocaleString('en-IN')}`}</>}
        </button>
        {whatsAppNumber && (
          <a
            href={`https://wa.me/${whatsAppNumber}?text=${askText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-14 px-5 rounded-full border-[1.5px] border-[#1E9E55] text-[#146B39] font-bold flex items-center gap-2 hover:bg-[#E7F6EC] transition-colors"
          >
            <WhatsAppIcon className="w-5 h-5" /> Ask on WhatsApp
          </a>
        )}
        <WishlistButton itemId={hamper.id} itemType="HAMPER" className="!relative !top-0 !right-0 !p-4 !border-[#E5C2CF]" />
      </div>
    </div>
  );
}
