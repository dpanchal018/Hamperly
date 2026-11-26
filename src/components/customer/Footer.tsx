import { PolicyButton, SectionLink, StudioButton } from '@/components/customer/SectionLink';
import { Mail, Phone } from 'lucide-react';
import { FooterContent } from '@/types/database.types';
import { InstagramIcon, WhatsAppIcon } from '@/components/customer/SocialIcons';

function socialHref(url: string) {
  return url.startsWith('http') ? url : `https://${url}`;
}

export function Footer({ content, whatsAppNumber }: { content: FooterContent; whatsAppNumber?: string }) {
  const instagram = content.socialLinks.find(l => /^(ig|insta)/i.test(l.platform) && l.url && l.url !== '#');
  const otherSocials = content.socialLinks.filter(l => l !== instagram && l.url && l.url !== '#');

  return (
    <footer id="contact" className="scroll-mt-28 bg-plum-deep text-[#e8cbd6] pt-16 pb-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-plum-soft">
          <div>
            <div className="font-script text-5xl text-[#f2a7bd] leading-none">{content.logoText}</div>
            <p className="leading-relaxed mt-4 mb-6 max-w-xs text-sm">{content.description}</p>
            <div className="flex flex-col gap-3">
              {instagram && (
                <a href={socialHref(instagram.url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors">
                  <span className="w-11 h-11 rounded-2xl bg-plum grid place-items-center"><InstagramIcon className="w-5 h-5 text-[#f2a7bd]" /></span>
                  Instagram · DM us your idea
                </a>
              )}
              {whatsAppNumber && (
                <a href={`https://wa.me/${whatsAppNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors">
                  <span className="w-11 h-11 rounded-2xl bg-plum grid place-items-center"><WhatsAppIcon className="w-5 h-5 text-[#f2a7bd]" /></span>
                  WhatsApp · chat with us
                </a>
              )}
              {otherSocials.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {otherSocials.map((link, i) => (
                    <a key={i} href={socialHref(link.url)} target="_blank" rel="noopener noreferrer" className="h-10 px-3 rounded-full bg-plum grid place-items-center text-xs font-bold text-[#f2a7bd] hover:bg-plum-soft transition-colors">
                      {link.platform}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {content.columns.map((col, i) => (
            <div key={i}>
              <h2 className="font-bold text-white mb-5 text-base">{col.title}</h2>
              <ul className="space-y-3 text-sm">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <SectionLink href={link.href} className="hover:text-white transition-colors text-left">{link.name}</SectionLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="font-bold text-white mb-5 text-base">Say hello</h2>
            <ul className="space-y-3 text-sm">
              {content.contactEmail && (
                <li>
                  <a href={`mailto:${content.contactEmail}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Mail className="w-4 h-4 shrink-0 text-[#f2a7bd]" />
                    {content.contactEmail}
                  </a>
                </li>
              )}
              {content.contactPhone && (
                <li>
                  <a href={`tel:${content.contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Phone className="w-4 h-4 shrink-0 text-[#f2a7bd]" />
                    {content.contactPhone}
                  </a>
                </li>
              )}
              <li className="pt-2">
                <StudioButton className="inline-flex items-center h-11 px-5 rounded-full bg-[#f2a7bd] text-plum-deep font-bold hover:bg-white transition-colors">
                  Build a hamper
                </StudioButton>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row gap-3 justify-between text-sm text-[#b892a6]">
          <p>Hand-packed with love in Vadodara, Gujarat</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <PolicyButton className="hover:text-white transition-colors">Cancellation &amp; Return Policy</PolicyButton>
            <span>&copy; {new Date().getFullYear()} Hamperly</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
