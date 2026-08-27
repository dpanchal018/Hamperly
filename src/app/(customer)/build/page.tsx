'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSelection } from '@/contexts/SelectionContext';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/AnimatedWrapper';
import { ArrowRight, Minus, Plus, ShoppingBag, X, AlertTriangle, Gift } from 'lucide-react';

export default function BuildHamperPage() {
  const { items, updateQuantity, removeItem, totalPrice, isValidating, issues } = useSelection();

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-16 min-h-[70vh] flex flex-col items-center justify-center text-center bg-background">
          <div className="w-24 h-24 border border-primary/10 text-foreground/60 flex items-center justify-center mb-8 mx-auto">
            <Gift className="w-12 h-12" strokeWidth={1} />
          </div>
          <span className="text-foreground/60 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">The Studio</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground font-serif mb-4 tracking-tight">YOUR HAMPER IS EMPTY.</h1>
          <p className="text-lg text-foreground/60 max-w-lg mx-auto mb-10 font-light">
            Begin selecting pieces to curate a thoughtful, bespoke gift.
          </p>
          <Link href="/products">
            <Button size="lg" className="rounded-3xl px-12 h-14 text-xs font-semibold tracking-widest uppercase bg-primary hover:bg-primary text-white transition-all">
              Explore Products
            </Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="bg-primary py-24 text-center">
          <div className="container mx-auto px-4">
            <span className="text-gold font-bold tracking-[0.3em] uppercase text-xs mb-4 block">Step 01</span>
            <h1 className="text-4xl md:text-5xl font-black text-white font-serif tracking-tight">REVIEW SELECTION</h1>
            <p className="text-white/70 mt-4 text-lg font-light">Curate the perfect selection before personalizing.</p>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-16 max-w-6xl">
          
          {/* Validation Issues Alert */}
          {issues.length > 0 && (
            <div className="mb-12 p-6 bg-primary/5 border-l-2 border-gold flex items-start">
              <AlertTriangle className="w-5 h-5 text-gold mt-0.5 mr-4 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-foreground font-bold text-primary text-xs mb-2">Attention Required</h4>
                <ul className="space-y-1 text-sm text-foreground/60 font-light">
                  {issues.map((issue, idx) => (
                    <li key={idx}> {issue.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Items List */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => {
                const isOutOfStock = item.product.stock_quantity <= 0;
                return (
                  <div key={item.product.id} className={`bg-white p-6 border ${isOutOfStock ? 'border-red-900/30' : 'border-primary/10'} flex flex-col sm:flex-row items-start gap-8 relative transition-all`}>
                    
                    <button 
                      onClick={() => removeItem(item.product.id)}
                      className="absolute top-6 right-6 text-foreground/60 hover:text-foreground transition-colors"
                      aria-label="Remove item"
                    >
                      <X className="w-5 h-5" strokeWidth={1} />
                    </button>

                    <div className="w-32 h-32 bg-primary/5 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                      {item.product.primary_image_url ? (
                        <Image 
                          src={item.product.primary_image_url}
                          alt={item.product.name}
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-foreground/60/30" strokeWidth={1} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-bold font-bold text-primary text-foreground/60">
                          {item.product.category?.name || 'Item'}
                        </span>
                        {item.product.stock_quantity < 5 && item.product.stock_quantity > 0 && (
                          <span className="text-[9px] font-bold px-2 py-0.5 border border-gold text-gold font-bold text-primary">
                            Low Stock
                          </span>
                        )}
                      </div>
                      
                      <Link href={`/products/${item.product.slug}`} className="hover:text-primary transition-colors">
                        <h3 className="text-2xl font-serif font-bold text-foreground leading-tight mb-2 line-clamp-2">{item.product.name}</h3>
                      </Link>
                      
                      <div className="text-lg font-medium text-foreground tracking-wide mb-4">
                        ?{item.product.selling_price?.toFixed(2) || (item.product as any).selling_price?.toFixed(2)}
                      </div>

                      <div className="flex items-center">
                        <div className="flex items-center border border-primary/10 h-10 px-2 min-w-[100px] justify-between">
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                          <span className="text-sm font-bold w-6 text-center text-foreground">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock_quantity}
                            className={`w-6 h-6 flex items-center justify-center transition-colors ${item.quantity >= item.product.stock_quantity ? 'text-cream' : 'text-foreground/60 hover:text-foreground'}`}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-8 border border-primary/10 sticky top-32">
                <h3 className="text-sm font-bold text-foreground font-bold text-primary mb-8 border-b border-primary/10 pb-4">SUMMARY</h3>
                
                <div className="space-y-6 mb-8">
                  <div className="flex justify-between items-center text-foreground/60 font-light">
                    <span>Items selected</span>
                    <span className="font-bold text-foreground">{items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                  </div>
                  
                  <div className="pt-6 border-t border-primary/10">
                    <p className="text-xs text-foreground/60 font-light italic leading-relaxed">
                      Pricing and taxes will be finalized during the personalization step.
                    </p>
                  </div>
                </div>
                
                <Link href={isValidating || issues.some(i => i.type === 'INSUFFICIENT_STOCK' || i.type === 'PRODUCT_NOT_FOUND') ? "#" : "/personalize"}>
                  <Button 
                    className="w-full h-14 text-xs font-semibold tracking-[0.2em] uppercase bg-primary hover:bg-primary text-white rounded-3xl transition-all mb-4"
                    disabled={isValidating || issues.some(i => i.type === 'INSUFFICIENT_STOCK' || i.type === 'PRODUCT_NOT_FOUND')}
                  >
                    Personalize &rarr;
                  </Button>
                </Link>
                
                <Link href="/products" className="block text-center text-xs font-bold font-bold text-primary text-foreground/60 hover:text-foreground transition-colors pt-4 border-t border-primary/10">
                  Add more items
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
