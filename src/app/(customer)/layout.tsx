import { Metadata } from 'next';
import { Navbar } from '@/components/customer/Navbar';
import { Footer } from '@/components/customer/Footer';
import { SelectionProvider } from '@/contexts/SelectionContext';
import { SelectionSummary } from '@/components/customer/SelectionSummary';

export const metadata: Metadata = {
  title: {
    template: '%s | Hamperly',
    default: 'Hamperly - Personalized Gifting Experiences',
  },
  description: 'Create beautiful, personalized hampers for every occasion. Choose from our curated selection of premium gifts.',
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SelectionProvider>
      <div className="flex min-h-screen flex-col font-sans selection:bg-rose-200">
        <Navbar />
        <main className="flex-1 bg-slate-50">{children}</main>
        <Footer />
        <SelectionSummary />
      </div>
    </SelectionProvider>
  );
}
