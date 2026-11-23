'use client';

import { useStorefront, type SectionId } from '@/contexts/StorefrontContext';

// Small client wrappers so the (server-rendered) home sections can drive the single page.

export function JumpButton({ to, children, className, ariaLabel }: { to: SectionId; children: React.ReactNode; className?: string; ariaLabel?: string }) {
  const { goTo } = useStorefront();
  return <button type="button" onClick={() => goTo(to)} className={className} aria-label={ariaLabel}>{children}</button>;
}

export function StudioLaunch({ children, className }: { children: React.ReactNode; className?: string }) {
  const { openStudio } = useStorefront();
  return <button type="button" onClick={() => openStudio()} className={className}>{children}</button>;
}

/** Filters the shop by an occasion and scrolls to it */
export function OccasionFilterButton({ occasionId, children, className, style }: { occasionId: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const { setShopFilter } = useStorefront();
  return (
    <button type="button" onClick={() => setShopFilter({ occasion: occasionId }, { replace: true, scroll: true })} className={className} style={style}>
      {children}
    </button>
  );
}

/** Opens a hamper's details overlay */
export function HamperOpenButton({ hamperId, children, className, style }: { hamperId: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const { openHamper } = useStorefront();
  return <button type="button" onClick={() => openHamper(hamperId)} className={className} style={style}>{children}</button>;
}
