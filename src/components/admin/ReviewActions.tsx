'use client';

import { useState } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateReviewStatus, deleteReview } from '@/actions/review.actions';
import { ReviewStatus } from '@/types/database.types';

interface ReviewActionsProps {
  reviewId: string;
  status: ReviewStatus;
}

export function ReviewActions({ reviewId, status }: ReviewActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: ReviewStatus) => {
    setLoading(true);
    await updateReviewStatus(reviewId, newStatus);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this review permanently?')) return;
    setLoading(true);
    await deleteReview(reviewId);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {status !== 'APPROVED' && (
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => handleStatusChange('APPROVED')}
          className="text-slate-400 hover:text-emerald-600"
          title="Approve"
        >
          <Check className="w-4 h-4" />
        </Button>
      )}
      {status !== 'REJECTED' && (
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => handleStatusChange('REJECTED')}
          className="text-slate-400 hover:text-amber-600"
          title="Reject"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={handleDelete}
        className="text-slate-400 hover:text-rose-600"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
