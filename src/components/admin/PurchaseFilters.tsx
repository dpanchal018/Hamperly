'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function PurchaseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || '';
  const currentMode = searchParams.get('payment_mode') || '';

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push('/admin/customers-purchases?' + params.toString());
  };

  return (
    <div className="flex items-center space-x-3">
      <select 
        value={currentStatus} 
        onChange={e => updateFilters('status', e.target.value)}
        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
      >
        <option value="">All Statuses</option>
        <option value="COMPLETED">Completed</option>
        <option value="PENDING">Pending</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <select 
        value={currentMode} 
        onChange={e => updateFilters('payment_mode', e.target.value)}
        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
      >
        <option value="">All Payment Modes</option>
        <option value="UPI">UPI</option>
        <option value="CASH">Cash</option>
        <option value="CREDIT_CARD">Credit Card</option>
        <option value="NET_BANKING">Net Banking</option>
      </select>

      <select 
        value={searchParams.get('sale_source') || ''} 
        onChange={e => updateFilters('sale_source', e.target.value)}
        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
      >
        <option value="">All Sources</option>
        <option value="WEBSITE">Website</option>
        <option value="EXHIBITION">Exhibition</option>
        <option value="WALK_IN">Walk In</option>
        <option value="WHATSAPP">WhatsApp</option>
        <option value="PHONE">Phone</option>
        <option value="OTHER">Other</option>
      </select>
    </div>
  );
}
