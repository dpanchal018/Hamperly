import { Suspense } from 'react';
import { getPublicOccasions, getPublicProducts, getPublicCategories } from '@/services/catalog.service';
import { getPublicCustomizations } from '@/actions/customization.actions';
import { HamperStudio } from '@/components/customer/builder/HamperStudio';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hamper Creation Studio | Hamperly',
  description: 'Design and curate your bespoke personalized gift hamper.'
};

export const dynamic = 'force-dynamic';

export default async function BuildHamperPage() {
  const [occasions, products, categories, customizationCategories] = await Promise.all([
    getPublicOccasions(),
    getPublicProducts(),
    getPublicCategories(),
    getPublicCustomizations()
  ]);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600" />
      </div>
    }>
      <HamperStudio
        occasions={occasions}
        products={products}
        categories={categories}
        customizationCategories={customizationCategories}
      />
    </Suspense>
  );
}
