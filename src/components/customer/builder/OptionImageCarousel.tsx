'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OptionImageCarouselProps {
  images: string[];
  alt: string;
}

export function OptionImageCarousel({ images, alt }: OptionImageCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    container.scrollTo({ left: clamped * container.clientWidth, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || container.clientWidth === 0) return;
    setActiveIndex(Math.round(container.scrollLeft / container.clientWidth));
  };

  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 mb-3 group/carousel">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt={`${alt} — view ${i + 1} of ${images.length}`}
            className="w-full h-full object-cover shrink-0 snap-center"
            draggable={false}
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); scrollToIndex(activeIndex - 1); }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); scrollToIndex(activeIndex + 1); }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
          </button>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
