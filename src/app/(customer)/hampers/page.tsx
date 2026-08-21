import { getPublicHampers } from '@/actions/hamper.actions';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedWrapper';
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
    <PageTransition className="container mx-auto px-4 py-12">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 bg-secondary rounded-full text-primary mb-4">
          <Gift className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-foreground mb-4">
          Curated Hampers
        </h1>
        <p className="text-lg text-muted-foreground">
          Hand-picked and beautifully arranged by our experts. Ready to delight your loved ones instantly.
        </p>
      </div>

      {hampers.length > 0 ? (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {hampers.map((hamper) => (
            <StaggerItem key={hamper.id}>
              <HamperCard hamper={hamper} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <div className="text-center py-24 bg-card rounded-3xl shadow-sm border border-border max-w-2xl mx-auto">
          <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
          <h3 className="text-2xl font-bold font-serif text-foreground mb-2">No Hampers Available</h3>
          <p className="text-muted-foreground mb-8">We are currently curating new premium hampers. Please check back later!</p>
          <Link href="/products">
            <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:opacity-90">
              Build Your Own Hamper <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </PageTransition>
  );
}
