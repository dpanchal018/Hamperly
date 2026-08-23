import { getPublicHampers } from '@/actions/hamper.actions';
import { PageTransition, FadeInScroll, StaggerScrollContainer } from '@/components/ui/AnimatedWrapper';
import { Metadata } from 'next';
import Link from 'next/link';
import { Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HamperCard } from '@/components/customer/HamperCard';

export const metadata: Metadata = {
  title: 'Curated Hampers',
  description: 'Browse our beautiful collection of ready-to-gift curated hampers.',
};

export default async function PublicHampersPage() {
  const hampers = await getPublicHampers();

  return (
    <PageTransition className="min-h-screen pt-32 pb-24 bg-gradient-to-br from-[#F5F0FA] via-[#FFFDFD] to-[#FFF5F7]">
      <div className="container mx-auto px-4">
        <FadeInScroll>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-rose-600 font-semibold tracking-widest uppercase text-sm mb-4 block">Ready to Gift</span>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 font-serif tracking-tight leading-tight mb-6">
              Curated Hampers
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-light max-w-2xl mx-auto">
              Hand-picked and beautifully arranged by our experts. Ready to delight your loved ones instantly.
            </p>
          </div>
        </FadeInScroll>

        {hampers.length > 0 ? (
          <StaggerScrollContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hampers.map((hamper) => (
                <div key={hamper.id} className="h-full">
                  <HamperCard hamper={hamper} />
                </div>
              ))}
            </div>
          </StaggerScrollContainer>
        ) : (
          <FadeInScroll>
            <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-slate-100 max-w-3xl mx-auto">
              <Gift className="w-16 h-16 text-slate-300 mx-auto mb-6" strokeWidth={1} />
              <h3 className="text-3xl font-bold font-serif text-slate-900 mb-4">No Hampers Available</h3>
              <p className="text-slate-500 font-light mb-8 text-lg">We are currently curating new premium hampers. Please check back later!</p>
              <Link href="/products">
                <Button className="bg-slate-900 hover:bg-rose-600 text-white rounded-full px-8 h-12 transition-all duration-300">
                  Build Your Own Hamper <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </FadeInScroll>
        )}
      </div>
    </PageTransition>
  );
}
