'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Gift } from 'lucide-react';

export interface RecentOrder {
  label: string;
  createdAt: string;
}

// Cycles through real recent website orders (item names and time only, never who ordered).
export function RecentOrdersTicker({ orders }: { orders: RecentOrder[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (orders.length < 2) return;
    const id = setInterval(() => setIndex(i => (i + 1) % orders.length), 7000);
    return () => clearInterval(id);
  }, [orders.length]);

  if (orders.length === 0) return null;
  const order = orders[index];

  return (
    <div
      key={index}
      role="status"
      aria-live="polite"
      className="hp-toast absolute left-5 right-5 bottom-5 sm:left-6 sm:bottom-6 max-w-[360px] bg-white rounded-[18px] px-3.5 py-3 flex gap-3 items-center shadow-[0_16px_36px_-18px_rgba(58,18,48,.5)]"
    >
      <span className="w-11 h-11 rounded-xl bg-petal grid place-items-center shrink-0">
        <Gift className="w-5 h-5 text-rose" />
      </span>
      <span className="text-sm leading-snug text-ink">
        <strong>Someone just ordered</strong> {order.label}
        <span className="block text-[13px] text-ink-muted">{formatDistanceToNowStrict(new Date(order.createdAt), { addSuffix: true })}</span>
      </span>
    </div>
  );
}
