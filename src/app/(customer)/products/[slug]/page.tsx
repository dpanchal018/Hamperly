import { getPublicProductBySlug } from '@/services/catalog.service';
import { PageTransition, FadeInScroll } from '@/components/ui/AnimatedWrapper';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Tag } from 'lucide-react';
import { getInventoryStatus } from '@/lib/inventory';
import { ProductDetailActions } from '@/components/customer/ProductDetailActions';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const resolvedParams = await props.params;
  const product = await getPublicProductBySlug(resolvedParams.slug);
  
  if (!product) {
    return { title: 'Product Not Found' };
  }
  
  return {
    title: product.name,
    description: product.description || `Buy ${product.name} at Hamperly.`,
  };
}

export default async function ProductDetailPage(props: Props) {
  const resolvedParams = await props.params;
  const product = await getPublicProductBySlug(resolvedParams.slug);
  
  if (!product) {
    notFound();
  }

  const status = getInventoryStatus(product.stock_quantity);
  const customerStatus = status === 'CRITICAL' ? 'LOW STOCK' : status;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'IN STOCK': return 'text-foreground/60';
      case 'LOW STOCK': return 'text-gold';
      case 'CRITICAL': return 'text-gold';
      case 'OUT OF STOCK': return 'text-red-900/50';
      default: return 'text-foreground/60';
    }
  };

  return (
    <PageTransition className="bg-background min-h-screen pt-32 pb-24 border-t border-primary/10">
      <div className="container mx-auto px-4 max-w-6xl">
        <FadeInScroll>
          <Link href="/products" className="inline-flex items-center text-xs font-semibold font-bold text-primary text-foreground/60 hover:text-foreground mb-16 transition-colors">
            <ArrowLeft className="w-3 h-3 mr-2" /> Back to Studio
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            {/* Image Gallery */}
            <div className="relative aspect-[4/5] bg-primary/5 flex items-center justify-center">
              {product.primary_image_url ? (
                <img 
                  src={product.primary_image_url} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-8"
                />
              ) : (
                <div className="text-foreground/60 font-serif text-2xl italic font-light">No image available</div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-center">
              <div className="mb-8 border-b border-primary/10 pb-8">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {product.category && (
                    <span className="text-xs font-bold font-bold text-primary text-foreground/60">
                      {product.category.name}
                    </span>
                  )}
                  {product.category && <span className="text-cream">|</span>}
                  <span className={`text-[10px] font-bold font-bold text-primary ${getStatusColor(status)}`}>
                    {customerStatus}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground font-serif tracking-tight leading-[1.1] mb-6">
                  {product.name}
                </h1>
                
                <div className="text-2xl font-medium text-foreground tracking-wide">
                  ?{product.selling_price.toFixed(2)}
                </div>
              </div>

              <div className="prose prose-lg text-foreground/60 font-light leading-relaxed mb-12">
                <p>
                  {product.description || "A premium selection curated for the finest moments."}
                </p>
              </div>

              <div>
                <ProductDetailActions product={product} />
              </div>
            </div>
          </div>
        </FadeInScroll>
      </div>
    </PageTransition>
  );
}
