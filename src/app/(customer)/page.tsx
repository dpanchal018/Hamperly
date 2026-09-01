import { getPublicOccasions } from '@/services/catalog.service';
import { getPublicHampers } from '@/actions/hamper.actions';
import { getFeaturedReviews } from '@/actions/review.actions';
import { HamperCard } from '@/components/customer/HamperCard';
import { OccasionCard } from '@/components/customer/OccasionCard';
import { ReviewsCarousel } from '@/components/customer/ReviewsCarousel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Gift, Heart, Sparkles, Star } from 'lucide-react';
import { PageTransition, FadeInScroll, StaggerScrollContainer } from '@/components/ui/AnimatedWrapper';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const occasions = await getPublicOccasions();
  const featuredReviews = await getFeaturedReviews();

  // 1. Fetch active, IN-STOCK hampers
  const { data: activeHampers } = await supabase
    .from('hampers')
    .select('*')
    .eq('is_active', true)
    .or('stock_quantity.gt.0,stock_quantity.is.null');

  // 2. Fetch completed purchase items to calculate best sellers
  const { data: completedPurchases } = await supabase.from('purchases').select('id').eq('status', 'COMPLETED');
  const completedIds = new Set(completedPurchases?.map(p => p.id) || []);
  
  const { data: items } = await supabase.from('purchase_items').select('purchase_id, product_name_snapshot, quantity').is('product_id', null);
  
  const salesCount: Record<string, number> = {};
  if (items) {
    items.forEach(item => {
      if (completedIds.has(item.purchase_id)) {
        salesCount[item.product_name_snapshot] = (salesCount[item.product_name_snapshot] || 0) + (item.quantity || 1);
      }
    });
  }

  let validHampers = activeHampers || [];
  
  // Sort by sales count (descending), fallback to created_at
  validHampers.sort((a, b) => {
    const salesA = salesCount[a.name] || 0;
    const salesB = salesCount[b.name] || 0;
    if (salesA !== salesB) return salesB - salesA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const featuredHampers = validHampers.slice(0, 3);
  const featuredOccasions = occasions.slice(0, 4);

  return (
    <PageTransition className="min-h-screen bg-background relative overflow-hidden">

      {/* Decorative Soft Gradients & Floral Vibes */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-[20%] right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none translate-x-1/3" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 lg:pt-16 lg:pb-16 container mx-auto px-4 z-10 flex flex-col items-center text-center">
        <FadeInScroll>
          <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/20 text-primary mb-4 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Handcrafted with Love</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold font-serif text-foreground mb-4 max-w-4xl tracking-tight leading-tight">
            Gifting made <span className="font-script text-primary font-normal text-6xl md:text-8xl lowercase">beautiful</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 font-light max-w-2xl mx-auto mb-6 leading-relaxed">
            Curate the perfect present with our exquisite selection of premium goods, stunning floral arrangements, and personalized touches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/build">
              <Button size="lg" className="rounded-full px-8 h-14 text-lg bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover:scale-105">
                Build Your Hamper
              </Button>
            </Link>
            <Link href="/hampers">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-primary/20 text-primary hover:bg-primary/5 transition-all">
                Shop Pre-made
              </Button>
            </Link>
          </div>
        </FadeInScroll>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 md:py-16 bg-white/50 backdrop-blur-sm relative z-10 border-y border-primary/10">
        <div className="container mx-auto px-4">
          <FadeInScroll>
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">The Hamperly Touch</h2>
              <div className="w-16 h-1 bg-primary/20 mx-auto rounded-full"></div>
            </div>
          </FadeInScroll>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Heart, title: "Curated with Care", desc: "Every item is hand-selected from premium artisans to ensure the highest quality." },
              { icon: Gift, title: "Exquisite Packaging", desc: "Presented in beautiful floral boxes and finished with luxurious satin ribbons." },
              { icon: Star, title: "Personalized For You", desc: "Add heartfelt messages and choose themes that match the recipient perfectly." }
            ].map((feature, idx) => (
              <FadeInScroll key={idx} delay={0.1 * idx}>
                <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl shadow-sm border border-primary/5 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                    <feature.icon className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-foreground/70">{feature.desc}</p>
                </div>
              </FadeInScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Ratings & Reviews */}
      {featuredReviews.length > 0 && (
        <section className="py-12 md:py-16 relative z-10">
          <div className="container mx-auto px-4">
            <FadeInScroll>
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Loved by Our Customers</h2>
                <p className="text-foreground/70">Real ratings and feedback from Hamperly shoppers.</p>
              </div>
            </FadeInScroll>

            <FadeInScroll delay={0.1}>
              <ReviewsCarousel reviews={featuredReviews} />
            </FadeInScroll>
          </div>
        </section>
      )}

      {/* Occasions */}
      <section className="py-12 md:py-16 relative z-10">
        <div className="container mx-auto px-4">
          <FadeInScroll>
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-xs font-semibold tracking-wider text-primary uppercase">Celebrate Every Moment</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">Shop by Occasion</h2>
              </div>
              <Link href="/occasions" className="hidden sm:inline-flex items-center text-primary font-semibold hover:underline">
                View All Collections <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </FadeInScroll>

          <StaggerScrollContainer>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {featuredOccasions.map((occasion) => (
                <div key={occasion.id} className="h-72">
                  <OccasionCard occasion={occasion} />
                </div>
              ))}
            </div>
          </StaggerScrollContainer>
        </div>
      </section>

      {/* Featured Hampers */}
      <section className="py-12 md:py-16 relative z-10 bg-white/50 backdrop-blur-sm border-t border-primary/10">
        <div className="container mx-auto px-4">
          <FadeInScroll>
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-xs font-semibold tracking-wider text-primary uppercase">Bestsellers</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">Featured Hampers</h2>
              </div>
              <Link href="/hampers" className="hidden sm:inline-flex items-center text-primary font-semibold hover:underline">
                View All Hampers <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </FadeInScroll>

          {featuredHampers.length > 0 ? (
            <StaggerScrollContainer>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredHampers.map((hamper) => (
                  <div key={hamper.id} className="h-[460px]">
                    <HamperCard hamper={hamper} />
                  </div>
                ))}
              </div>
            </StaggerScrollContainer>
          ) : (
            <div className="text-center py-12 text-foreground/50">
              No featured hampers available at the moment.
            </div>
          )}
        </div>
      </section>

    </PageTransition>
  );
}
