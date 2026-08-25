import { ReviewWithDetails } from '@/types/database.types';
import { StarRating } from '@/components/customer/StarRating';
import { formatDistanceToNow } from 'date-fns';
import { Quote } from 'lucide-react';

interface ReviewCardProps {
  review: ReviewWithDetails;
  showHamperName?: boolean;
  className?: string;
}

export function ReviewCard({ review, showHamperName = false, className = '' }: ReviewCardProps) {
  return (
    <div className={`flex flex-col bg-white rounded-3xl border border-primary/10 shadow-sm p-6 ${className}`}>
      <Quote className="w-6 h-6 text-primary/20 mb-3" fill="currentColor" />

      {showHamperName && review.hamper?.name && (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-1">
          {review.hamper.name}
        </p>
      )}

      <StarRating value={review.rating} readOnly size="sm" />

      <p className="text-foreground/80 font-light mt-3 mb-4 flex-1 line-clamp-4">
        {review.comment || 'No written feedback provided.'}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-primary/10 text-sm">
        <span className="font-semibold text-foreground">Rated by {review.reviewer_name}</span>
        <span className="text-foreground/50">
          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
