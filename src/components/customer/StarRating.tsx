'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

export function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value;
  const starClass = sizeClasses[size];

  return (
    <div className={`flex items-center gap-0.5 ${readOnly ? '' : 'cursor-pointer'}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(null)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`${starClass} transition-colors ${
              star <= displayValue ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'
            }`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
