import { getPublicOccasionBySlug, getPublicProducts } from '@/services/catalog.service';
import { ProductCard } from '@/components/customer/ProductCard';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedWrapper';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { Calendar } from 'lucide-react';
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
    <PageTransition>
      {/* Occasion Hero */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full bg-slate-900 overflow-hidden">
        {occasion.image_url ? (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${occasion.image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 opacity-80" />
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-t from-slate-900 via-transparent to-transparent">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            {occasion.name}
          </h1>
          {occasion.description && (
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              {occasion.description}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Curated Gifts</h2>
          <span className="text-sm font-medium text-slate-500">{products.length} Products</span>
        </div>

        {products.length > 0 ? (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">We're preparing gifts for this occasion.</h3>
            <p className="text-slate-500 mb-6">Check back soon for curated products.</p>
            <Link href="/products">
              <Button>Explore All Products</Button>
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
