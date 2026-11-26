import { Suspense } from 'react';
import { getPublicOccasions, getPublicProducts, getPublicCategories } from '@/services/catalog.service';
import { getPublicHampers } from '@/actions/hamper.actions';
import { getFeaturedReviews } from '@/actions/review.actions';
import { getPublicCustomizations } from '@/actions/customization.actions';
import { getPublicEvents } from '@/actions/event.actions';
import { getMuseumExhibits } from '@/services/museum.service';
import { FadeInScroll } from '@/components/ui/AnimatedWrapper';
import { HeroHamper } from '@/components/customer/home/HeroHamper';
import { GiftFinder } from '@/components/customer/home/GiftFinder';
import type { RecentOrder } from '@/components/customer/home/RecentOrdersTicker';
import { HamperOpenButton, JumpButton, OccasionFilterButton } from '@/components/customer/home/InPage';
import { MuseumSection } from '@/components/customer/home/MuseumSection';
import { HampersCatalog } from '@/components/customer/HampersCatalog';
import { HamperStudio } from '@/components/customer/builder/HamperStudio';
import { InstagramIcon } from '@/components/customer/SocialIcons';
import { WelcomePopup } from '@/components/customer/WelcomePopup';
import { CurtainIntro } from '@/components/customer/CurtainIntro';
import { getSiteContent, defaultFooterContent } from '@/services/content.service';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { ArrowRight, Mail, Star, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

const OCCASION_TINTS = [
  { bg: '#F6D9E1', fg: '#3A1230' },
  { bg: '#C99A3E', fg: '#2A0E23' },
  { bg: '#DDE8F7', fg: '#1F2F55' },
  { bg: '#3A1230', fg: '#FBF1F3' },
  { bg: '#FFFFFF', fg: '#3A1230' },
  { bg: '#F1F6E6', fg: '#2F3F1A' },
];

const STORY_TINTS = ['#F2B8C8', '#E8C27A', '#C9B6E4', '#B9D47A'];

const STEPS = [
  { title: 'Pick or build', body: 'Choose a ready hamper or build your own live, card included.', bg: 'bg-rose' },
  { title: 'Confirm your order', body: 'Add contact and delivery details. You get your Order ID instantly.', bg: 'bg-rose-deep' },
  { title: 'Pay on WhatsApp', body: 'Send us the Order ID and we share a payment QR. No extra fees.', bg: 'bg-[#1E9E55]' },
  { title: 'Packed & delivered', body: 'Hand-packed in Vadodara and shipped to any city in India.', bg: 'bg-plum' },
];

// Latest website orders for the hero ticker: item names and timestamps only, no customer data
async function getRecentOrders(): Promise<RecentOrder[]> {
  const admin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await admin
    .from('purchases')
    .select('created_at, purchase_items(product_name_snapshot, category_snapshot)')
    .eq('sale_source', 'WEBSITE')
    .neq('status', 'CANCELLED')
    .order('created_at', { ascending: false })
    .limit(6);

  type Row = { created_at: string; purchase_items: { product_name_snapshot: string; category_snapshot: string | null }[] | null };
  return ((data || []) as Row[]).flatMap(p => {
    const items = p.purchase_items || [];
    const premade = items.find(i => i.category_snapshot === 'Pre-made Hamper');
    const custom = items.some(i => i.product_name_snapshot.startsWith('['));
    const label = premade ? `the ${premade.product_name_snapshot}` : custom ? 'a hamper they built themselves' : items[0] ? `the ${items[0].product_name_snapshot}` : null;
    return label ? [{ label, createdAt: p.created_at }] : [];
  });
}

function SectionHeading({ eyebrow, title, italic, children }: { eyebrow: string; title: string; italic?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div>
        <div className="text-[13px] font-bold tracking-[0.12em] text-rose">{eyebrow}</div>
        <h2 className="font-serif font-semibold text-plum text-4xl sm:text-5xl tracking-[-0.02em] mt-2">
          {title}{italic && <> <span className="italic">{italic}</span></>}
        </h2>
      </div>
      {children}
    </div>
  );
}

/** The whole storefront: every section lives on this one page. */
export default async function HomePage() {
  const supabase = await createClient();
  const [
    occasions, featuredReviews, allHampers, recentOrders, footer, products, categories, customizations, events, exhibits,
    { data: recipientTags }, { data: genders }, { data: allOccasions },
  ] = await Promise.all([
    getPublicOccasions(),
    getFeaturedReviews(),
    getPublicHampers(),
    getRecentOrders(),
    getSiteContent('footer', defaultFooterContent),
    getPublicProducts(),
    getPublicCategories(),
    getPublicCustomizations(),
    getPublicEvents(),
    getMuseumExhibits(),
    supabase.from('recipient_tags').select('id, name').order('name'),
    supabase.from('genders').select('*').order('name'),
    supabase.from('occasions').select('*').eq('is_active', true).order('display_order'),
  ]);

  // Best sellers: completed sales per pre-made hamper name
  const { data: completedPurchases } = await supabase.from('purchases').select('id').eq('status', 'COMPLETED');
  const completedIds = new Set(completedPurchases?.map(p => p.id) || []);
  const { data: items } = await supabase.from('purchase_items').select('purchase_id, product_name_snapshot, quantity').is('product_id', null);
  const salesCount: Record<string, number> = {};
  (items || []).forEach(item => {
    if (completedIds.has(item.purchase_id)) {
      salesCount[item.product_name_snapshot] = (salesCount[item.product_name_snapshot] || 0) + (item.quantity || 1);
    }
  });

  const [leadOccasion, ...otherOccasions] = occasions.slice(0, 6);
  const stories = featuredReviews.filter(r => r.comment && r.comment.trim().length > 0).slice(0, 4);
  const instagram = footer.socialLinks.find(l => /^(ig|insta)/i.test(l.platform) && l.url && l.url !== '#');
  const instagramHref = instagram ? (instagram.url.startsWith('http') ? instagram.url : `https://${instagram.url}`) : null;

  return (
    <div className="bg-blush overflow-x-clip">
      <CurtainIntro />
      <WelcomePopup occasions={occasions.map(o => ({ id: o.id, name: o.name, slug: o.slug }))} />

      {/* Phone: Instagram-style occasion circles */}
      {occasions.length > 0 && (
        <nav aria-label="Occasions" className="md:hidden flex gap-3.5 overflow-x-auto px-4 pt-5 pb-1 [scrollbar-width:none]">
          {occasions.slice(0, 8).map((o, i) => (
            <OccasionFilterButton key={o.id} occasionId={o.id} className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] text-xs font-semibold text-ink">
              <span className="w-16 h-16 rounded-full p-[3px] bg-[conic-gradient(#B83D72,#C99A3E,#F2A7BD,#B83D72)]">
                <span
                  className="block w-full h-full rounded-full border-[3px] border-blush bg-cover bg-center"
                  style={o.image_url ? { backgroundImage: `url(${o.image_url})` } : { background: OCCASION_TINTS[i % OCCASION_TINTS.length].bg }}
                />
              </span>
              <span className="w-full truncate text-center">{o.name.replace(/ hampers?$/i, '')}</span>
            </OccasionFilterButton>
          ))}
        </nav>
      )}

      {/* Hero */}
      <section id="top" className="scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-8 pt-10 sm:pt-14 pb-16 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <FadeInScroll>
          <JumpButton to="museum" className="inline-flex items-center gap-2.5 bg-white border border-petal-line rounded-full pl-1.5 pr-3.5 py-1.5 text-sm font-semibold text-plum hover:border-rose transition-colors">
            <span className="bg-rose text-white rounded-full px-2.5 py-1 text-xs tracking-wider">NEW</span>
            Take the museum tour
            <ArrowRight className="w-4 h-4" />
          </JumpButton>
          <h1 className="font-serif font-semibold text-plum text-[clamp(44px,6vw,84px)] leading-[0.98] tracking-[-0.03em] mt-6 mb-5">
            Gifts that feel<br />like a <span className="italic text-rose">warm hug.</span>
          </h1>
          <p className="text-lg sm:text-[19px] leading-relaxed text-[#5E4453] max-w-xl mb-8">
            Hand-packed hampers for birthdays, weddings, festivals and the people who matter at work. Build one live, write the card, and we deliver it anywhere in India.
          </p>
          <div className="flex flex-wrap gap-3">
            <JumpButton to="studio" className="inline-flex items-center gap-2.5 h-14 px-7 rounded-full bg-rose text-white font-bold shadow-[0_14px_30px_-12px_rgba(184,61,114,.7)] hover:bg-rose-deep transition-colors">
              Build a hamper live <ArrowRight className="w-[18px] h-[18px]" />
            </JumpButton>
            <JumpButton to="shop" className="inline-flex items-center h-14 px-6 rounded-full bg-white text-plum font-bold border-[1.5px] border-[#E5C2CF] hover:border-plum transition-colors">
              Shop ready hampers
            </JumpButton>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-3 mt-10 text-sm font-semibold text-[#5E4453]">
            <span className="flex items-center gap-2"><Mail className="w-5 h-5 text-rose" />Free message card</span>
            <span className="flex items-center gap-2"><Truck className="w-5 h-5 text-rose" />Pan-India delivery</span>
            <span className="flex items-center gap-2"><Star className="w-5 h-5 text-rose" />Hand-packed in Vadodara</span>
          </div>
        </FadeInScroll>
        <HeroHamper recentOrders={recentOrders} />
      </section>

      {/* Gift finder */}
      <section id="finder" className="scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-8 pb-20">
        <GiftFinder recipients={recipientTags || []} hampers={allHampers} />
      </section>

      {/* Occasions */}
      {leadOccasion && (
        <section id="occasions" className="scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-8 pb-24">
          <SectionHeading eyebrow="SHOP BY OCCASION" title="Every moment," italic="wrapped." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[200px] sm:auto-rows-[220px] gap-5">
            <OccasionFilterButton
              occasionId={leadOccasion.id}
              className="hp-lift text-left sm:row-span-2 rounded-[28px] bg-rose text-white p-8 flex flex-col justify-between relative overflow-hidden"
              style={leadOccasion.image_url ? { backgroundImage: `linear-gradient(to top, rgba(58,18,48,.75), rgba(58,18,48,.05)), url(${leadOccasion.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              {!leadOccasion.image_url && (
                <svg viewBox="0 0 200 200" className="absolute -right-8 -bottom-5 w-64 h-64 opacity-90" aria-hidden="true">
                  <rect x="40" y="90" width="120" height="90" rx="6" fill="#F2B8C8" stroke="#3A1230" strokeWidth="4" />
                  <rect x="30" y="70" width="140" height="28" rx="6" fill="#E28AA8" stroke="#3A1230" strokeWidth="4" />
                  <rect x="92" y="70" width="16" height="110" fill="#3A1230" />
                  <path d="M100 70c-22-30-48-10-30 4 8 6 22 0 30-4zM100 70c22-30 48-10 30 4-8 6-22 0-30-4z" fill="#FFF" stroke="#3A1230" strokeWidth="4" />
                </svg>
              )}
              <span className="relative text-[13px] font-bold tracking-[0.12em] opacity-85">MOST GIFTED</span>
              <span className="relative">
                <span className="block font-serif text-4xl sm:text-[44px] font-semibold">{leadOccasion.name}</span>
                <span className="font-semibold">Shop {leadOccasion.name.toLowerCase()} →</span>
              </span>
            </OccasionFilterButton>
            {otherOccasions.map((o, i) => {
              const tint = OCCASION_TINTS[i % OCCASION_TINTS.length];
              return (
                <OccasionFilterButton
                  key={o.id}
                  occasionId={o.id}
                  className={`hp-lift text-left rounded-[28px] p-6 flex flex-col justify-between ${tint.bg === '#FFFFFF' ? 'border border-petal-line' : ''}`}
                  style={o.image_url
                    ? { backgroundImage: `linear-gradient(to top, rgba(42,14,35,.8), rgba(42,14,35,.1)), url(${o.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', color: '#FFFFFF' }
                    : { background: tint.bg, color: tint.fg }}
                >
                  <span className="text-[13px] font-bold tracking-[0.12em] opacity-80 line-clamp-1">{(o.description || 'Curated hampers').toUpperCase()}</span>
                  <span>
                    <span className="block font-serif text-3xl font-semibold">{o.name}</span>
                    <span className="font-semibold text-[15px]">Explore →</span>
                  </span>
                </OccasionFilterButton>
              );
            })}
          </div>
        </section>
      )}

      {/* Shop */}
      <section id="shop" className="scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-8 pb-24">
        <SectionHeading eyebrow="READY TO GIFT" title="The shop." />
        <HampersCatalog
          initialHampers={allHampers}
          genders={genders || []}
          recipientTags={recipientTags || []}
          occasions={allOccasions || []}
          events={events.map(e => ({ id: e.id, name: e.name }))}
          salesCount={salesCount}
        />
      </section>

      {/* Hamper studio (the full builder, in-page) */}
      <section id="studio" className="scroll-mt-24 bg-white/60 border-y border-petal-line py-16">
        <Suspense fallback={<div className="max-w-7xl mx-auto px-8 h-96 rounded-[32px] bg-petal animate-pulse" />}>
          <HamperStudio
            occasions={occasions}
            products={products}
            categories={categories}
            customizationCategories={customizations}
            events={events}
          />
        </Suspense>
      </section>

      {/* Museum: virtual tour of the ready-made hampers */}
      {exhibits.length > 0 && (
        <section id="museum" className="scroll-mt-24 bg-plum-deep text-blush px-4 sm:px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="text-[13px] font-bold tracking-[0.12em] text-[#F2A7BD]">VIRTUAL TOUR</div>
              <h2 className="font-serif font-semibold text-4xl sm:text-5xl tracking-[-0.02em] mt-2">The Hamperly <span className="italic text-[#F2A7BD]">Museum.</span></h2>
              <p className="mt-3 text-[#E8CBD6] max-w-2xl leading-relaxed">
                Walk through our gallery of ready-made hampers. Step from exhibit to exhibit, spin them on their plinths, peek at what&apos;s inside and read what people said.
              </p>
            </div>
            <MuseumSection exhibits={exhibits} />
          </div>
        </section>
      )}

      {/* Stories (real customer reviews) */}
      {(stories.length > 0 || instagramHref) && (
        <section id="stories" className="scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-8 py-24">
          <SectionHeading eyebrow="STORIES" title="Hampers with a story.">
            {instagramHref && (
              <a href={instagramHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 h-12 px-5 rounded-full border-[1.5px] border-[#E5C2CF] bg-white text-plum font-bold hover:border-plum transition-colors">
                <InstagramIcon className="w-5 h-5 text-rose" /> Follow us on Instagram
              </a>
            )}
          </SectionHeading>
          {stories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {stories.map((r, i) => (
                <HamperOpenButton key={r.id} hamperId={r.hamper_id} className="hp-lift text-left rounded-3xl p-6 flex flex-col justify-between min-h-[300px]" style={{ background: STORY_TINTS[i % STORY_TINTS.length] }}>
                  <span className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className={`w-4 h-4 ${s < r.rating ? 'fill-plum text-plum' : 'text-plum/30'}`} />
                    ))}
                  </span>
                  <span className="block font-serif text-xl leading-snug text-plum my-6">&ldquo;{r.comment}&rdquo;</span>
                  <span className="block rounded-2xl bg-plum/85 text-white px-4 py-3 text-sm font-semibold">
                    {r.reviewer_name}
                    <span className="block font-medium text-xs text-[#F2A7BD] mt-0.5">{r.hamper?.name}</span>
                  </span>
                </HamperOpenButton>
              ))}
            </div>
          )}
        </section>
      )}

      {/* How it works */}
      <section id="how" className="scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-8 pb-24">
        <div className="bg-white border border-petal-line rounded-[36px] p-8 sm:p-12">
          <div className="text-[13px] font-bold tracking-[0.12em] text-rose">HOW IT WORKS</div>
          <h2 className="font-serif font-semibold text-plum text-4xl sm:text-[44px] tracking-[-0.02em] mt-2 mb-9">From your bag to their door.</h2>
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <svg className="hidden lg:block absolute left-0 top-[30px] w-full h-1" aria-hidden="true"><line x1="4%" y1="2" x2="96%" y2="2" stroke="#E5C2CF" strokeWidth="3" className="hp-dash" /></svg>
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <div className={`w-[60px] h-[60px] rounded-[20px] ${s.bg} text-white grid place-items-center font-serif text-2xl font-semibold mb-4`}>{i + 1}</div>
                <h3 className="text-lg font-bold text-plum mb-1.5">{s.title}</h3>
                <p className="text-[#5E4453] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
