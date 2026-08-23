import { getPublicOccasions } from '@/services/catalog.service';
import { OccasionCard } from '@/components/customer/OccasionCard';
import { PageTransition, FadeInScroll, StaggerScrollContainer } from '@/components/ui/AnimatedWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop by Occasion',
  description: 'Browse our curated themes and occasions for the perfect personalized hamper.',
};

export default async function OccasionsPage() {
  const occasions = await getPublicOccasions();

  return (
    <PageTransition className="min-h-screen pt-32 pb-24 bg-gradient-to-tr from-[#F0F5FA] via-[#FDFDFD] to-[#F3F0FA]">
      <div className="container mx-auto px-4">
        <FadeInScroll>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-rose-600 font-semibold tracking-widest uppercase text-sm mb-4 block">Our Collections</span>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 font-serif tracking-tight leading-tight mb-6">
              Shop by Occasion
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-light">
              Select the event you're celebrating to explore our curated collections of premium gifts, perfectly suited for the moment.
            </p>
          </div>
        </FadeInScroll>

        {occasions.length > 0 ? (
          <StaggerScrollContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[450px]">
              {occasions.map((occasion, i) => (
                <div key={occasion.id} className={`h-full ${i % 5 === 0 || i % 5 === 3 ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
                  <OccasionCard occasion={occasion} />
                </div>
              ))}
            </div>
          </StaggerScrollContainer>
        ) : (
          <FadeInScroll>
            <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-100 max-w-3xl mx-auto shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-2 font-serif">Collections arriving soon</h3>
              <p className="text-slate-500 font-light">We are currently curating the perfect themes.</p>
            </div>
          </FadeInScroll>
        )}
      </div>
    </PageTransition>
  );
}
