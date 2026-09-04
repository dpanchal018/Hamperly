import { getPublicEventBySlug } from '@/actions/event.actions';
import { getPublicHampers } from '@/actions/hamper.actions';
import { getPublicProducts } from '@/services/catalog.service';
import { createClient } from '@/lib/supabase/server';
import { HampersCatalog } from '@/components/customer/HampersCatalog';
import { ProductCard } from '@/components/customer/ProductCard';
import { PageTransition, FadeInScroll, StaggerScrollContainer } from '@/components/ui/AnimatedWrapper';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const resolvedParams = await props.params;
  const event = await getPublicEventBySlug(resolvedParams.slug);

  if (!event) {
    return { title: 'Event Not Found' };
  }

  return {
    title: event.name,
    description: event.description || `Explore premium products and hampers curated for ${event.name}.`,
  };
}

export default async function EventDetailPage(props: Props) {
  const resolvedParams = await props.params;
  const event = await getPublicEventBySlug(resolvedParams.slug);

  if (!event) {
    notFound();
  }

  const supabase = await createClient();

  const [{ data: occasion }, allHampers, products, { data: genders }, { data: recipientTags }] = await Promise.all([
    supabase.from('occasions').select('name, slug').eq('id', event.occasion_id).single(),
    getPublicHampers(),
    getPublicProducts({ eventId: event.id }),
    supabase.from('genders').select('*').order('name'),
    supabase.from('recipient_tags').select('*').order('name'),
  ]);

  const filteredHampers = allHampers.filter(h => h.event_id === event.id);

  return (
    <PageTransition className="bg-gradient-to-b from-[#FAFAFA] to-white min-h-screen">
      {/* Event Hero */}
      <div className="relative h-[50vh] min-h-[420px] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {event.image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
            style={{ backgroundImage: `url(${event.image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-rose-900 opacity-80" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        <div className="relative z-10 text-center px-4 max-w-4xl mt-20">
          <FadeInScroll>
            {occasion && (
              <Link href={`/occasions/${occasion.slug}`} className="text-rose-400 font-bold tracking-[0.3em] uppercase text-xs mb-6 block hover:text-rose-300 transition-colors">
                {occasion.name}
              </Link>
            )}
            <h1 className="text-5xl md:text-7xl font-black text-white font-serif tracking-tight leading-[1.1] mb-6">
              {event.name}
            </h1>
            {event.description && (
              <p className="text-lg md:text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
                {event.description}
              </p>
            )}
          </FadeInScroll>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
        {products.length > 0 && (
          <>
            <FadeInScroll>
              <div className="flex items-end justify-between mb-16 border-b border-slate-100 pb-4">
                <h2 className="text-3xl font-bold font-serif text-slate-900">Products for {event.name}</h2>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{products.length} Items</span>
              </div>
            </FadeInScroll>
            <StaggerScrollContainer>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                {products.map((product) => (
                  <div key={product.id} className="h-full">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </StaggerScrollContainer>
          </>
        )}

        <FadeInScroll>
          <div className="flex items-end justify-between mb-16 border-b border-slate-100 pb-4">
            <h2 className="text-3xl font-bold font-serif text-slate-900">Curated Hampers for {event.name}</h2>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{filteredHampers.length} Hampers</span>
          </div>
        </FadeInScroll>

        {filteredHampers.length > 0 ? (
          <HampersCatalog
            initialHampers={filteredHampers}
            genders={genders || []}
            recipientTags={recipientTags || []}
            hideOccasionFilter={true}
          />
        ) : products.length === 0 ? (
          <FadeInScroll>
            <div className="text-center py-32 bg-slate-50 rounded-[3rem] shadow-sm border border-slate-100">
              <h3 className="text-3xl font-bold font-serif text-slate-900 mb-4">Curating in progress</h3>
              <p className="text-slate-500 font-light text-lg mb-8">We are selecting the finest gifts for this event.</p>
              {occasion && (
                <Link href={`/occasions/${occasion.slug}`}>
                  <Button className="bg-slate-900 hover:bg-rose-600 text-white rounded-full px-8 h-12 transition-all duration-300">
                    Back to {occasion.name}
                  </Button>
                </Link>
              )}
            </div>
          </FadeInScroll>
        ) : null}
      </div>
    </PageTransition>
  );
}
