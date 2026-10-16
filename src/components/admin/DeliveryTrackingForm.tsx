'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { updateDeliveryTrackingId } from '@/actions/purchase.actions';

export function DeliveryTrackingForm({ purchaseId, initialTrackingId }: { purchaseId: string; initialTrackingId: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(initialTrackingId || '');
  const [saving, setSaving] = useState(false);
  const unchanged = value.trim() === (initialTrackingId || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || unchanged) return;
    setSaving(true);
    const res = await updateDeliveryTrackingId(purchaseId, value);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(res.trackingId ? 'Tracking ID saved. It now shows on the invoice.' : 'Tracking ID removed.');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label htmlFor="delivery_tracking_id" className="text-sm text-slate-500 block">Delivery Tracking ID</label>
      <div className="flex gap-2">
        <input
          id="delivery_tracking_id"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={100}
          placeholder="e.g. courier AWB number"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="submit"
          disabled={saving || unchanged}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="text-xs text-slate-400">Shown on the customer&apos;s invoice. Leave empty until the order is dispatched.</p>
    </form>
  );
}
