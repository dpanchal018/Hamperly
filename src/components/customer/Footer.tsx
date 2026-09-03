import Link from 'next/link';
import { Heart, Mail, Phone } from 'lucide-react';
import { FooterContent } from '@/types/database.types';

export function Footer({ content }: { content: FooterContent }) {
  return (
    <footer className="bg-white border-t border-primary/10 pt-16 pb-8 relative overflow-hidden">
      
      {/* Soft decorative background */}
      <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
             <div className="bg-white border border-primary/20 shadow-sm shadow-primary/5 rounded-full px-6 py-2 inline-block mb-6">
                <h2 className="text-3xl font-script text-primary leading-none pt-1">{content.logoText}</h2>
             </div>
            <p className="text-foreground/70 font-light text-sm mb-6 max-w-sm">
              {content.description}
            </p>
            <div className="flex flex-wrap gap-4 text-primary font-bold text-sm">
              {content.socialLinks.map((link, i) => {
                const isPlaceholder = link.url === '#' || !link.url;
                const href = isPlaceholder ? '#' : (link.url.startsWith('http') ? link.url : `https://${link.url}`);
                return (
                  <a 
                    key={i} 
                    href={href} 
                    target={isPlaceholder ? undefined : "_blank"} 
                    rel={isPlaceholder ? undefined : "noopener noreferrer"}
                    className="w-10 h-10 shrink-0 rounded-full bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors"
                  >
                    {link.platform}
                  </a>
                );
              })}
            </div>
          </div>
          
          {content.columns.map((col, i) => (
            <div key={i}>
              <h4 className="font-bold text-foreground mb-6">{col.title}</h4>
              <ul className="space-y-4 text-sm text-foreground/70">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <Link href={link.href} className="hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Us — merged with support email & phone */}
          <div>
            <h4 className="font-bold text-foreground mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-foreground/70">
              {content.contactEmail && (
                <li>
                  <a
                    href={`mailto:${content.contactEmail}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4 shrink-0 text-primary/50" />
                    {content.contactEmail}
                  </a>
                </li>
              )}
              {content.contactPhone && (
                <li>
                  <a
                    href={`tel:${content.contactPhone.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4 shrink-0 text-primary/50" />
                    {content.contactPhone}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-6">Newsletter</h4>
            <p className="text-sm text-foreground/70 mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white border border-primary/20 rounded-full px-4 py-2 text-sm flex-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <button 
                type="submit"
                className="bg-primary text-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center text-sm text-foreground/60">
          <p className="flex items-center">
            Made with <Heart className="w-4 h-4 mx-1 text-primary" fill="currentColor" /> by Hamperly
          </p>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <Link href="/policies/cancellation-return" className="hover:text-primary transition-colors">Cancellation & Return Policy</Link>
            <span>&copy; {new Date().getFullYear()} Hamperly. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
