import Link from 'next/link';
import { getPublicOccasions, getPublicProducts } from '@/services/catalog.service';
import { OccasionCard } from '@/components/customer/OccasionCard';
import { ProductCard } from '@/components/customer/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Gift, Sparkles, Heart } from 'lucide-react';
import { StaggerContainer, StaggerItem, PageTransition } from '@/components/ui/AnimatedWrapper';

import { HeroCarousel } from '@/components/customer/HeroCarousel';

import { Logo } from '@/components/ui/Logo';

export default async function HomePage() {
  // Fetch top 4 active occasions
  const occasions = await getPublicOccasions();
  const featuredOccasions = occasions.slice(0, 4);

  // Fetch some products across all active occasions for the "Featured" section
  const products = await getPublicProducts({ inStockOnly: true });
  // Just show 4 featured products for the homepage
  const featuredProducts = products.slice(0, 4);

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/80 via-background to-background" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <StaggerContainer className="max-w-2xl space-y-6">
              <StaggerItem>
                <Logo className="items-start mb-6" withTagline={true} />
              </StaggerItem>
              
              <StaggerItem>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground font-serif leading-tight">
                  Personalized hampers for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-rose)] to-[var(--brand-peach)]">every occasion</span>
                </h1>
              </StaggerItem>
              
              <StaggerItem>
                <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-lg">
                  Choose the perfect occasion, handpick premium products, and we'll craft a beautiful, bespoke hamper delivered to their door.
                </p>
              </StaggerItem>
              
              <StaggerItem className="pt-4 flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/occasions">
                  <Button size="lg" className="rounded-full px-8 h-14 text-lg bg-primary hover:opacity-90 text-primary-foreground shadow-xl transition-all font-semibold">
                    Build Your Hamper <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg bg-card text-foreground font-semibold hover:bg-secondary">
                    Explore Products
                  </Button>
                </Link>
              </StaggerItem>
            </StaggerContainer>
            
            <div className="relative">
              <HeroCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-secondary border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground font-serif">How Hamperly Works</h2>
            <p className="text-muted-foreground mt-2">Create the perfect gift in three simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center p-8 bg-card rounded-3xl shadow-sm border border-border">
              <div className="w-16 h-16 bg-secondary text-primary rounded-full flex items-center justify-center mb-6">
                <Gift className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">1. Choose Occasion</h3>
              <p className="text-muted-foreground">Select the event you're celebrating to see our specially curated themes.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-8 bg-card rounded-3xl shadow-sm border border-border">
              <div className="w-16 h-16 bg-secondary text-primary rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">2. Handpick Products</h3>
              <p className="text-muted-foreground">Select exactly what goes into the hamper from our premium catalog.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-8 bg-card rounded-3xl shadow-sm border border-border">
              <div className="w-16 h-16 bg-secondary text-primary rounded-full flex items-center justify-center mb-6">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">3. We Build & Deliver</h3>
              <p className="text-muted-foreground">Our upcoming AI Builder helps wrap it perfectly, and we deliver it with love.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Occasion */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground font-serif tracking-tight">Shop by Occasion</h2>
              <p className="text-muted-foreground mt-2">Curated collections for every special moment.</p>
            </div>
            <Link href="/occasions" className="hidden md:flex text-primary font-bold hover:opacity-80 items-center transition-opacity">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredOccasions.map((occasion) => (
              <OccasionCard key={occasion.id} occasion={occasion} />
            ))}
          </div>
          
          {featuredOccasions.length === 0 && (
            <div className="text-center py-12 bg-secondary rounded-2xl border border-border">
              <p className="text-muted-foreground">Occasions will appear here soon.</p>
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/occasions">
              <Button variant="outline" className="w-full">View All Occasions</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-secondary border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground font-serif tracking-tight">Featured Products</h2>
              <p className="text-muted-foreground mt-2">Handpicked premium items for your hampers.</p>
            </div>
            <Link href="/products" className="hidden md:flex text-primary font-bold hover:opacity-80 items-center transition-opacity">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {featuredProducts.length === 0 && (
            <div className="text-center py-12 bg-card rounded-2xl shadow-sm border border-border">
              <p className="text-muted-foreground">Products will appear here soon.</p>
            </div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
