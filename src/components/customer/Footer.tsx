import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-primary/10 pt-16 pb-8 relative overflow-hidden">
      
      {/* Soft decorative background */}
      <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
             <div className="bg-white border border-primary/20 shadow-sm shadow-primary/5 rounded-full px-6 py-2 inline-block mb-6">
                <h2 className="text-3xl font-script text-primary leading-none pt-1">Hamperly</h2>
             </div>
            <p className="text-foreground/70 font-light text-sm mb-6 max-w-sm">
              Curating beautiful, personalized gifts for every special moment. Handcrafted with love and delivered with care.
            </p>
            <div className="flex space-x-4 text-primary font-bold text-sm">
              <a href="#" className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors">IG</a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors">FB</a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors">X</a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-foreground mb-6">Shop</h4>
            <ul className="space-y-4 text-sm text-foreground/70">
              <li><Link href="/products" className="hover:text-primary transition-colors">Build a Hamper</Link></li>
              <li><Link href="/hampers" className="hover:text-primary transition-colors">Pre-made Hampers</Link></li>
              <li><Link href="/occasions" className="hover:text-primary transition-colors">Shop by Occasion</Link></li>
              <li><Link href="/exhibitions" className="hover:text-primary transition-colors">Exhibitions</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-foreground mb-6">Information</h4>
            <ul className="space-y-4 text-sm text-foreground/70">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/shipping" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
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
          <p className="mt-4 md:mt-0">&copy; {new Date().getFullYear()} Hamperly. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
