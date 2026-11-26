'use client';

import { sectionForHref, useStorefront } from '@/contexts/StorefrontContext';

/**
 * Admin-managed links (header/footer content) still point at the old page URLs; on the
 * single page they scroll to the matching section. Unknown internal links render as plain text
 * so nothing navigates away; external links open in a new tab.
 */
export function SectionLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const { goTo, setPolicyOpen } = useStorefront();
  if (/^https?:\/\//.test(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
  }
  if (href.startsWith('/policies')) {
    return <button type="button" onClick={() => setPolicyOpen(true)} className={className}>{children}</button>;
  }
  const section = sectionForHref(href);
  if (!section) return <span className={className}>{children}</span>;
  return <button type="button" onClick={() => goTo(section)} className={className}>{children}</button>;
}

export function StudioButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { openStudio } = useStorefront();
  return <button type="button" onClick={() => openStudio()} className={className}>{children}</button>;
}

export function PolicyButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { setPolicyOpen } = useStorefront();
  return <button type="button" onClick={() => setPolicyOpen(true)} className={className}>{children}</button>;
}
