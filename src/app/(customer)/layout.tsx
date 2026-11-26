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
import { getWhatsAppNumber } from '@/lib/whatsapp';
import { AnnouncementBar } from '@/components/customer/AnnouncementBar';
import { WhatsAppFloat } from '@/components/customer/WhatsAppFloat';
import { StoreToaster } from '@/components/customer/StoreToaster';
import { SavedHamperReminder } from '@/components/customer/SavedHamperReminder';
import { MobileTabBar } from '@/components/customer/MobileTabBar';
import { StorefrontProvider } from '@/contexts/StorefrontContext';
import { StorefrontOverlays } from '@/components/customer/overlays/StorefrontOverlays';
import { PolicyContent } from '@/components/customer/PolicyContent';
import { getPublicHampers } from '@/actions/hamper.actions';
import { getPublicEvents } from '@/actions/event.actions';

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
  const [{ data: occasions }, customizationCategories, whatsAppNumber, hampers, events, customerResult] = await Promise.all([
    supabase
      .from('occasions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    getPublicCustomizations(),
    getWhatsAppNumber(),
    getPublicHampers(),
    getPublicEvents(),
    // Saved contact + address for the in-page checkout
    user && role === 'CUSTOMER'
      ? supabase.from('customers').select('*').eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const customer = customerResult.data;

  return (
    <HamperBuilderProvider customizationCategories={customizationCategories}>
      <StorefrontProvider
        occasions={(occasions || []).map(o => ({ id: o.id, slug: o.slug }))}
        events={events.map(e => ({ id: e.id, slug: e.slug }))}
      >
      <div className="flex min-h-screen flex-col font-sans selection:bg-petal">
        <div className="print:hidden">
          <AnnouncementBar announcement={settings?.store_announcement} />
        </div>
        <div className="print:hidden sticky top-0 z-50">
          <Navbar user={user} role={role} content={headerContent} occasions={occasions || []} />
        </div>
        <main className="flex-1 bg-blush">{children}</main>
        <div className="print:hidden">
          <Footer content={footerContent} whatsAppNumber={whatsAppNumber} />
          {/* Room for the phone tab bar so it never covers the footer */}
          <div className="h-24 bg-plum-deep md:hidden" aria-hidden="true" />
          <CartSlideover user={user} />
          <WhatsAppFloat number={whatsAppNumber} />
          <ChatWidget />
          <StoreToaster />
          <SavedHamperReminder />
          <MobileTabBar />
          <StorefrontOverlays
            customer={customer}
            isLoggedIn={!!user}
            hampers={hampers}
            whatsAppNumber={whatsAppNumber}
            policy={<PolicyContent />}
          />
        </div>
      </div>
      </StorefrontProvider>
    </HamperBuilderProvider>
  );
}
