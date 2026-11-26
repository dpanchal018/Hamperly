// Scrolling ribbon of store promises above the menu. The list is duplicated so the
// CSS marquee (translateX -50%) loops seamlessly.
export function AnnouncementBar({ announcement }: { announcement?: string | null }) {
  const items = [
    ...(announcement ? [announcement] : []),
    'Free handwritten card in every hamper',
    'Hand-packed in our Vadodara studio',
    'Ships across India',
    'Bulk & corporate orders welcome',
    'Order on WhatsApp in one tap',
  ];
  return (
    <div className="bg-plum text-petal text-[13px] font-semibold tracking-wide h-10 flex items-center overflow-hidden" role="region" aria-label="Store announcements">
      <div className="hp-marquee flex gap-12 w-max" aria-hidden="true">
        {[...items, ...items].map((text, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap">
            {text}
            <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
      <span className="sr-only">{items.join('. ')}</span>
    </div>
  );
}
