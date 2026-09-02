'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cancelCustomerOrder } from '@/actions/orders.actions';
import toast from 'react-hot-toast';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  const REASONS = [
    "I changed my mind",
    "Found a better price elsewhere",
    "Ordered by mistake",
    "Delivery time is too long",
    "Other"
  ];

  const handleCancel = async () => {
    if (!reason) {
      toast.error('Please provide a reason for cancellation.');
      return;
    }

    setIsSubmitting(true);
    const res = await cancelCustomerOrder(orderId, reason);
    if (res.success) {
      toast.success('Order cancelled successfully.');
      setIsOpen(false);
    } else {
      toast.error(res.error || 'Failed to cancel order.');
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white shadow-sm mt-4 w-full md:w-auto h-9">
          Cancel Order
        </Button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-xl z-50 animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Dialog.Title className="text-xl font-serif font-bold text-slate-900">Cancel Order</Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500 mt-1">
                Are you sure you want to cancel this order? This action cannot be undone.
              </Dialog.Description>
            </div>
            <Dialog.Close className="text-slate-400 hover:text-slate-600 rounded-full p-2 hover:bg-slate-50 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">Reason for cancellation</label>
            <div className="grid gap-2">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                    reason === r 
                      ? 'border-rose-500 bg-rose-50 text-rose-700 font-semibold shadow-[inset_0_0_0_1px_rgba(244,63,94,0.2)]' 
                      : 'border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-rose-50/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason === 'Other' && (
              <textarea 
                placeholder="Please tell us why..."
                className="w-full h-24 p-4 mt-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm resize-none"
                onChange={(e) => setReason(`Other: ${e.target.value}`)}
              />
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-8">
            <Dialog.Close asChild>
              <Button variant="outline" className="w-full sm:w-auto text-slate-600" disabled={isSubmitting}>
                Keep Order
              </Button>
            </Dialog.Close>
            <Button 
              onClick={handleCancel} 
              disabled={isSubmitting || !reason}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-transparent"
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
