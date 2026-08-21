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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > balanceDue) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const promise = updatePaymentStatus(purchaseId, amount, amount >= balanceDue ? 'PAID' : 'PARTIALLY_PAID', paymentMode);
    
    toast.promise(promise, {
      loading: 'Recording payment...',
      success: (res) => {
        if ('error' in res && res.error) throw new Error(res.error);
        setIsOpen(false);
        router.refresh();
        return 'Payment recorded successfully!';
      },
      error: (err) => err.message || 'Failed to record payment'
    });
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
          required
          min="1"
          max={balanceDue}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="w-full rounded-md border-emerald-200 px-3 py-2 text-sm bg-white"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-emerald-800 mb-1">Payment Mode</label>
        <select
          value={paymentMode}
          onChange={e => setPaymentMode(e.target.value)}
          className="w-full rounded-md border-emerald-200 px-3 py-2 text-sm bg-white"
        >
          <option value="UPI">UPI</option>
          <option value="CASH">Cash</option>
          <option value="CREDIT_CARD">Credit Card</option>
          <option value="NET_BANKING">Net Banking</option>
        </select>
      </div>
      <div className="flex space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1 text-slate-600">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
          Save
        </Button>
      </div>
    </form>
  );
}
