import { getPublicOccasions } from '@/services/catalog.service';
import { OccasionCard } from '@/components/customer/OccasionCard';
import { StaggerContainer, StaggerItem, PageTransition } from '@/components/ui/AnimatedWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop by Occasion',
  description: 'Browse our curated themes and occasions for the perfect personalized hamper.',
};

export default async function OccasionsPage() {
  const occasions = await getPublicOccasions();

  return (
    <PageTransition className="container mx-auto px-4 py-16">
      <StaggerContainer>
        <StaggerItem className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Shop by Occasion
          </h1>
          <p className="text-lg text-slate-600">
            Select the event you're celebrating to explore our curated collections of premium gifts, perfectly suited for the moment.
          </p>
        </StaggerItem>

        {occasions.length > 0 ? (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {occasions.map((occasion) => (
              <StaggerItem key={occasion.id}>
                <OccasionCard occasion={occasion} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Occasions will appear here soon.</h3>
            <p className="text-slate-500">We are currently curating the perfect themes.</p>
          </div>
        )}
      </StaggerContainer>
    </PageTransition>
  );
}
