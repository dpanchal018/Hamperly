import { getFullUserWishlist } from '@/actions/wishlist.actions';
import { getCurrentUser } from '@/services/auth.service';
import { redirect } from 'next/navigation';
import { HamperCard } from '@/components/customer/HamperCard';
import { ProductCard } from '@/components/customer/ProductCard';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'My Wishlist | Hamperly' };

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { hampers, products } = await getFullUserWishlist(user.id);
  const totalItems = hampers.length + products.length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-slate-900">My Wishlist</h2>
          <p className="text-slate-500 mt-1">Items you've saved for later.</p>
        </div>
        <div className="flex items-center space-x-2 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full font-medium text-sm">
          <Heart className="w-4 h-4 fill-rose-600" />
          <span>{totalItems} items</span>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <Heart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Your wishlist is empty</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">Explore our collection of hampers and products to find the perfect gifts to save for later.</p>
          <div className="flex justify-center space-x-4">
            <Link href="/hampers">
              <Button className="rounded-full">Shop Hampers</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="rounded-full">Shop Products</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {hampers.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center border-b pb-2">
                Hampers <span className="ml-2 text-slate-400 font-normal text-sm">({hampers.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hampers.map(h => <HamperCard key={h.id} hamper={h} />)}
              </div>
            </div>
          )}

          {products.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center border-b pb-2">
                Products <span className="ml-2 text-slate-400 font-normal text-sm">({products.length})</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(p => <ProductCard key={p.id} product={p as any} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
