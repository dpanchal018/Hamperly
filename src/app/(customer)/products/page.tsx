import { getPublicProducts, getPublicOccasions } from '@/services/catalog.service';
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
  searchParams: Promise<{ occasion?: string; q?: string; inStock?: string }>;
}) {
  const resolvedParams = await searchParams;
  const occasions = await getPublicOccasions().then(occs => occs.filter(o => !o.parent_id));
  
  const occasionFilter = resolvedParams.occasion;
  const searchQuery = resolvedParams.q;
  const inStockOnly = resolvedParams.inStock === 'true';

  const products = await getPublicProducts({
    occasionId: occasionFilter,
    searchQuery: searchQuery,
    inStockOnly: inStockOnly,
  });

  return (
    <PageTransition className="min-h-screen pt-12 lg:pt-16 pb-12 bg-gradient-to-br from-[#F5F0FA] via-[#FFFDFD] to-[#FFF5F7] relative overflow-hidden">
      
      <div className="container mx-auto px-4 relative z-10">
        <FadeInScroll>
          <div className="text-center max-w-4xl mx-auto mb-8 border-b border-slate-200 pb-4">
            <span className="text-rose-600 font-semibold tracking-widest uppercase text-sm mb-3 block">Your Creative Studio</span>
            <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-tight text-slate-900 mb-3 leading-tight">
              CRAFT YOUR HAMPER.
            </h1>
            <p className="text-base md:text-lg text-slate-500 font-light max-w-2xl mx-auto">
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
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center font-serif text-xl tracking-tight">
                    Search
                  </h3>
                  <form className="relative" method="GET">
                    {occasionFilter && <input type="hidden" name="occasion" value={occasionFilter} />}
                    {inStockOnly && <input type="hidden" name="inStock" value="true" />}
                    
                    <input 
                      type="text" 
                      name="q"
                      defaultValue={searchQuery || ''}
                      placeholder="Find an item..."
                      className="w-full pl-4 pr-10 py-3 border border-slate-200 bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all text-sm font-light rounded-3xl shadow-sm"
                    />
                    <button type="submit" aria-label="Search" className="absolute right-3 top-3.5 text-slate-400 hover:text-rose-600 transition-colors">
                      <Search className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center font-serif text-xl tracking-tight">
                    Collections
                  </h3>
                  <div className="space-y-4">
                    <Link 
                      href={`/products?${new URLSearchParams({...resolvedParams, occasion: ''}).toString()}`}
                      className={`block text-sm transition-colors ${!occasionFilter ? 'font-bold text-rose-600' : 'text-slate-500 hover:text-slate-900 font-medium'}`}
                    >
                      All Items
                    </Link>
                    {occasions.map(occ => (
                      <Link 
                        key={occ.id}
                        href={`/products?${new URLSearchParams({...resolvedParams, occasion: occ.id}).toString()}`}
                        className={`block text-sm transition-colors ${occasionFilter === occ.id ? 'font-bold text-rose-600' : 'text-slate-500 hover:text-slate-900 font-medium'}`}
                      >
                        {occ.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center font-serif text-xl tracking-tight">
                    Availability
                  </h3>
                  <form method="GET">
                    {occasionFilter && <input type="hidden" name="occasion" value={occasionFilter} />}
                    {searchQuery && <input type="hidden" name="q" value={searchQuery} />}
                    
                    <label className="flex items-center space-x-3 cursor-pointer mb-4 group">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          name="inStock" 
                          value="true" 
                          defaultChecked={inStockOnly}
                          className="peer appearance-none w-4 h-4 border border-slate-200 checked:border-rose-600 checked:bg-rose-600 rounded shadow-sm bg-white transition-colors cursor-pointer"
                        />
                        <div className="absolute inset-0 pointer-events-none opacity-0 peer-checked:opacity-100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      </div>
                      <span className="text-slate-500 text-sm font-light group-hover:text-slate-900 transition-colors">In Stock Only</span>
                    </label>
                    <Button type="submit" className="w-full bg-slate-900 hover:bg-rose-600 text-white rounded-3xl h-12 text-sm font-semibold transition-all duration-300">
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
                <div className="text-slate-500 text-sm">
                  <span className="text-slate-900 font-bold">{products.length}</span> items
                </div>
                
                {(occasionFilter || searchQuery || inStockOnly) && (
                  <Link href="/products" className="text-rose-600 hover:text-rose-700 text-sm font-semibold transition-colors flex items-center">
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
                <div className="text-center py-16 bg-white rounded-[3rem] shadow-sm border border-slate-100">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1} />
                  <h3 className="text-2xl font-bold font-serif text-slate-900 mb-4">No pieces found</h3>
                  <p className="text-slate-500 font-light mb-8 text-lg">Adjust your criteria to discover our collection.</p>
                  <Link href="/products">
                    <Button variant="outline" className="border-slate-200 text-slate-900 hover:bg-rose-600 hover:text-white hover:border-rose-600 rounded-3xl px-8 h-12 text-sm font-semibold transition-all duration-300">
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
