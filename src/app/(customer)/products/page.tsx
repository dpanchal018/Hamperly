import { getPublicProducts, getPublicCategories } from '@/services/catalog.service';
import { ProductCard } from '@/components/customer/ProductCard';
import { PageTransition, FadeInScroll, StaggerScrollContainer } from '@/components/ui/AnimatedWrapper';
import { Metadata } from 'next';
import Link from 'next/link';
import { Search, Filter, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Craft Your Hamper - Hamperly',
  description: 'Select premium items to build your personalized hamper.',
};

export const dynamic = 'force-dynamic';

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
    <PageTransition className="min-h-screen pt-24 pb-8 bg-background relative overflow-hidden">
      
      <div className="container mx-auto px-4 relative z-10">
        <FadeInScroll>
          <div className="text-center max-w-4xl mx-auto mb-10 border-b border-primary/10 pb-8">
            <span className="text-foreground/60 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">Your Creative Studio</span>
            <h1 className="text-5xl md:text-7xl font-extrabold font-serif tracking-tight text-foreground mb-4 leading-tight">
              CRAFT YOUR HAMPER.
            </h1>
            <p className="text-lg md:text-xl text-foreground/60 font-light max-w-2xl mx-auto">
              Select from our curated collection of premium goods. Every detail considered.
            </p>
          </div>
        </FadeInScroll>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-12 sticky top-32">
            <FadeInScroll delay={0.1}>
              <div className="space-y-12">
                <div>
                  <h3 className="font-bold text-foreground mb-4 flex items-center font-serif text-xl tracking-tight">
                    Search
                  </h3>
                  <form className="relative" method="GET">
                    {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
                    {inStockOnly && <input type="hidden" name="inStock" value="true" />}
                    
                    <input 
                      type="text" 
                      name="q"
                      defaultValue={searchQuery || ''}
                      placeholder="Find an item..."
                      className="w-full pl-4 pr-10 py-3 border-b border-primary/10 bg-transparent focus:outline-none focus:border-primary transition-all text-sm font-light rounded-3xl"
                    />
                    <button type="submit" aria-label="Search" className="absolute right-2 top-3 text-foreground/60 hover:text-foreground transition-colors">
                      <Search className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="font-bold text-foreground mb-4 flex items-center font-serif text-xl tracking-tight">
                    Collections
                  </h3>
                  <div className="space-y-4">
                    <Link 
                      href={`/products?${new URLSearchParams({...resolvedParams, category: ''}).toString()}`}
                      className={`block text-xs font-bold text-primary transition-colors ${!categoryFilter ? 'font-bold text-foreground' : 'text-foreground/60 hover:text-foreground font-semibold'}`}
                    >
                      All Items
                    </Link>
                    {categories.map(cat => (
                      <Link 
                        key={cat.id}
                        href={`/products?${new URLSearchParams({...resolvedParams, category: cat.id}).toString()}`}
                        className={`block text-xs font-bold text-primary transition-colors ${categoryFilter === cat.id ? 'font-bold text-foreground' : 'text-foreground/60 hover:text-foreground font-semibold'}`}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-foreground mb-4 flex items-center font-serif text-xl tracking-tight">
                    Availability
                  </h3>
                  <form method="GET">
                    {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
                    {searchQuery && <input type="hidden" name="q" value={searchQuery} />}
                    
                    <label className="flex items-center space-x-3 cursor-pointer mb-4 group">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          name="inStock" 
                          value="true" 
                          defaultChecked={inStockOnly}
                          className="peer appearance-none w-4 h-4 border border-primary/10 checked:border-primary checked:bg-primary rounded-3xl transition-colors cursor-pointer"
                        />
                        <div className="absolute inset-0 pointer-events-none opacity-0 peer-checked:opacity-100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      </div>
                      <span className="text-foreground/60 text-sm font-light group-hover:text-foreground transition-colors">In Stock Only</span>
                    </label>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary text-white rounded-3xl h-12 font-bold text-primary text-xs font-semibold transition-all duration-300">
                      Apply Filters
                    </Button>
                  </form>
                </div>
              </div>
            </FadeInScroll>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <FadeInScroll delay={0.2}>
              <div className="flex justify-between items-center mb-6 pb-2">
                <div className="text-foreground/60 text-xs font-bold text-primary font-semibold">
                  <span className="text-foreground font-bold">{products.length}</span> items
                </div>
                
                {(categoryFilter || searchQuery || inStockOnly) && (
                  <Link href="/products" className="text-primary hover:text-secondary text-xs font-bold text-primary font-semibold transition-colors flex items-center">
                    Clear filters <ArrowRight className="w-3 h-3 ml-2" />
                  </Link>
                )}
              </div>
            </FadeInScroll>

            {products.length > 0 ? (
              <StaggerScrollContainer>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="h-full">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </StaggerScrollContainer>
            ) : (
              <FadeInScroll>
                <div className="text-center py-16 bg-background border border-primary/10">
                  <Search className="w-12 h-12 text-cream mx-auto mb-4" strokeWidth={1} />
                  <h3 className="text-2xl font-bold font-serif text-foreground mb-4">No pieces found</h3>
                  <p className="text-foreground/60 font-light mb-8">Adjust your criteria to discover our collection.</p>
                  <Link href="/products">
                    <Button variant="outline" className="border-primary text-foreground hover:bg-primary hover:text-white rounded-3xl px-8 h-12 font-bold text-primary text-xs font-semibold">
                      Clear Filters
                    </Button>
                  </Link>
                </div>
              </FadeInScroll>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
