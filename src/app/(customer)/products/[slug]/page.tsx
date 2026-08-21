import { getPublicProductBySlug } from '@/services/catalog.service';
import { PageTransition } from '@/components/ui/AnimatedWrapper';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Tag } from 'lucide-react';
import { getInventoryStatus, getInventoryStatusColor } from '@/lib/inventory';
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
      case 'IN STOCK': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'LOW STOCK': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CRITICAL': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'OUT OF STOCK': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <PageTransition className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
      <Link href="/products" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-rose-600 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
      </Link>

      <div className="bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
              {product.primary_image_url ? (
                <img 
                  src={product.primary_image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-400 font-medium">No image available</div>
              )}
            </div>
            {/* If we had multiple images, thumbnails would go here */}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {product.category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    <Tag className="w-3 h-3 mr-1" /> {product.category.name}
                  </span>
                )}
                <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold ${getStatusColor(status)}`}>
                  {customerStatus}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                {product.name}
              </h1>
            </div>

            <div className="prose prose-slate max-w-none mb-10">
              <p className="text-slate-600 text-lg leading-relaxed">
                {product.description || "No description provided for this premium item."}
              </p>
            </div>

            <div className="mt-auto border-t border-slate-100 pt-8">
              <ProductDetailActions product={product} />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
