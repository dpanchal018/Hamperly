import Link from 'next/link';
import { Gift } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <Gift className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-slate-900">Hamperly</span>
            </Link>
            <p className="text-sm text-slate-500 mb-4">
              Curating personalized gifting experiences for every occasion.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/occasions" className="hover:text-rose-600 transition-colors">All Occasions</Link></li>
              <li><Link href="/products" className="hover:text-rose-600 transition-colors">All Products</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">About</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><span className="cursor-not-allowed">Our Story</span></li>
              <li><span className="cursor-not-allowed">How it Works</span></li>
              <li><span className="cursor-not-allowed">FAQ</span></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><span className="cursor-not-allowed">Privacy Policy</span></li>
              <li><span className="cursor-not-allowed">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-100 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-400">
          <p>© {new Date().getFullYear()} Hamperly. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link href="/admin" className="hover:text-slate-600">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
