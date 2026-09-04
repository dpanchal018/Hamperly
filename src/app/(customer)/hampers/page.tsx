import { getPublicHampers } from '@/actions/hamper.actions';
import { createClient } from '@/lib/supabase/server';
import { PageTransition, FadeInScroll } from '@/components/ui/AnimatedWrapper';
import { Metadata } from 'next';
import Link from 'next/link';
import { Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HampersCatalog } from '@/components/customer/HampersCatalog';

export const metadata: Metadata = {
  title: 'Curated Hampers',
  description: 'Browse our beautiful collection of ready-to-gift curated hampers.',
};

export const dynamic = 'force-dynamic';

export default async function PublicHampersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const hampers = await getPublicHampers();
  const supabase = await createClient();

  const [
    { data: genders },
    { data: recipientTags },
    { data: occasions }
  ] = await Promise.all([
    supabase.from('genders').select('*').order('name'),
    supabase.from('recipient_tags').select('*').order('name'),
    supabase.from('occasions').select('*').order('display_order')
  ]);

  return (
    <PageTransition className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#F5F0FA] via-[#FFFDFD] to-[#FFF5F7]">
      <div className="container mx-auto px-4">
        <FadeInScroll>
          <div className="text-center max-w-3xl mx-auto mb-8">
            <span className="text-rose-600 font-semibold tracking-widest uppercase text-sm mb-3 block">Ready to Gift</span>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 font-serif tracking-tight leading-tight mb-3">
              Curated Hampers
            </h1>
            <p className="text-base md:text-lg text-slate-500 font-light max-w-2xl mx-auto">
              Hand-picked and beautifully arranged by our gifting experts. Ready to delight instantly.
            </p>
          </div>
        </FadeInScroll>

        {hampers.length > 0 ? (
          <HampersCatalog 
            initialHampers={hampers} 
            initialQuery={resolvedParams?.q}
            genders={genders || []}
            recipientTags={recipientTags || []}
            occasions={occasions || []}
          />
        ) : (
          <FadeInScroll>
            <div className="text-center py-16 bg-white rounded-[3rem] shadow-sm border border-slate-100 max-w-3xl mx-auto">
              <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" strokeWidth={1} />
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
