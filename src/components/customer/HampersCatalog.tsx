'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { PublicHamper, Gender, RecipientTag, Occasion } from '@/types/database.types';
import { HamperCard } from '@/components/customer/HamperCard';
import { StaggerScrollContainer, FadeInScroll } from '@/components/ui/AnimatedWrapper';
import { Search, X, Gift, Sparkles, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HampersCatalogProps {
  initialHampers: PublicHamper[];
  initialQuery?: string;
  genders?: Gender[];
  recipientTags?: RecipientTag[];
  occasions?: Occasion[];
  hideOccasionFilter?: boolean;
}

const POPULAR_KEYWORDS = ['Coffee', 'Dry Fruits', 'Diwali', 'Kids', 'Pink', 'Boys', 'Girls', 'Snacks'];

export function HampersCatalog({ 
  initialHampers, 
  initialQuery = '',
  genders = [],
  recipientTags = [],
  occasions = [],
  hideOccasionFilter = false
}: HampersCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentQueryFromUrl = searchParams.get('q') || initialQuery;
  const initialGender = searchParams.get('gender') || '';
  const initialRecipient = searchParams.get('recipient') || '';
  const initialOccasion = searchParams.get('occasion') || '';
  const initialPriceRange = searchParams.get('priceRange') || '';

  const [searchQuery, setSearchQuery] = useState(currentQueryFromUrl);
  const [selectedGender, setSelectedGender] = useState(initialGender);
  const [selectedRecipient, setSelectedRecipient] = useState(initialRecipient);
  const [selectedOccasion, setSelectedOccasion] = useState(initialOccasion);
  const [selectedPriceRange, setSelectedPriceRange] = useState(initialPriceRange);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [, startTransition] = useTransition();

  // Sync state when URL changes externally
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedGender(searchParams.get('gender') || '');
    setSelectedRecipient(searchParams.get('recipient') || '');
    setSelectedOccasion(searchParams.get('occasion') || '');
    setSelectedPriceRange(searchParams.get('priceRange') || '');
  }, [searchParams]);

  const updateUrlParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }
    });
    
    startTransition(() => {
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateUrlParams({ q: value });
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'gender') setSelectedGender(value);
    if (key === 'recipient') setSelectedRecipient(value);
    if (key === 'occasion') setSelectedOccasion(value);
    if (key === 'priceRange') setSelectedPriceRange(value);
    updateUrlParams({ [key]: value });
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedGender('');
    setSelectedRecipient('');
    setSelectedOccasion('');
    setSelectedPriceRange('');
    updateUrlParams({ q: '', gender: '', recipient: '', occasion: '', priceRange: '' });
  };

  const handleKeywordClick = (keyword: string) => {
    if (searchQuery.toLowerCase() === keyword.toLowerCase()) {
      handleSearchChange('');
    } else {
      handleSearchChange(keyword);
    }
  };

  // Multi-field intelligent search filter
  const filteredHampers = useMemo(() => {
    let results = initialHampers;

    // Filter by Gender
    if (selectedGender) {
      results = results.filter(h => h.gender_id?.toString() === selectedGender);
    }

    // Filter by Occasion (matches this occasion or its children if it's a parent)
    if (selectedOccasion && !hideOccasionFilter) {
      const childOccasions = occasions.filter(o => o.parent_id?.toString() === selectedOccasion).map(o => o.id.toString());
      const validOccasionIds = [selectedOccasion, ...childOccasions];
      results = results.filter(h => validOccasionIds.includes(h.occasion_id?.toString() ?? ''));
    }

    // Filter by Recipient
    if (selectedRecipient) {
      results = results.filter(h => {
        const tags = h.hamper_recipient_tags || [];
        return tags.some((t) => t.recipient_tag_id?.toString() === selectedRecipient);
      });
    }

    // Filter by Price Range
    if (selectedPriceRange) {
      results = results.filter(h => {
        const price = h.selling_price || 0;
        if (selectedPriceRange === 'under_1000') return price < 1000;
        if (selectedPriceRange === '1000_2500') return price >= 1000 && price <= 2500;
        if (selectedPriceRange === '2500_5000') return price > 2500 && price <= 5000;
        if (selectedPriceRange === 'above_5000') return price > 5000;
        return true;
      });
    }

    // Filter by Search Query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const tokens = query.split(/\s+/).filter(Boolean);
      results = results.filter((hamper) => {
        const name = (hamper.name || '').toLowerCase();
        const description = (hamper.description || '').toLowerCase();
        const searchableText = `${name} ${description}`;
        return tokens.every((token) => searchableText.includes(token));
      });
    }

    return results;
  }, [initialHampers, searchQuery, selectedGender, selectedOccasion, selectedRecipient, selectedPriceRange, occasions, hideOccasionFilter]);

  const hasActiveFilters = searchQuery || selectedGender || selectedRecipient || selectedOccasion;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full flex items-center justify-center gap-2"
        >
          <Filter className="w-4 h-4" /> 
          {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Sidebar Filters */}
      <aside className={`lg:w-64 shrink-0 space-y-8 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Filters</h3>
            {hasActiveFilters && (
              <button onClick={handleClearAll} className="text-xs text-rose-600 hover:underline font-medium">
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Gender</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={selectedGender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="">All Genders</option>
                {genders.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Recipient</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={selectedRecipient}
                onChange={(e) => handleFilterChange('recipient', e.target.value)}
              >
                <option value="">Anyone</option>
                {recipientTags.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Price Range</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={selectedPriceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              >
                <option value="">Any Price</option>
                <option value="under_1000">Under ₹1,000</option>
                <option value="1000_2500">₹1,000 - ₹2,500</option>
                <option value="2500_5000">₹2,500 - ₹5,000</option>
                <option value="above_5000">Above ₹5,000</option>
              </select>
            </div>

            {!hideOccasionFilter && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Occasion</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={selectedOccasion}
                  onChange={(e) => handleFilterChange('occasion', e.target.value)}
                >
                  <option value="">Any Occasion</option>
                  {occasions.filter(o => !o.parent_id).map(parent => (
                    <optgroup key={parent.id} label={parent.name}>
                      <option value={parent.id}>All {parent.name}</option>
                      {occasions.filter(child => child.parent_id === parent.id).map(child => (
                        <option key={child.id} value={child.id}>{child.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        <FadeInScroll>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative flex items-center bg-white rounded-full border border-slate-200 shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all p-1.5 pl-5">
              <Search className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={2} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search hampers by name or contents..."
                aria-label="Search hampers"
                className="w-full bg-transparent px-3 py-2 text-sm md:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors mr-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs md:text-sm">
              <span className="text-slate-400 flex items-center gap-1 shrink-0 pl-2 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Popular:
              </span>
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
          </div>
        </FadeInScroll>

        {/* Results */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <p>Showing <strong>{filteredHampers.length}</strong> {filteredHampers.length === 1 ? 'hamper' : 'hampers'}</p>
        </div>

        {filteredHampers.length > 0 ? (
          <StaggerScrollContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredHampers.map((hamper) => (
                <div key={hamper.id} className="h-full">
                  <HamperCard hamper={hamper} />
                </div>
              ))}
            </div>
          </StaggerScrollContainer>
        ) : (
          <FadeInScroll>
            <div className="text-center py-16 px-6 bg-white rounded-3xl shadow-sm border border-slate-100 max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <Gift className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-serif text-slate-900">
                  No matching hampers
                </h3>
                <p className="text-slate-500 text-sm">
                  We couldn&apos;t find any hampers matching your selected filters. Try broadening your search or clearing some filters.
                </p>
              </div>
              <div className="pt-4">
                <Button onClick={handleClearAll} variant="outline" className="rounded-full px-6 border-slate-200">
                  Clear All Filters
                </Button>
              </div>
            </div>
          </FadeInScroll>
        )}
      </div>
    </div>
  );
}
