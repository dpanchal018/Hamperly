'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Occasion } from '@/types/database.types';
import { HoverCard } from '@/components/ui/AnimatedWrapper';
import { Heart } from 'lucide-react';

interface OccasionCardProps {
  occasion: Occasion;
}

export function OccasionCard({ occasion }: OccasionCardProps) {
  return (
    <HoverCard className="w-full h-full">
      <Link href={`/occasions/${occasion.slug}`} className="block w-full h-full group">
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-primary/5 border border-primary/10 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/20">
          
          {occasion.image_url ? (
            <Image 
              src={occasion.image_url} 
              alt={occasion.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/10 to-secondary/20 flex flex-col justify-center items-center">
              <Heart className="w-12 h-12 text-primary/30 mb-2" strokeWidth={1.5} />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent transition-opacity duration-300"></div>

          <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
            <h3 className="font-serif font-bold text-2xl md:text-3xl mb-2 group-hover:-translate-y-1 transition-transform duration-300">
              {occasion.name}
            </h3>
            {occasion.description && (
              <p className="text-sm text-white/90 font-light opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100 line-clamp-2">
                {occasion.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    </HoverCard>
  );
}
