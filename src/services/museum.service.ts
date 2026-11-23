import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { MuseumExhibit } from '@/components/customer/museum/types';

const MAX_EXHIBITS = 14;
const MAX_REVIEWS = 3;

interface HamperRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  stock_quantity: number | null;
  selling_price: number | string | null;
  created_at: string;
  occasion: { name: string | null } | { name: string | null }[] | null;
  items: {
    product_id: string;
    quantity: number | null;
    sort_order: number | null;
    product: { id: string; name: string; categories: { name: string | null } | { name: string | null }[] | null } | null;
  }[] | null;
}

interface ReviewRow {
  id: string;
  hamper_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

/**
 * Reviewer first names. Customers RLS only exposes a user's own row, so this needs the
 * service-role client (same approach as review.actions.ts). Falls back to "Verified buyer".
 */
async function reviewerFirstNames(userIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!userIds.length || !url || !key) return names;
  try {
    const admin = createSupabaseClient(url, key, { auth: { persistSession: false } });
    const { data } = await admin.from('customers').select('user_id, full_name').in('user_id', userIds);
    for (const c of (data ?? []) as { user_id: string; full_name: string | null }[]) {
      const first = c.full_name?.trim().split(/\s+/)[0];
      if (first) names.set(c.user_id, first);
    }
  } catch (err) {
    console.error('Museum: could not resolve reviewer names', err);
  }
  return names;
}

/** Active pre-made hampers shaped for the 3D museum tour: in-stock first, newest first, max 14. */
export async function getMuseumExhibits(): Promise<MuseumExhibit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('hampers')
    .select(`
      id, name, description, image_url, stock_quantity, selling_price, created_at,
      occasion:occasions(name),
      items:hamper_items(
        product_id, quantity, sort_order,
        product:products(id, name, categories(name))
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(60);

  if (error || !data) {
    console.error('Museum: error fetching hampers', error?.message || error);
    return [];
  }

  const rows = (data as unknown as HamperRow[])
    .map((h, i) => ({ h, i, out: h.stock_quantity !== null && h.stock_quantity <= 0 }))
    // Stable: in-stock first, then keep created_at desc order from the query
    .sort((a, b) => Number(a.out) - Number(b.out) || a.i - b.i)
    .slice(0, MAX_EXHIBITS)
    .map(r => r.h);

  const ids = rows.map(h => h.id);
  const reviewsByHamper = new Map<string, ReviewRow[]>();
  if (ids.length) {
    const { data: reviews, error: rErr } = await supabase
      .from('reviews')
      .select('id, hamper_id, user_id, rating, comment')
      .in('hamper_id', ids)
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false });
    if (rErr) console.error('Museum: error fetching reviews', rErr.message);
    for (const r of (reviews ?? []) as ReviewRow[]) {
      const list = reviewsByHamper.get(r.hamper_id) ?? [];
      list.push(r);
      reviewsByHamper.set(r.hamper_id, list);
    }
  }

  const quoted: ReviewRow[] = [];
  reviewsByHamper.forEach(list => quoted.push(...list.filter(r => r.comment?.trim()).slice(0, MAX_REVIEWS)));
  const names = await reviewerFirstNames([...new Set(quoted.map(r => r.user_id))]);

  return rows.map(h => {
    const all = reviewsByHamper.get(h.id) ?? [];
    const rating = all.length ? Math.round((all.reduce((s, r) => s + Number(r.rating || 0), 0) / all.length) * 10) / 10 : null;
    const items = [...(h.items ?? [])]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .filter(it => it.product)
      .map(it => ({
        productId: it.product!.id,
        name: it.product!.name,
        category: one(it.product!.categories)?.name ?? null,
        quantity: Math.max(1, Number(it.quantity) || 1),
      }));
    return {
      id: h.id,
      name: h.name,
      description: h.description,
      price: Number(h.selling_price) || 0,
      stock: h.stock_quantity,
      imageUrl: h.image_url,
      occasionName: one(h.occasion)?.name ?? null,
      items,
      rating,
      reviewCount: all.length,
      reviews: all
        .filter(r => r.comment?.trim())
        .slice(0, MAX_REVIEWS)
        .map(r => ({ id: r.id, rating: r.rating, comment: r.comment!.trim(), author: names.get(r.user_id) ?? 'Verified buyer' })),
    };
  });
}
