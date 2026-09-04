import { getPublicOccasionBySlug } from '@/services/catalog.service';
import { getPublicHampers } from '@/actions/hamper.actions';
import { getPublicEvents } from '@/actions/event.actions';
import { createClient } from '@/lib/supabase/server';
import { HampersCatalog } from '@/components/customer/HampersCatalog';
import { PageTransition, FadeInScroll, StaggerScrollContainer } from '@/components/ui/AnimatedWrapper';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const resolvedParams = await props.params;
  const occasion = await getPublicOccasionBySlug(resolvedParams.slug);
  
  if (!occasion) {
    return { title: 'Occasion Not Found' };
  }
  
  return {
    title: occasion.name,
    description: occasion.description || `Explore premium products curated for ${occasion.name}.`,
  };
}

export default async function OccasionDetailPage(props: Props) {
  const resolvedParams = await props.params;
  const occasion = await getPublicOccasionBySlug(resolvedParams.slug);
  
  if (!occasion) {
    notFound();
  }

  const supabase = await createClient();
  const allHampers = await getPublicHampers();
  
  // Filter hampers to only those matching this occasion (or its children if it's a parent)
  // Fetch children if this is a parent occasion
  let validOccasionIds = [occasion.id];
  if (!occasion.parent_id) {
    const { data: children } = await supabase.from('occasions').select('id').eq('parent_id', occasion.id);
    if (children) {
      validOccasionIds = [...validOccasionIds, ...children.map(c => c.id)];
    }
  }

  const filteredHampers = allHampers.filter(h => h.occasion_id && validOccasionIds.includes(h.occasion_id));

  const [
    { data: genders },
    { data: recipientTags },
    events
  ] = await Promise.all([
    supabase.from('genders').select('*').order('name'),
    supabase.from('recipient_tags').select('*').order('name'),
    getPublicEvents(occasion.id)
  ]);

  return (
    <PageTransition className="bg-gradient-to-b from-[#FAFAFA] to-white min-h-screen">
      {/* Occasion Hero */}
      <div className="relative h-[60vh] min-h-[500px] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {occasion.image_url ? (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
            style={{ backgroundImage: `url(${occasion.image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-rose-900 opacity-80" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mt-20">
          <FadeInScroll>
            <span className="text-rose-400 font-bold tracking-[0.3em] uppercase text-xs mb-6 block">Curated Collection</span>
            <h1 className="text-5xl md:text-7xl font-black text-white font-serif tracking-tight leading-[1.1] mb-6">
              {occasion.name}
            </h1>
            {occasion.description && (
              <p className="text-lg md:text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed mb-6">
                {occasion.description}
              </p>
            )}
            <Link href={`/build?occasion=${occasion.slug}`}>
              <Button size="lg" className="rounded-full px-8 h-12 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-lg shadow-rose-900/30">
                Curate a {occasion.name} Hamper
              </Button>
            </Link>
          </FadeInScroll>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
        {events.length > 0 && (
          <>
            <FadeInScroll>
              <div className="flex items-end justify-between mb-10 border-b border-slate-100 pb-4">
                <h2 className="text-3xl font-bold font-serif text-slate-900">Explore {occasion.name}</h2>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{events.length} Events</span>
              </div>
            </FadeInScroll>
            <StaggerScrollContainer>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                {events.map(event => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group relative h-56 rounded-3xl overflow-hidden shadow-sm border border-slate-100 block"
                  >
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-rose-900 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-white/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-lg font-bold text-white font-serif">{event.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </StaggerScrollContainer>
          </>
        )}

        <FadeInScroll>
          <div className="flex items-end justify-between mb-16 border-b border-slate-100 pb-4">
            <h2 className="text-3xl font-bold font-serif text-slate-900">Curated Hampers for {occasion.name}</h2>
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
        ) : (
          <FadeInScroll>
            <div className="text-center py-32 bg-slate-50 rounded-[3rem] shadow-sm border border-slate-100">
              <h3 className="text-3xl font-bold font-serif text-slate-900 mb-4">Curating in progress</h3>
              <p className="text-slate-500 font-light text-lg mb-8">We are selecting the finest hampers for this collection.</p>
              <Link href="/hampers">
                <Button className="bg-slate-900 hover:bg-rose-600 text-white rounded-full px-8 h-12 transition-all duration-300">
                  Explore All Hampers
                </Button>
              </Link>
            </div>
          </FadeInScroll>
        )}
      </div>
    </PageTransition>
  );
}
