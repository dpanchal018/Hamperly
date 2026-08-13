const fs = require('fs');

const categories = [
  { name: 'Chocolates & Sweets', slug: 'chocolates-and-sweets', description: 'Delicious chocolates and traditional sweets' },
  { name: 'Dry Fruits & Nuts', slug: 'dry-fruits-and-nuts', description: 'Premium quality dry fruits and nuts' },
  { name: 'Candles & Fragrance', slug: 'candles-and-fragrance', description: 'Aromatic candles and diffusers' },
  { name: 'Decor & Festive', slug: 'decor-and-festive', description: 'Beautiful decor and festive items' },
  { name: 'Beverages', slug: 'beverages', description: 'Gourmet tea, coffee, and more' },
  { name: 'Personalized Gifts', slug: 'personalized-gifts', description: 'Unique personalized items' },
  { name: 'Self-Care', slug: 'self-care', description: 'Relaxing self-care and spa products' },
  { name: 'Snacks & Gourmet', slug: 'snacks-and-gourmet', description: 'Premium snacks and gourmet treats' },
  { name: 'Packaging', slug: 'packaging', description: 'Elegant hamper packaging options' }
];

const occasions = [
  { name: 'Diwali', slug: 'diwali' },
  { name: 'Birthday', slug: 'birthday' },
  { name: 'Anniversary', slug: 'anniversary' },
  { name: 'Valentine\'s Day', slug: 'valentines-day' },
  { name: 'Raksha Bandhan', slug: 'raksha-bandhan' },
  { name: 'Mother\'s Day', slug: 'mothers-day' },
  { name: 'Father\'s Day', slug: 'fathers-day' },
  { name: 'Corporate Gifting', slug: 'corporate-gifting' },
  { name: 'Housewarming', slug: 'housewarming' },
  { name: 'Self-Care', slug: 'self-care' }
];

const products = [
  { name: 'Premium Assorted Chocolate Box', category: 'Chocolates & Sweets', cost: 300, margin: 0.25, occs: ['Diwali', 'Birthday', 'Valentine\'s Day'] },
  { name: 'Belgian Truffle Collection', category: 'Chocolates & Sweets', cost: 450, margin: 0.30, occs: ['Anniversary', 'Valentine\'s Day', 'Corporate Gifting'] },
  { name: 'Dark Chocolate Selection', category: 'Chocolates & Sweets', cost: 250, margin: 0.20, occs: ['Birthday', 'Father\'s Day'] },
  { name: 'Milk Chocolate Gift Pack', category: 'Chocolates & Sweets', cost: 150, margin: 0.225, occs: ['Birthday', 'Raksha Bandhan'] },
  { name: 'Handmade Fudge Box', category: 'Chocolates & Sweets', cost: 200, margin: 0.25, occs: ['Diwali', 'Mother\'s Day'] },
  { name: 'Gourmet Praline Box', category: 'Chocolates & Sweets', cost: 400, margin: 0.275, occs: ['Anniversary', 'Valentine\'s Day'] },
  { name: 'Assorted Indian Sweets Box', category: 'Chocolates & Sweets', cost: 280, margin: 0.25, occs: ['Diwali', 'Raksha Bandhan', 'Housewarming'] },
  { name: 'Chocolate-Dipped Biscuit Pack', category: 'Chocolates & Sweets', cost: 120, margin: 0.20, occs: ['Birthday', 'Corporate Gifting'] },
  
  { name: 'Premium Mixed Dry Fruit Box', category: 'Dry Fruits & Nuts', cost: 500, margin: 0.25, occs: ['Diwali', 'Corporate Gifting', 'Housewarming'] },
  { name: 'Cashew Almond Gift Jar', category: 'Dry Fruits & Nuts', cost: 350, margin: 0.225, occs: ['Diwali', 'Anniversary'] },
  { name: 'Roasted Pistachio Jar', category: 'Dry Fruits & Nuts', cost: 400, margin: 0.25, occs: ['Corporate Gifting', 'Father\'s Day'] },
  { name: 'Premium Walnut Box', category: 'Dry Fruits & Nuts', cost: 450, margin: 0.275, occs: ['Diwali', 'Housewarming'] },
  { name: 'Mixed Nut & Berry Jar', category: 'Dry Fruits & Nuts', cost: 300, margin: 0.20, occs: ['Mother\'s Day', 'Self-Care'] },
  { name: 'Honey-Coated Almond Jar', category: 'Dry Fruits & Nuts', cost: 350, margin: 0.30, occs: ['Birthday', 'Anniversary'] },

  { name: 'Vanilla Soy Scented Candle', category: 'Candles & Fragrance', cost: 150, margin: 0.25, occs: ['Birthday', 'Housewarming'] },
  { name: 'Rose Oud Scented Candle', category: 'Candles & Fragrance', cost: 225, margin: 0.30, occs: ['Anniversary', 'Valentine\'s Day'] },
  { name: 'Lavender Relaxation Candle', category: 'Candles & Fragrance', cost: 180, margin: 0.25, occs: ['Self-Care', 'Mother\'s Day'] },
  { name: 'Sandalwood Aroma Candle', category: 'Candles & Fragrance', cost: 200, margin: 0.275, occs: ['Diwali', 'Housewarming'] },
  { name: 'Jasmine Fragrance Candle', category: 'Candles & Fragrance', cost: 150, margin: 0.20, occs: ['Valentine\'s Day', 'Anniversary'] },
  { name: 'Reed Diffuser Gift Set', category: 'Candles & Fragrance', cost: 350, margin: 0.25, occs: ['Corporate Gifting', 'Housewarming'] },

  { name: 'Handcrafted Diya Set', category: 'Decor & Festive', cost: 100, margin: 0.20, occs: ['Diwali', 'Housewarming'] },
  { name: 'Brass Diya Pair', category: 'Decor & Festive', cost: 250, margin: 0.25, occs: ['Diwali', 'Anniversary'] },
  { name: 'Festive Decorative Lantern', category: 'Decor & Festive', cost: 300, margin: 0.30, occs: ['Diwali', 'Housewarming'] },
  { name: 'Artificial Flower Bouquet', category: 'Decor & Festive', cost: 200, margin: 0.25, occs: ['Birthday', 'Valentine\'s Day'] },
  { name: 'Mini Floral Table Arrangement', category: 'Decor & Festive', cost: 250, margin: 0.225, occs: ['Housewarming', 'Mother\'s Day'] },
  { name: 'Decorative Rangoli Set', category: 'Decor & Festive', cost: 150, margin: 0.20, occs: ['Diwali'] },
  { name: 'Festive Tealight Holder Set', category: 'Decor & Festive', cost: 180, margin: 0.25, occs: ['Diwali', 'Housewarming'] },

  { name: 'Premium Green Tea Collection', category: 'Beverages', cost: 250, margin: 0.25, occs: ['Corporate Gifting', 'Self-Care'] },
  { name: 'Assorted Herbal Tea Box', category: 'Beverages', cost: 200, margin: 0.20, occs: ['Mother\'s Day', 'Housewarming'] },
  { name: 'Gourmet Arabica Coffee Pack', category: 'Beverages', cost: 300, margin: 0.30, occs: ['Father\'s Day', 'Corporate Gifting'] },
  { name: 'Hot Chocolate Gift Tin', category: 'Beverages', cost: 280, margin: 0.25, occs: ['Birthday', 'Anniversary'] },
  { name: 'Masala Chai Gift Box', category: 'Beverages', cost: 150, margin: 0.225, occs: ['Housewarming', 'Corporate Gifting'] },

  { name: 'Personalized Coffee Mug', category: 'Personalized Gifts', cost: 150, margin: 0.25, occs: ['Birthday', 'Corporate Gifting'] },
  { name: 'Personalized Photo Frame', category: 'Personalized Gifts', cost: 250, margin: 0.30, occs: ['Anniversary', 'Valentine\'s Day'] },
  { name: 'Personalized Name Keychain', category: 'Personalized Gifts', cost: 100, margin: 0.20, occs: ['Birthday', 'Father\'s Day'] },
  { name: 'Inspirational Message Card', category: 'Personalized Gifts', cost: 50, margin: 0.50, occs: ['Corporate Gifting', 'Mother\'s Day'] }, // Using 0.25 below to keep bounds
  { name: 'Premium Anniversary Greeting Card', category: 'Personalized Gifts', cost: 80, margin: 0.25, occs: ['Anniversary'] },
  { name: 'Personalized Gift Tag Set', category: 'Personalized Gifts', cost: 60, margin: 0.20, occs: ['Corporate Gifting', 'Birthday'] },

  { name: 'Lavender Bath & Body Set', category: 'Self-Care', cost: 400, margin: 0.25, occs: ['Mother\'s Day', 'Self-Care'] },
  { name: 'Rose Hand Cream Duo', category: 'Self-Care', cost: 250, margin: 0.275, occs: ['Valentine\'s Day', 'Birthday'] },
  { name: 'Herbal Soap Collection', category: 'Self-Care', cost: 200, margin: 0.20, occs: ['Housewarming', 'Self-Care'] },
  { name: 'Relaxation Spa Gift Set', category: 'Self-Care', cost: 500, margin: 0.30, occs: ['Anniversary', 'Valentine\'s Day', 'Self-Care'] },
  { name: 'Aromatherapy Bath Salt Jar', category: 'Self-Care', cost: 250, margin: 0.25, occs: ['Mother\'s Day', 'Self-Care'] },

  { name: 'Gourmet Butter Cookie Box', category: 'Snacks & Gourmet', cost: 180, margin: 0.20, occs: ['Birthday', 'Housewarming'] },
  { name: 'Premium Assorted Biscuit Tin', category: 'Snacks & Gourmet', cost: 250, margin: 0.25, occs: ['Corporate Gifting', 'Diwali'] },
  { name: 'Gourmet Trail Mix Pack', category: 'Snacks & Gourmet', cost: 200, margin: 0.225, occs: ['Father\'s Day', 'Self-Care'] },
  { name: 'Mini Gourmet Granola Jar', category: 'Snacks & Gourmet', cost: 150, margin: 0.25, occs: ['Mother\'s Day', 'Housewarming'] },

  { name: 'Premium Rigid Gift Box', category: 'Packaging', cost: 120, margin: 0.25, occs: ['Diwali', 'Birthday', 'Anniversary'] },
  { name: 'Woven Hamper Basket', category: 'Packaging', cost: 200, margin: 0.30, occs: ['Housewarming', 'Valentine\'s Day'] },
  { name: 'Premium Wooden Hamper Tray', category: 'Packaging', cost: 300, margin: 0.25, occs: ['Corporate Gifting', 'Diwali'] }
];

// Ensure valid margins
products.forEach(p => {
  if (p.margin > 0.30) p.margin = 0.25; // keep it within requirements
  // Also fix Decor occasions to have at least 2 occasions for all products
  if (p.occs.length < 2) p.occs.push('Housewarming');
});

// Generate SQL
let sql = `-- Phase 2A: Idempotent Mock Catalog Seed
-- This script safely inserts exactly 50 products and their dependencies.

`;

sql += `-- 1. CATEGORIES\n`;
categories.forEach((cat, i) => {
  sql += `INSERT INTO public.categories (name, slug, description, display_order)
VALUES ('${cat.name}', '${cat.slug}', '${cat.description}', ${i+1})
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

`;
});

sql += `-- 2. OCCASIONS\n`;
occasions.forEach((occ, i) => {
  sql += `INSERT INTO public.occasions (name, slug, is_active, display_order)
VALUES ('${occ.name}', '${occ.slug}', true, ${i+1})
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order;

`;
});

sql += `-- 3. PRODUCTS & PRICING\n`;
products.forEach((prod, i) => {
  const slug = prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const catSlug = categories.find(c => c.name === prod.category).slug;
  const imageUrl = `https://placehold.co/600x400/eeeeee/333333?text=${encodeURIComponent(prod.name)}`;
  
  sql += `
DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = '${catSlug}';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('${prod.name}', '${slug}', 'Mock description for ${prod.name}', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, ${prod.cost}, ${prod.margin})
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, '${imageUrl}', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    `;
    
  prod.occs.forEach(occName => {
    const occSlug = occasions.find(o => o.name === occName).slug;
    sql += `
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = '${occSlug}';`;
  });

  sql += `
END $$;
`;
});

fs.writeFileSync('c:\\Users\\dpanchal\\OneDrive - Horizontal Integration Inc\\Desktop\\Darshan\\Hamperly\\supabase\\migrations\\0003_phase2a_seed.sql', sql);
console.log('SQL generated!');
