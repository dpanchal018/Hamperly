'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getCurrentUser, requireAdmin } from '@/services/auth.service';
import { Review, ReviewStatus, ReviewWithDetails } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

// customers RLS only allows a user to read their own row, but "Rated by {name}" needs
// to resolve reviewer names for every visitor — mirrors the supabaseAdmin pattern in checkout.actions.ts.
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function attachReviewerNames<T extends Review>(reviews: T[]) {
  if (reviews.length === 0) return [] as (T & { reviewer_name: string })[];

  const userIds = [...new Set(reviews.map((r) => r.user_id))];
  const { data: customers } = await supabaseAdmin
    .from('customers')
    .select('user_id, full_name')
    .in('user_id', userIds);

  const nameByUserId = new Map((customers || []).map((c: any) => [c.user_id, c.full_name]));

  return reviews.map((r) => ({
    ...r,
    reviewer_name: nameByUserId.get(r.user_id) || 'A Hamperly Customer',
  }));
}

export async function createReview(hamperId: string, rating: number, comment: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to leave a review' };
  }

  if (!rating || rating < 1 || rating > 5) {
    return { error: 'Please select a rating between 1 and 5 stars' };
  }

  const supabase = await createClient();
  const { data: review, error } = await supabase
    .from('reviews')
    .insert([{
      hamper_id: hamperId,
      user_id: user.id,
      rating,
      comment: comment?.trim() || null,
      status: 'PENDING',
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: "You've already reviewed this hamper" };
    }
    console.error('Error creating review:', error);
    return { error: error.message };
  }

  revalidatePath(`/hampers/${hamperId}`);
  return { review: review as Review };
}

export async function getMyReviewForHamper(hamperId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: review } = await supabase
    .from('reviews')
    .select('*')
    .eq('hamper_id', hamperId)
    .eq('user_id', user.id)
    .maybeSingle();

  return review as Review | null;
}

export async function getApprovedReviewsForHamper(hamperId: string): Promise<ReviewWithDetails[]> {
  const supabase = await createClient();
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('hamper_id', hamperId)
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false });

  if (error || !reviews) {
    console.error('Error fetching hamper reviews:', error);
    return [];
  }

  const withNames = await attachReviewerNames(reviews as Review[]);
  return withNames as ReviewWithDetails[];
}

export async function getFeaturedReviews(limit = 9): Promise<ReviewWithDetails[]> {
  const supabase = await createClient();
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*, hampers(id, name, image_url)')
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !reviews) {
    console.error('Error fetching featured reviews:', error);
    return [];
  }

  const withNames = await attachReviewerNames(reviews as any[]);
  return withNames.map((r: any) => ({
    ...r,
    hamper: r.hampers,
  })) as ReviewWithDetails[];
}

// Admin

export async function getAllReviewsForAdmin(): Promise<ReviewWithDetails[]> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*, hampers(id, name, image_url)')
    .order('created_at', { ascending: false });

  if (error || !reviews) {
    console.error('Error fetching reviews for admin:', error);
    return [];
  }

  // Surface pending reviews first for moderation, most recent within each group.
  const statusOrder: Record<string, number> = { PENDING: 0, APPROVED: 1, REJECTED: 2 };
  const sorted = [...reviews].sort((a: any, b: any) => statusOrder[a.status] - statusOrder[b.status]);

  const withNames = await attachReviewerNames(sorted as any[]);
  return withNames.map((r: any) => ({
    ...r,
    hamper: r.hampers,
  })) as ReviewWithDetails[];
}

export async function updateReviewStatus(id: string, status: ReviewStatus) {
  await requireAdmin();

  const supabase = await createClient();
  const { data: review, error } = await supabase
    .from('reviews')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating review status:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/reviews');
  revalidatePath('/');
  if (review?.hamper_id) {
    revalidatePath(`/hampers/${review.hamper_id}`);
  }
  return { review: review as Review };
}

export async function deleteReview(id: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from('reviews').delete().eq('id', id);

  if (error) {
    console.error('Error deleting review:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/reviews');
  return { success: true };
}
