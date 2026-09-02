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
      case 'IN STOCK': return 'text-slate-500';
      case 'LOW STOCK': return 'text-amber-600';
      case 'CRITICAL': return 'text-orange-600';
      case 'OUT OF STOCK': return 'text-rose-600';
      default: return 'text-slate-500';
    }
  };

  return (
    <PageTransition className="bg-[#FFFDFD] min-h-screen pt-12 lg:pt-16 pb-16 border-t border-slate-100">
      <div className="container mx-auto px-4 lg:px-8 xl:px-12">
        <FadeInScroll>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center text-xs font-semibold text-slate-500 mb-6">
            <Link href="/products" className="hover:text-slate-900 transition-colors flex items-center">
              <ArrowLeft className="w-3 h-3 mr-2" /> Studio
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-400">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start">
            
            {/* Image Gallery */}
            <div className="relative aspect-[4/5] bg-slate-50 rounded-[2rem] flex items-center justify-center">
              {product.primary_image_url ? (
                <img 
                  src={product.primary_image_url} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-8"
                />
              ) : (
                <div className="text-slate-400 font-serif text-2xl italic font-light">No image available</div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-center">
              <div className="mb-6 border-b border-slate-200 pb-6">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {product.category && (
                    <span className="text-xs font-semibold text-rose-600 uppercase tracking-widest">
                      {product.category.name}
                    </span>
                  )}
                  {product.category && <span className="text-slate-300">|</span>}
                  <span className={`text-[10px] font-bold ${getStatusColor(status)}`}>
                    {customerStatus}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 font-serif tracking-tight leading-[1.1] mb-6">
                  {product.name}
                </h1>
                
                <div className="text-2xl font-medium text-slate-900 tracking-wide">
                  ₹{product.selling_price.toFixed(2)}
                </div>
              </div>

              <div className="prose prose-lg text-slate-500 font-light leading-relaxed mb-8">
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
