import { getPublicOccasionBySlug, getPublicProducts } from '@/services/catalog.service';
import { ProductCard } from '@/components/customer/ProductCard';
import { PageTransition, FadeInScroll, StaggerScrollContainer } from '@/components/ui/AnimatedWrapper';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  const products = await getPublicProducts({ occasionId: occasion.id });

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
              <p className="text-lg md:text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
                {occasion.description}
              </p>
            )}
          </FadeInScroll>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
        <FadeInScroll>
          <div className="flex items-end justify-between mb-16 border-b border-slate-100 pb-4">
            <h2 className="text-3xl font-bold font-serif text-slate-900">Curated Gifts</h2>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{products.length} Items</span>
          </div>
        </FadeInScroll>

        {products.length > 0 ? (
          <StaggerScrollContainer>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <div key={product.id} className="h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </StaggerScrollContainer>
        ) : (
          <FadeInScroll>
            <div className="text-center py-32 bg-slate-50 rounded-[3rem] shadow-sm border border-slate-100">
              <h3 className="text-3xl font-bold font-serif text-slate-900 mb-4">Curating in progress</h3>
              <p className="text-slate-500 font-light text-lg mb-8">We are selecting the finest items for this collection.</p>
              <Link href="/products">
                <Button className="bg-slate-900 hover:bg-rose-600 text-white rounded-full px-8 h-12 transition-all duration-300">
                  Explore All Products
                </Button>
              </Link>
            </div>
          </FadeInScroll>
        )}
      </div>
    </PageTransition>
  );
}
