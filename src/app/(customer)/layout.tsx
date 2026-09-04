import { Metadata } from 'next';
import { Navbar } from '@/components/customer/Navbar';
import { Footer } from '@/components/customer/Footer';
import { CartSlideover } from '@/components/customer/CartSlideover';
import { ChatWidget } from '@/components/customer/ChatWidget';
import { HamperBuilderProvider } from '@/contexts/HamperBuilderContext';
import { getPublicCustomizations } from '@/actions/customization.actions';

export const metadata: Metadata = {
  title: {
    template: '%s | Hamperly',
    default: 'Hamperly - Personalized Gifting Experiences',
  },
  description: 'Create beautiful, personalized hampers for every occasion. Choose from our curated selection of premium gifts.',
};

import { getCurrentUser, getCurrentUserRole } from '@/services/auth.service';
import { getStoreSettings } from '@/actions/settings.actions';
import { getSiteContent, defaultHeaderContent, defaultFooterContent } from '@/services/content.service';
import { createClient } from '@/lib/supabase/server';

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const role = await getCurrentUserRole();
  const { settings } = await getStoreSettings();
  const headerContent = await getSiteContent('header', defaultHeaderContent);
  const footerContent = await getSiteContent('footer', defaultFooterContent);

  const supabase = await createClient();
  const [{ data: occasions }, customizationCategories] = await Promise.all([
    supabase
      .from('occasions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    getPublicCustomizations()
  ]);

  return (
    <HamperBuilderProvider customizationCategories={customizationCategories}>
      <div className="flex min-h-screen flex-col font-sans selection:bg-rose-200">
        {settings?.store_announcement && (
          <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm font-medium tracking-wide">
            {settings.store_announcement}
          </div>
        )}
        <Navbar user={user} role={role} content={headerContent} occasions={occasions || []} />
        <main className="flex-1 bg-slate-50">{children}</main>
        <Footer content={footerContent} />
        <CartSlideover user={user} />
        <ChatWidget />
      </div>
    </HamperBuilderProvider>
  );
}
