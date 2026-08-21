import { getPublicProducts, getPublicCategories } from '@/services/catalog.service';
import { ProductCard } from '@/components/customer/ProductCard';
import { StaggerContainer, StaggerItem, PageTransition } from '@/components/ui/AnimatedWrapper';
import { Metadata } from 'next';
import Link from 'next/link';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Explore Products',
  description: 'Browse our entire catalog of premium gifts and build your personalized hamper.',
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; inStock?: string }>;
}) {
  const resolvedParams = await searchParams;
  const categories = await getPublicCategories();
  
  const categoryFilter = resolvedParams.category;
  const searchQuery = resolvedParams.q;
  const inStockOnly = resolvedParams.inStock === 'true';

  const products = await getPublicProducts({
    categoryId: categoryFilter,
    searchQuery: searchQuery,
    inStockOnly: inStockOnly,
  });

  return (
    <PageTransition className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold font-serif tracking-tight text-foreground mb-4">
          Explore Products
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Discover premium items to include in your personalized hamper.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-8 bg-card p-6 rounded-2xl border border-border shadow-sm sticky top-24">
          <div>
            <h3 className="font-bold text-foreground mb-4 flex items-center">
              <Search className="w-4 h-4 mr-2" /> Search
            </h3>
            <form className="relative" method="GET">
              {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
              {inStockOnly && <input type="hidden" name="inStock" value="true" />}
              
              <input 
                type="text" 
                name="q"
                defaultValue={searchQuery || ''}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            </form>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center">
              <Filter className="w-4 h-4 mr-2" /> Categories
            </h3>
            <div className="space-y-2">
              <Link 
                href={`/products?${new URLSearchParams({...resolvedParams, category: ''}).toString()}`}
                className={`block text-sm py-1 transition-colors ${!categoryFilter ? 'font-bold text-primary' : 'text-muted-foreground hover:text-primary'}`}
              >
                All Categories
              </Link>
              {categories.map(cat => (
                <Link 
                  key={cat.id}
                  href={`/products?${new URLSearchParams({...resolvedParams, category: cat.id}).toString()}`}
                  className={`block text-sm py-1 transition-colors ${categoryFilter === cat.id ? 'font-bold text-primary' : 'text-muted-foreground hover:text-primary'}`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center">
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Availability
            </h3>
            <form method="GET">
              {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
              {searchQuery && <input type="hidden" name="q" value={searchQuery} />}
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="inStock" 
                  value="true" 
                  defaultChecked={inStockOnly}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">In Stock Only</span>
              </label>
              <Button type="submit" size="sm" className="mt-4 w-full">Apply Filters</Button>
            </form>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-muted-foreground font-medium">
              Showing <span className="text-foreground font-bold">{products.length}</span> results
            </div>
            
            {(categoryFilter || searchQuery || inStockOnly) && (
              <Link href="/products" className="text-sm text-primary hover:opacity-80 font-medium">
                Clear all filters
              </Link>
            )}
          </div>

          {products.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="text-center py-24 bg-card rounded-3xl shadow-sm border border-border">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold font-serif text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
              <Link href="/products">
                <Button variant="outline">Clear Filters</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
