'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface WhatsInsideCarouselProps {
  items: any[];
}

export function WhatsInsideCarousel({ items }: WhatsInsideCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
          What&apos;s Inside
        </h2>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={scrollLeft} className="rounded-full border-slate-200 hover:bg-slate-50 text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={scrollRight} className="rounded-full border-slate-200 hover:bg-slate-50 text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-6 pb-8 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;
          
          const imageUrl = Array.isArray(product.primary_image_url) && product.primary_image_url.length > 0 
              ? product.primary_image_url[0].image_url 
              : null;

          return (
            <div 
              key={item.id} 
              className="group shrink-0 w-[260px] md:w-[280px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden snap-start transition-all duration-300 hover:shadow-md hover:border-slate-200 flex flex-col relative"
            >
              <div className="absolute top-3 right-3 z-10">
                {!item.is_optional && (
                   <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full flex items-center shadow-sm">
                     <Package className="w-3 h-3 mr-1 opacity-70" /> Core
                   </span>
                )}
              </div>

              <Link href={`/products/${product.slug}`} className="block relative aspect-square bg-slate-50 overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="280px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                    <Package className="w-12 h-12" strokeWidth={1} />
                  </div>
                )}
                {item.default_quantity > 1 && (
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md text-slate-900 font-bold px-3 py-1 rounded-full text-xs shadow-sm border border-slate-100 flex items-center">
                    <span className="text-slate-400 mr-1 text-[10px]">QTY</span> {item.default_quantity}
                  </div>
                )}
              </Link>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <Link href={`/products/${product.slug}`} className="block group-hover:text-primary transition-colors">
                    <h4 className="font-bold text-slate-900 text-lg mb-1 leading-tight line-clamp-2">
                      {product.name}
                    </h4>
                  </Link>
                  {product.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mt-2 font-light">
                      {product.description}
                    </p>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">
                    ₹{(product.selling_price * item.default_quantity).toFixed(2)} <span className="text-slate-400 font-normal text-xs ml-0.5">value</span>
                  </div>
                  <Link href={`/products/${product.slug}`} className="text-xs text-primary hover:underline flex items-center font-medium">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
