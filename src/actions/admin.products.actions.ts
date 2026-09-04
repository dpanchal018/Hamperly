'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const category_id = formData.get('category_id') as string;
  const stock_quantity_raw = formData.get('stock_quantity') as string;
  const stock_quantity = stock_quantity_raw === '' || stock_quantity_raw === null
    ? null  // null = unlimited
    : parseInt(stock_quantity_raw) || 0;
  const status = formData.get('status') as string || 'draft';
  const sku = (formData.get('sku') as string) || null;
  const gender_id_raw = formData.get('gender_id') as string;
  const gender_id = gender_id_raw ? parseInt(gender_id_raw) : null;
  const is_customizable = formData.get('is_customizable') === 'true';
  const min_quantity = parseInt(formData.get('min_quantity') as string) || 1;

  const cost_price = parseFloat(formData.get('cost_price') as string);
  const target_margin = parseFloat(formData.get('target_margin') as string);

  const occasionIdsStr = formData.get('occasion_ids') as string;
  const occasionIds: string[] = occasionIdsStr ? JSON.parse(occasionIdsStr) : [];

  const eventIdsStr = formData.get('event_ids') as string;
  const eventIds: string[] = eventIdsStr ? JSON.parse(eventIdsStr) : [];

  const recipientTagIdsStr = formData.get('recipient_tag_ids') as string;
  const recipientTagIds: number[] = recipientTagIdsStr ? JSON.parse(recipientTagIdsStr) : [];

  if (!name || !slug || !category_id) throw new Error('Name, Slug, and Category are required');
  if (target_margin < 0 || target_margin >= 1) throw new Error('Invalid target margin');
  if (cost_price < 0) throw new Error('Cost price cannot be negative');

  const supabase = await createClient();

  // 1. Create Product with new Phase-1 metadata
  const { data: product, error: productError } = await supabase.from('products').insert({
    name, slug, description, category_id, stock_quantity, status,
    sku, gender_id, is_customizable, min_quantity
  }).select('id').single();

  if (productError || !product) throw new Error(productError?.message || 'Failed to create product');

  // 2. Create Pricing (admin-only)
  const { error: pricingError } = await supabase.from('product_pricing').insert({
    product_id: product.id,
    cost_price,
    target_margin
  });

  if (pricingError) {
    await supabase.from('products').delete().eq('id', product.id);
    throw new Error(pricingError.message);
  }

  // 3. Assign Occasions
  if (occasionIds.length > 0) {
    await supabase.from('product_occasions').insert(
      occasionIds.map(id => ({ product_id: product.id, occasion_id: id }))
    );
  }

  // 4. Assign Recipient Tags
  if (recipientTagIds.length > 0) {
    await supabase.from('product_recipient_tags').insert(
      recipientTagIds.map(tag_id => ({ product_id: product.id, recipient_tag_id: tag_id }))
    );
  }

  // 4b. Assign Events
  if (eventIds.length > 0) {
    await supabase.from('product_events').insert(
      eventIds.map(event_id => ({ product_id: product.id, event_id }))
    );
  }

  // 5. Primary Image
  const imageUrl = formData.get('image_url') as string;
  if (imageUrl) {
    await supabase.from('product_images').insert({
      product_id: product.id,
      image_url: imageUrl,
      is_primary: true
    });
  }

  revalidatePath('/admin/products');
  return product.id;
}

export async function updateProductAction(id: string, formData: FormData) {
  await requireAdmin();

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const category_id = formData.get('category_id') as string;
  const stock_quantity_raw = formData.get('stock_quantity') as string;
  const stock_quantity = stock_quantity_raw === '' || stock_quantity_raw === null
    ? null
    : parseInt(stock_quantity_raw) || 0;
  const status = formData.get('status') as string || 'draft';
  const sku = (formData.get('sku') as string) || null;
  const gender_id_raw = formData.get('gender_id') as string;
  const gender_id = gender_id_raw ? parseInt(gender_id_raw) : null;
  const is_customizable = formData.get('is_customizable') === 'true';
  const min_quantity = parseInt(formData.get('min_quantity') as string) || 1;

  const cost_price = parseFloat(formData.get('cost_price') as string);
  const target_margin = parseFloat(formData.get('target_margin') as string);

  const occasionIdsStr = formData.get('occasion_ids') as string;
  const occasionIds: string[] = occasionIdsStr ? JSON.parse(occasionIdsStr) : [];

  const eventIdsStr = formData.get('event_ids') as string;
  const eventIds: string[] = eventIdsStr ? JSON.parse(eventIdsStr) : [];

  const recipientTagIdsStr = formData.get('recipient_tag_ids') as string;
  const recipientTagIds: number[] = recipientTagIdsStr ? JSON.parse(recipientTagIdsStr) : [];

  if (!name || !slug || !category_id) throw new Error('Name, Slug, and Category are required');
  if (target_margin < 0 || target_margin >= 1) throw new Error('Invalid target margin');
  if (cost_price < 0) throw new Error('Cost price cannot be negative');

  const supabase = await createClient();

  // 1. Update Product with new metadata
  const { error: productError } = await supabase.from('products').update({
    name, slug, description, category_id, stock_quantity, status,
    sku, gender_id, is_customizable, min_quantity,
    updated_at: new Date().toISOString()
  }).eq('id', id);

  if (productError) throw new Error(productError.message);

  // 2. Update Pricing
  const { error: pricingError } = await supabase.from('product_pricing').upsert({
    product_id: id,
    cost_price,
    target_margin,
    updated_at: new Date().toISOString()
  });

  if (pricingError) throw new Error(pricingError.message);

  // 3. Replace Occasions
  await supabase.from('product_occasions').delete().eq('product_id', id);
  if (occasionIds.length > 0) {
    await supabase.from('product_occasions').insert(
      occasionIds.map(occId => ({ product_id: id, occasion_id: occId }))
    );
  }

  // 4. Replace Recipient Tags
  await supabase.from('product_recipient_tags').delete().eq('product_id', id);
  if (recipientTagIds.length > 0) {
    await supabase.from('product_recipient_tags').insert(
      recipientTagIds.map(tag_id => ({ product_id: id, recipient_tag_id: tag_id }))
    );
  }

  // 4b. Replace Events
  await supabase.from('product_events').delete().eq('product_id', id);
  if (eventIds.length > 0) {
    await supabase.from('product_events').insert(
      eventIds.map(event_id => ({ product_id: id, event_id }))
    );
  }

  // 5. Image URL handling
  const imageUrl = formData.get('image_url') as string;
  if (imageUrl) {
    const { data: existingImages } = await supabase
      .from('product_images').select('id').eq('product_id', id).eq('is_primary', true);
    if (existingImages && existingImages.length > 0) {
      await supabase.from('product_images').update({ image_url: imageUrl }).eq('id', existingImages[0].id);
    } else {
      await supabase.from('product_images').insert({ product_id: id, image_url: imageUrl, is_primary: true });
    }
  }

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
}
