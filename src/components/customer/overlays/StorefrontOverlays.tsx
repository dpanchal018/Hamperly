'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { Bell, CheckCircle2, Heart, LogOut, Package, Printer, User, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useStorefront, type AccountTab } from '@/contexts/StorefrontContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { CheckoutForm } from '@/components/customer/CheckoutForm';
import { HamperCard } from '@/components/customer/HamperCard';
import { ProfileForm } from '@/components/customer/ProfileForm';
import { CancelOrderButton } from '@/components/customer/CancelOrderButton';
import { ConfettiBurst } from '@/components/customer/ConfettiBurst';
import { WhatsAppIcon } from '@/components/customer/SocialIcons';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { HamperQuickView } from './HamperQuickView';
import { signInInline, signOutInline, signUpInline } from '@/actions/auth.actions';
import { MINIMUM_AGE, todayInIndia } from '@/lib/age';
import { getMyProfile, getMyPurchases } from '@/actions/account.actions';
import { getMyNotifications, markAllNotificationsAsRead } from '@/actions/notification.actions';
import type { PublicHamper } from '@/types/database.types';

interface OverlaysProps {
  customer: { full_name?: string | null; mobile_number?: string | null } | null;
  isLoggedIn: boolean;
  hampers: PublicHamper[];
  whatsAppNumber: string;
  policy: React.ReactNode;
}

/** Every overlay of the single-page storefront, mounted once in the customer layout. */
export function StorefrontOverlays({ customer, isLoggedIn, hampers, whatsAppNumber, policy }: OverlaysProps) {
  return (
    <>
      <HamperQuickView hampers={hampers} whatsAppNumber={whatsAppNumber} />
      <CheckoutSheet customer={customer} isLoggedIn={isLoggedIn} />
      <OrderPlacedDialog whatsAppNumber={whatsAppNumber} />
      <AuthDialog />
      <AccountSheet isLoggedIn={isLoggedIn} hampers={hampers} />
      <PolicyDialog>{policy}</PolicyDialog>
    </>
  );
}

const sheetClass = 'w-full max-w-[calc(100%-1rem)] max-h-[94vh] overflow-y-auto p-0 rounded-[32px] bg-blush ring-0 gap-0';

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Close" className="w-11 h-11 rounded-full bg-white shadow grid place-items-center text-plum hover:bg-petal shrink-0">
      <X className="w-5 h-5" />
    </button>
  );
}

/* ------------------------------------------------------------------ checkout */

function CheckoutSheet({ customer, isLoggedIn }: { customer: OverlaysProps['customer']; isLoggedIn: boolean }) {
  const { checkoutOpen, closeCheckout, showPlacedOrder, goTo, openAuth } = useStorefront();
  return (
    <Dialog open={checkoutOpen} onOpenChange={open => { if (!open) closeCheckout(); }}>
      <DialogContent showCloseButton={false} className={`sm:max-w-6xl ${sheetClass}`}>
        <div className="sticky top-0 z-20 bg-blush/90 backdrop-blur px-5 sm:px-10 py-4 flex items-center justify-between gap-4 border-b border-petal-line">
          <div>
            <DialogTitle className="font-serif font-semibold text-plum text-3xl sm:text-4xl tracking-[-0.02em]">Checkout</DialogTitle>
            <DialogDescription className="text-ink-muted text-sm">Contact, delivery, then confirm. You&apos;ll pay on WhatsApp after.</DialogDescription>
          </div>
          <CloseButton onClick={closeCheckout} />
        </div>
        <div className="px-4 sm:px-10 py-8">
          {!isLoggedIn && (
            <p className="mb-6 text-sm text-ink-muted">
              Have an account?{' '}
              <button type="button" onClick={() => { closeCheckout(); openAuth('login', 'checkout'); }} className="font-bold text-rose hover:text-rose-deep">Sign in</button>{' '}
              to use your saved address, or continue as a guest below.
            </p>
          )}
          <CheckoutForm
            customer={customer}
            onPlaced={order => {
              closeCheckout();
              showPlacedOrder({ id: order.id, ref: order.id.split('-')[0].toUpperCase(), total: order.total });
            }}
            onBrowse={() => goTo('shop')}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderPlacedDialog({ whatsAppNumber }: { whatsAppNumber: string }) {
  const { placedOrder, showPlacedOrder, goTo } = useStorefront();
  const text = placedOrder
    ? encodeURIComponent(`Hi Hamperly! I've placed order #${placedOrder.ref} for ₹${placedOrder.total.toLocaleString('en-IN')}. Please send me the payment QR.`)
    : '';
  return (
    <Dialog open={!!placedOrder} onOpenChange={open => { if (!open) showPlacedOrder(null); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg w-full max-w-[calc(100%-1rem)] p-0 rounded-[32px] bg-white ring-0 overflow-hidden gap-0">
        {placedOrder && (
          <div className="relative px-6 sm:px-10 pt-10 pb-8 text-center">
            <ConfettiBurst />
            <div className="relative w-16 h-16 bg-[#E7F6EC] rounded-full grid place-items-center mx-auto mb-4 ring-8 ring-[#F2FBF6]">
              <CheckCircle2 className="w-8 h-8 text-[#1F6B3E]" />
            </div>
            <DialogTitle className="relative font-serif font-semibold text-plum text-3xl sm:text-4xl tracking-[-0.02em]">Order #{placedOrder.ref} is in!</DialogTitle>
            <DialogDescription className="relative mt-2 text-[#5E4453] leading-relaxed">
              Total ₹{placedOrder.total.toLocaleString('en-IN')}. Send us your Order ID on WhatsApp and we&apos;ll share a QR code to pay.
            </DialogDescription>
            {whatsAppNumber && (
              <a
                href={`https://wa.me/${whatsAppNumber}?text=${text}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-6 w-full inline-flex items-center justify-center gap-2 h-13 py-3.5 rounded-full bg-[#1E9E55] hover:bg-[#178a49] text-white font-bold transition-colors"
              >
                <WhatsAppIcon className="w-5 h-5" /> Send Order ID on WhatsApp
              </a>
            )}
            <div className="relative mt-3 grid grid-cols-2 gap-2.5">
              <a
                href={`/checkout/success/${placedOrder.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 rounded-full border-[1.5px] border-[#E5C2CF] text-plum font-bold flex items-center justify-center gap-2 hover:border-plum"
              >
                <Printer className="w-4 h-4" /> Invoice
              </a>
              <button type="button" onClick={() => { showPlacedOrder(null); goTo('shop'); }} className="h-12 rounded-full bg-plum text-white font-bold hover:bg-plum-soft">
                Keep browsing
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ auth */

const inputClass = 'w-full h-12 rounded-2xl border-[1.5px] border-[#E5C2CF] bg-white px-4 text-[15px] text-ink focus:outline-none focus:border-rose';

function AuthDialog() {
  const { authMode, openAuth, closeAuth, authThen, openCheckout } = useStorefront();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const isSignup = authMode === 'signup';

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const res = isSignup ? await signUpInline(formData) : await signInInline(formData);
    setPending(false);
    if ('error' in res) { setError(res.error); return; }
    if ('isAdmin' in res && res.isAdmin) { closeAuth(); router.push('/admin'); return; }
    toast.success(isSignup ? 'Welcome to Hamperly!' : 'Signed in', { icon: '👋' });
    const then = authThen;
    closeAuth();
    // Re-fetch server data (account, saved address) in place, no navigation
    router.refresh();
    if (then === 'checkout') openCheckout();
  };

  return (
    <Dialog open={!!authMode} onOpenChange={open => { if (!open) { closeAuth(); setError(''); } }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md w-full max-w-[calc(100%-1rem)] p-0 rounded-[32px] bg-white ring-0 overflow-hidden gap-0">
        <div className="bg-rose px-6 py-7 flex items-start justify-between">
          <div>
            <span className="font-script text-4xl text-white">Hamperly</span>
            <DialogTitle className="mt-1 font-serif font-semibold text-white text-2xl">{isSignup ? 'Create your account' : 'Welcome back'}</DialogTitle>
          </div>
          <CloseButton onClick={closeAuth} />
        </div>
        <form onSubmit={submit} className="p-6 flex flex-col gap-3.5">
          <DialogDescription className="text-sm text-ink-muted">
            {isSignup ? 'Save addresses, track orders and get back-in-stock alerts.' : 'Sign in to see your orders, wishlist and saved address.'}
          </DialogDescription>
          {isSignup && (
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-plum">Full name
              <input name="full_name" required autoComplete="name" className={inputClass} />
            </label>
          )}
          {isSignup && (
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-plum">Date of birth
              <input name="date_of_birth" type="date" required autoComplete="bday" min="1900-01-01" max={todayInIndia()} className={inputClass} />
              <span className="text-xs font-normal text-ink-muted">You must be {MINIMUM_AGE} or older. We only check it, we don&apos;t store it.</span>
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-plum">Email
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-plum">Password
            <PasswordInput name="password" required autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 6 : undefined} className="h-12 rounded-2xl border-[1.5px] border-[#E5C2CF]" />
          </label>
          {!isSignup && (
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" name="keepLoggedIn" defaultChecked className="w-4 h-4 accent-rose" /> Keep me signed in
            </label>
          )}
          {error && <p role="alert" className="text-sm font-semibold text-rose bg-[#FBEAF0] rounded-xl px-3 py-2">{error}</p>}
          <button type="submit" disabled={pending} className="h-12 rounded-full bg-rose hover:bg-rose-deep disabled:opacity-60 text-white font-bold">
            {pending ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
          <p className="text-sm text-center text-ink-muted">
            {isSignup ? 'Already have an account?' : 'New to Hamperly?'}{' '}
            <button type="button" onClick={() => { setError(''); openAuth(isSignup ? 'login' : 'signup', authThen ?? undefined); }} className="font-bold text-rose hover:text-rose-deep">
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ account */

type Purchase = { id: string; purchase_date: string; status: string; payment_status: string; final_amount: number; purchase_items: { id: string; product_name_snapshot: string; quantity: number }[] };
type Profile = { full_name: string | null; mobile_number: string | null; email: string | null };
type Note = { id: string; title: string; message: string; is_read: boolean; created_at: string; type: string; metadata?: { hamper_id?: string } | null };
type AccountData = { purchases: Purchase[]; profile: Profile | null; notifications: Note[] };

const TABS: { id: AccountTab; label: string; icon: typeof Package }[] = [
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'notifications', label: 'Updates', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

function AccountSheet({ isLoggedIn, hampers }: { isLoggedIn: boolean; hampers: PublicHamper[] }) {
  const { accountTab, openAccount, closeAccount, openAuth, goTo, openHamper } = useStorefront();
  const { wishlistedHampers } = useWishlist();
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);

  const open = !!accountTab;
  useEffect(() => {
    if (!open || !isLoggedIn) return;
    let cancelled = false;
    Promise.all([getMyPurchases(), getMyProfile(), getMyNotifications()]).then(([p, prof, n]) => {
      if (cancelled) return;
      setData({
        purchases: ('purchases' in p ? (p.purchases as Purchase[]) : []) || [],
        profile: 'customer' in prof ? (prof.customer as Profile) : null,
        notifications: (n.notifications as Note[]) || [],
      });
    });
    return () => { cancelled = true; };
  }, [open, isLoggedIn]);

  const signOut = async () => {
    await signOutInline();
    closeAccount();
    toast.success('Signed out');
    router.refresh();
  };

  const saved = hampers.filter(h => wishlistedHampers.has(h.id));

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) closeAccount(); }}>
      <DialogContent showCloseButton={false} className={`sm:max-w-4xl ${sheetClass}`}>
        <div className="sticky top-0 z-20 bg-blush/90 backdrop-blur px-5 sm:px-8 pt-5 pb-3 border-b border-petal-line">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="font-serif font-semibold text-plum text-3xl tracking-[-0.02em]">
                {data?.profile?.full_name ? `Hi, ${data.profile.full_name.split(' ')[0]}` : 'Your account'}
              </DialogTitle>
              <DialogDescription className="text-sm text-ink-muted">Orders, wishlist, updates and profile.</DialogDescription>
            </div>
            <CloseButton onClick={closeAccount} />
          </div>
          {isLoggedIn && (
            <div role="tablist" aria-label="Account sections" className="mt-4 flex gap-2 overflow-x-auto [scrollbar-width:none]">
              {TABS.map(t => (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={accountTab === t.id}
                  onClick={() => openAccount(t.id)}
                  className={`h-10 px-4 rounded-full text-sm font-bold flex items-center gap-1.5 shrink-0 transition-colors ${accountTab === t.id ? 'bg-plum text-white' : 'bg-white text-plum hover:bg-petal'}`}
                >
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
              <button type="button" onClick={signOut} className="ml-auto h-10 px-4 rounded-full text-sm font-bold text-ink-muted hover:text-rose flex items-center gap-1.5 shrink-0">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-8 py-6 min-h-[40vh]">
          {!isLoggedIn ? (
            <div className="text-center py-12">
              <p className="font-serif text-2xl text-plum mb-2">Sign in to see your account</p>
              <p className="text-ink-muted mb-6">Track orders, keep a wishlist and get back-in-stock alerts.</p>
              <div className="flex justify-center gap-2.5">
                <button type="button" onClick={() => { closeAccount(); openAuth('login'); }} className="h-12 px-6 rounded-full bg-rose text-white font-bold hover:bg-rose-deep">Sign in</button>
                <button type="button" onClick={() => { closeAccount(); openAuth('signup'); }} className="h-12 px-6 rounded-full border-[1.5px] border-[#E5C2CF] text-plum font-bold hover:border-plum">Create account</button>
              </div>
            </div>
          ) : !data ? (
            <p className="flex items-center gap-3 text-ink-muted font-semibold"><span className="w-5 h-5 rounded-full border-[3px] border-petal border-t-rose animate-spin" aria-hidden="true" /> Loading…</p>
          ) : accountTab === 'orders' ? (
            data.purchases.length === 0 ? (
              <EmptyState title="No orders yet" body="Your orders will appear here." action="Browse hampers" onAction={() => goTo('shop')} />
            ) : (
              <ul className="flex flex-col gap-4">
                {data.purchases.map(order => (
                  <li key={order.id} className="bg-white rounded-3xl border border-petal-line overflow-hidden">
                    <div className="px-5 py-4 bg-[#FFFDF8] border-b border-petal-line flex flex-wrap gap-x-6 gap-y-2 items-center text-sm">
                      <span><span className="block text-[11px] font-bold tracking-[0.12em] text-ink-muted">ORDER</span><span className="font-mono font-bold text-plum">#{order.id.split('-')[0].toUpperCase()}</span></span>
                      <span><span className="block text-[11px] font-bold tracking-[0.12em] text-ink-muted">PLACED</span>{new Date(order.purchase_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span><span className="block text-[11px] font-bold tracking-[0.12em] text-ink-muted">TOTAL</span><strong>₹{Number(order.final_amount).toLocaleString('en-IN')}</strong></span>
                      <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-bold ${order.status === 'COMPLETED' ? 'bg-[#E7F6EC] text-[#1F6B3E]' : order.status === 'CANCELLED' ? 'bg-[#EEE6EA] text-ink-muted' : 'bg-[#FFF1D6] text-[#7A4A00]'}`}>
                        {order.status === 'PENDING' ? 'CONFIRMED' : order.status} · {order.payment_status === 'PAID' ? 'PAID' : 'PAYMENT PENDING'}
                      </span>
                    </div>
                    <div className="px-5 py-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                      <p className="text-sm text-ink leading-relaxed">
                        {order.purchase_items.slice(0, 4).map(i => `${i.product_name_snapshot.replace(/^\[[^\]]*\]\s*/, '')} × ${i.quantity}`).join(', ')}
                        {order.purchase_items.length > 4 ? ` and ${order.purchase_items.length - 4} more` : ''}
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <a href={`/checkout/success/${order.id}`} target="_blank" rel="noopener noreferrer" className="h-10 px-4 rounded-full border-[1.5px] border-[#E5C2CF] text-plum text-sm font-bold flex items-center gap-1.5 hover:border-plum">
                          <Printer className="w-4 h-4" /> Invoice
                        </a>
                        {order.status === 'PENDING' && <CancelOrderButton orderId={order.id} />}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : accountTab === 'wishlist' ? (
            saved.length === 0 ? (
              <EmptyState title="Nothing saved yet" body="Tap the heart on any hamper to save it here." action="Browse hampers" onAction={() => goTo('shop')} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {saved.map(h => <HamperCard key={h.id} hamper={h} />)}
              </div>
            )
          ) : accountTab === 'notifications' ? (
            data.notifications.length === 0 ? (
              <EmptyState title="No updates yet" body="Order updates and back-in-stock alerts will show up here." />
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={async () => { await markAllNotificationsAsRead(); setData(d => d && { ...d, notifications: d.notifications.map(n => ({ ...n, is_read: true })) }); }}
                  className="self-end text-sm font-bold text-rose hover:text-rose-deep"
                >
                  Mark all as read
                </button>
                {data.notifications.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => { if (n.type === 'BACK_IN_STOCK' && n.metadata?.hamper_id) { closeAccount(); openHamper(n.metadata.hamper_id); } else if (n.type !== 'ACCOUNT_WELCOME') openAccount('orders'); }}
                    className={`text-left bg-white rounded-2xl border px-4 py-3 ${n.is_read ? 'border-petal-line' : 'border-rose'}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <strong className="text-plum">{n.title}</strong>
                      <span className="text-xs text-ink-muted shrink-0">{formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: true })}</span>
                    </span>
                    <span className="block text-sm text-ink-muted mt-0.5">{n.message}</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="bg-white rounded-3xl border border-petal-line p-6 max-w-xl">
              {data.profile?.email && <p className="text-sm text-ink-muted mb-4">Signed in as <strong className="text-ink">{data.profile.email}</strong></p>}
              <ProfileForm initialName={data.profile?.full_name || ''} initialPhone={data.profile?.mobile_number || ''} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <div className="text-center py-14">
      <p className="font-serif text-2xl text-plum mb-1.5">{title}</p>
      <p className="text-ink-muted mb-6">{body}</p>
      {action && onAction && (
        <button type="button" onClick={onAction} className="h-11 px-6 rounded-full bg-plum text-white font-bold hover:bg-plum-soft">{action}</button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ policy */

function PolicyDialog({ children }: { children: React.ReactNode }) {
  const { policyOpen, setPolicyOpen } = useStorefront();
  return (
    <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
      <DialogContent showCloseButton={false} className={`sm:max-w-3xl ${sheetClass} bg-white`}>
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur px-6 sm:px-10 py-4 flex items-center justify-between gap-4 border-b border-petal-line">
          <DialogTitle className="font-serif font-semibold text-plum text-2xl sm:text-3xl">Cancellation &amp; Return Policy</DialogTitle>
          <CloseButton onClick={() => setPolicyOpen(false)} />
        </div>
        <DialogDescription className="sr-only">How cancellations, returns and refunds work at Hamperly.</DialogDescription>
        <div className="px-6 sm:px-10 py-8">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
