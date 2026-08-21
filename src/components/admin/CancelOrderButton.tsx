'use client';

import { updatePurchaseStatus } from '@/actions/purchase.actions';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export function CancelOrderButton({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order? Inventory will be restored.')) return;
    
    const promise = updatePurchaseStatus(purchaseId, 'CANCELLED');
    
    toast.promise(promise, {
      loading: 'Cancelling order...',
      success: (res) => {
        if (res.error) throw new Error(res.error);
        router.refresh();
        return 'Order successfully cancelled and inventory restored!';
      },
      error: (err) => err.message || 'Failed to cancel order'
    });
  };

  return (
    <button 
      onClick={handleCancel}
      className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
    >
      Cancel Order
    </button>
  );
}
