'use client';

import { useState } from 'react';
import { updatePaymentStatus } from '@/actions/purchase.actions';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export function RecordPaymentButton({ purchaseId, balanceDue }: { purchaseId: string, balanceDue: number }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(balanceDue);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (balanceDue <= 0) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (amount <= 0 || amount > balanceDue) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await updatePaymentStatus(purchaseId, amount, amount >= balanceDue ? 'PAID' : 'PARTIALLY_PAID', paymentMode);
      if ('error' in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Payment recorded successfully!');
        setIsOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full mt-4">
        Record Payment
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border border-emerald-100 bg-emerald-50 rounded-lg space-y-3">
      <div>
        <label className="block text-xs font-medium text-emerald-800 mb-1">Payment Amount (₹)</label>
        <input
          type="number"
          step="0.01"
          required
          disabled={isSubmitting}
          min="0.01"
          max={balanceDue}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="w-full rounded-md border-emerald-200 px-3 py-2 text-sm bg-white disabled:opacity-50"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-emerald-800 mb-1">Payment Mode</label>
        <select
          disabled={isSubmitting}
          value={paymentMode}
          onChange={e => setPaymentMode(e.target.value)}
          className="w-full rounded-md border-emerald-200 px-3 py-2 text-sm bg-white disabled:opacity-50"
        >
          <option value="UPI">UPI</option>
          <option value="CASH">Cash</option>
          <option value="CREDIT_CARD">Credit Card</option>
          <option value="NET_BANKING">Net Banking</option>
        </select>
      </div>
      <div className="flex space-x-2 pt-2">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsOpen(false)} className="flex-1 text-slate-600">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
