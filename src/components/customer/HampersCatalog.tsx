'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { PreMadeHamper } from '@/types/database.types';
import { HamperCard } from '@/components/customer/HamperCard';
import { StaggerScrollContainer, FadeInScroll } from '@/components/ui/AnimatedWrapper';
import { Search, X, Gift, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface HampersCatalogProps {
  initialHampers: PreMadeHamper[];
  initialQuery?: string;
}

const POPULAR_KEYWORDS = [
  'Coffee',
  'Dry Fruits',
  'Diwali',
  'Kids',
  'Pink',
  'Boys',
  'Girls',
  'Snacks',
  'Tumbler',
];

export function HampersCatalog({ initialHampers, initialQuery = '' }: HampersCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentQueryFromUrl = searchParams.get('q') || initialQuery;
  const [searchQuery, setSearchQuery] = useState(currentQueryFromUrl);
  const [, startTransition] = useTransition();

  // Sync URL query parameter smoothly without full page reload
  const updateUrlQuery = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }
    
    startTransition(() => {
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateUrlQuery(value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    updateUrlQuery('');
  };

  const handleKeywordClick = (keyword: string) => {
    if (searchQuery.toLowerCase() === keyword.toLowerCase()) {
      handleClearSearch();
    } else {
      handleSearchChange(keyword);
    }
  };

  // Multi-field intelligent search filter
  const filteredHampers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return initialHampers;

    const tokens = query.split(/\s+/).filter(Boolean);

    return initialHampers.filter((hamper) => {
      const name = (hamper.name || '').toLowerCase();
      const description = (hamper.description || '').toLowerCase();
      const searchableText = `${name} ${description}`;

      // Every word token in the search query must match either name or description
      return tokens.every((token) => searchableText.includes(token));
    });
  }, [initialHampers, searchQuery]);

  return (
    <div className="space-y-10">
      {/* Search & Filter Header */}
      <FadeInScroll>
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Main Search Bar */}
          <div className="relative flex items-center bg-white rounded-full border border-slate-200 shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all p-1.5 pl-5">
            <Search className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search hampers by name, occasion, or items (e.g., Coffee, Diwali, Dry Fruits)..."
              aria-label="Search hampers"
              className="w-full bg-transparent px-3 py-2 text-sm md:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Popular Search Keywords Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs md:text-sm">
            <span className="text-slate-400 flex items-center gap-1 shrink-0 pl-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Popular:
            </span>
            <button
              onClick={handleClearSearch}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                !searchQuery
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All
            </button>
            {POPULAR_KEYWORDS.map((keyword) => {
              const isActive = searchQuery.toLowerCase() === keyword.toLowerCase();
              return (
                <button
                  key={keyword}
                  onClick={() => handleKeywordClick(keyword)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {keyword}
                </button>
              );
            })}
          </div>

          {/* Results Summary Counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-3">
            <span>
              {searchQuery ? (
                <>
                  Showing <strong>{filteredHampers.length}</strong> of {initialHampers.length} hampers matching &quot;{searchQuery}&quot;
                </>
              ) : (
                <>Showing all <strong>{initialHampers.length}</strong> curated hampers</>
              )}
            </span>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="text-primary hover:underline font-medium"
              >
                Reset search
              </button>
            )}
          </div>
        </div>
      </FadeInScroll>

      {/* Hampers Grid or Empty State */}
      {filteredHampers.length > 0 ? (
        <StaggerScrollContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHampers.map((hamper) => (
              <div key={hamper.id} className="h-full">
                <HamperCard hamper={hamper} />
              </div>
            ))}
          </div>
        </StaggerScrollContainer>
      ) : (
        /* Empty Search Results State */
        <FadeInScroll>
          <div className="text-center py-16 px-6 bg-white rounded-3xl shadow-sm border border-slate-100 max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <Gift className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold font-serif text-slate-900">
                No hampers found
              </h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm">
                We couldn&apos;t find any curated hampers matching &quot;<strong>{searchQuery}</strong>&quot;. Try checking for typos or searching a different keyword.
              </p>
            </div>

            {/* Quick Keyword Recovery Chips */}
            <div className="pt-2">
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Try searching for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Coffee', 'Dry Fruits', 'Diwali', 'Kids', 'Pink'].map((kw) => (
                  <button
                    key={kw}
                    onClick={() => handleKeywordClick(kw)}
                    className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Button
                onClick={handleClearSearch}
                variant="outline"
                className="rounded-full px-6 border-slate-200"
              >
                Clear Search
              </Button>
              <Link href="/products">
                <Button className="bg-slate-900 hover:bg-rose-600 text-white rounded-full px-6 transition-all duration-300">
                  Build Custom Hamper <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </FadeInScroll>
      )}
    </div>
  );
}
