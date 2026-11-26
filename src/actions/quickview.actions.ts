'use server';

import { getHamperById } from '@/actions/hamper.actions';
import { getApprovedReviewsForHamper, getMyReviewForHamper } from '@/actions/review.actions';
import { getCurrentUser } from '@/services/auth.service';
import type { HamperDetailView, ReviewWithDetails } from '@/types/database.types';

export interface HamperQuickViewData {
  hamper: HamperDetailView;
  reviews: ReviewWithDetails[];
  isLoggedIn: boolean;
  myReviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

/** Everything the in-page hamper details overlay needs, in one round trip. */
export async function getHamperQuickView(id: string): Promise<HamperQuickViewData | null> {
  const hamper = await getHamperById(id);
  if (!hamper || !hamper.is_active) return null;
  const [reviews, user] = await Promise.all([getApprovedReviewsForHamper(hamper.id), getCurrentUser()]);
  const myReview = user ? await getMyReviewForHamper(hamper.id) : null;
  return {
    hamper,
    reviews,
    isLoggedIn: !!user,
    myReviewStatus: (myReview?.status as HamperQuickViewData['myReviewStatus']) ?? null,
  };
}
