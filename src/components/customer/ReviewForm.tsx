'use client';

import { useState } from 'react';
import { StarRating } from '@/components/customer/StarRating';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createReview } from '@/actions/review.actions';

interface ReviewFormProps {
  hamperId: string;
}

export function ReviewForm({ hamperId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await createReview(hamperId, rating, comment);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-center">
        <p className="font-semibold text-foreground">Thank you for your feedback!</p>
        <p className="text-foreground/70 text-sm mt-1">
          Your review is pending approval and will appear here once approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-primary/10 p-6 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Your Rating</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Your Feedback</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us what you loved about this hamper..."
          maxLength={1000}
        />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="rounded-full px-6">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}
