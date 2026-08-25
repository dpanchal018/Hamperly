import { getHamperById } from '@/actions/hamper.actions';
import {
  getApprovedReviewsForHamper,
  getMyReviewForHamper,
} from '@/actions/review.actions';
import { getCurrentUser } from '@/services/auth.service';
import { PageTransition, FadeInScroll } from '@/components/ui/AnimatedWrapper';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Gift, LogIn } from 'lucide-react';
import { ReviewCard } from '@/components/customer/ReviewCard';
import { ReviewForm } from '@/components/customer/ReviewForm';
import { StarRating } from '@/components/customer/StarRating';
import { HamperDetailActions } from '@/components/customer/HamperDetailActions';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const hamper = await getHamperById(resolvedParams.id);

  if (!hamper) {
    return { title: 'Hamper Not Found' };
  }

  return {
    title: hamper.name,
    description: hamper.description || `Shop ${hamper.name} at Hamperly.`,
  };
}

export default async function HamperDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const hamper = await getHamperById(resolvedParams.id);

  if (!hamper || !hamper.is_active) {
    notFound();
  }

  const [reviews, user] = await Promise.all([
    getApprovedReviewsForHamper(hamper.id),
    getCurrentUser(),
  ]);
  const myReview = user ? await getMyReviewForHamper(hamper.id) : null;

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <PageTransition className="bg-background min-h-screen pt-32 pb-24 border-t border-primary/10">
      <div className="container mx-auto px-4 max-w-6xl">
        <FadeInScroll>
          <Link href="/hampers" className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 mb-16 transition-colors">
            <ArrowLeft className="w-3 h-3 mr-2" /> Back to Hampers
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-primary/5 flex items-center justify-center">
              {hamper.image_url ? (
                <Image
                  src={hamper.image_url}
                  alt={hamper.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-primary/30">
                  <Gift className="w-16 h-16 mb-2" strokeWidth={1.5} />
                  <span className="font-script text-3xl">Curated Hamper</span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="mb-8 border-b border-primary/10 pb-8">
                {reviews.length > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <StarRating value={Math.round(averageRating)} readOnly size="sm" />
                    <span className="text-sm text-foreground/60">
                      {averageRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? '' : 's'})
                    </span>
                  </div>
                )}

                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight leading-[1.1] mb-6">
                  {hamper.name}
                </h1>

                <div className="text-2xl font-bold text-foreground">
                  ₹{hamper.selling_price.toFixed(2)}
                </div>
              </div>

              <p className="text-foreground/70 font-light leading-relaxed mb-12">
                {hamper.description || 'A beautifully curated selection.'}
              </p>

              <HamperDetailActions hamper={hamper} />
            </div>
          </div>
        </FadeInScroll>

        {/* Reviews */}
        <FadeInScroll delay={0.1}>
          <div className="mt-24 pt-16 border-t border-primary/10">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-8">Ratings &amp; Reviews</h2>

            {reviews.length === 0 ? (
              <p className="text-foreground/60 mb-8">No reviews yet — be the first to share your feedback!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}

            <div className="max-w-xl">
              {!user ? (
                <Link
                  href={`/login?redirect=/hampers/${hamper.id}`}
                  className="flex items-center justify-center w-full sm:w-auto px-6 py-3.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full transition-colors shadow-sm"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Log In to Write a Review
                </Link>
              ) : myReview ? (
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-center">
                  <p className="font-semibold text-foreground">
                    {myReview.status === 'PENDING' && 'Your review is pending approval.'}
                    {myReview.status === 'APPROVED' && 'Thanks for your review!'}
                    {myReview.status === 'REJECTED' && 'Your review was not approved for publishing.'}
                  </p>
                </div>
              ) : (
                <ReviewForm hamperId={hamper.id} />
              )}
            </div>
          </div>
        </FadeInScroll>
      </div>
    </PageTransition>
  );
}
