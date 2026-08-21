import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { getStoreSettings } from '@/actions/settings.actions';
import { Mail, Phone } from 'lucide-react';

export async function Footer() {
  const { settings } = await getStoreSettings();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Logo className="scale-75 origin-left" />
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Curating personalized gifting experiences for every occasion.
            </p>
            {(settings?.support_email || settings?.support_phone) && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Contact Us</h3>
                {settings.support_email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 mr-3" />
                    <a href={`mailto:${settings.support_email}`} className="hover:text-primary transition-colors">
                      {settings.support_email}
                    </a>
                  </div>
                )}
                {settings.support_phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 mr-3" />
                    <a href={`tel:${settings.support_phone}`} className="hover:text-primary transition-colors">
                      {settings.support_phone}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/occasions" className="hover:text-primary transition-colors">All Occasions</Link></li>
              <li><Link href="/hampers" className="hover:text-primary transition-colors">Curated Hampers</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">All Products</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">About</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-not-allowed hover:text-foreground transition-colors">Our Story</span></li>
              <li><span className="cursor-not-allowed hover:text-foreground transition-colors">How it Works</span></li>
              <li><span className="cursor-not-allowed hover:text-foreground transition-colors">FAQ</span></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-not-allowed hover:text-foreground transition-colors">Privacy Policy</span></li>
              <li><span className="cursor-not-allowed hover:text-foreground transition-colors">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {settings?.store_name || 'Hamperly'}. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link href="/admin" className="hover:text-foreground transition-colors">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
