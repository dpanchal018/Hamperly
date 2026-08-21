'use client';

import Link from 'next/link';
import { Occasion } from '@/types/database.types';
import { HoverCard } from '@/components/ui/AnimatedWrapper';
import { Calendar } from 'lucide-react';

interface OccasionCardProps {
  occasion: Occasion;
}

export function OccasionCard({ occasion }: OccasionCardProps) {
  return (
    <HoverCard>
      <Link href={`/occasions/${occasion.slug}`} className="group block relative overflow-hidden rounded-2xl aspect-[4/3] shadow-sm">
        {/* Background Image / Gradient */}
        {occasion.image_url ? (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${occasion.image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-rose)] to-[var(--brand-lavender)] transition-transform duration-700 group-hover:scale-110 flex items-center justify-center">
             <Calendar className="w-16 h-16 text-white/20" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:translate-x-1 transition-transform duration-300 font-serif">{occasion.name}</h3>
          {occasion.description && (
            <p className="text-white/80 text-sm line-clamp-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              {occasion.description}
            </p>
          )}
        </div>
      </Link>
    </HoverCard>
  );
}
