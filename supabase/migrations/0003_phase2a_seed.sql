-- Phase 2A: Idempotent Mock Catalog Seed
-- This script safely inserts exactly 50 products and their dependencies.

-- 1. CATEGORIES
INSERT INTO public.categories (name, slug, description, display_order)
VALUES ('Chocolates & Sweets', 'chocolates-and-sweets', 'Delicious chocolates and traditional sweets', 1)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, slug, description, display_order)
VALUES ('Dry Fruits & Nuts', 'dry-fruits-and-nuts', 'Premium quality dry fruits and nuts', 2)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, slug, description, display_order)
VALUES ('Candles & Fragrance', 'candles-and-fragrance', 'Aromatic candles and diffusers', 3)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, slug, description, display_order)
VALUES ('Decor & Festive', 'decor-and-festive', 'Beautiful decor and festive items', 4)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, slug, description, display_order)
VALUES ('Beverages', 'beverages', 'Gourmet tea, coffee, and more', 5)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, slug, description, display_order)
VALUES ('Personalized Gifts', 'personalized-gifts', 'Unique personalized items', 6)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, slug, description, display_order)
VALUES ('Self-Care', 'self-care', 'Relaxing self-care and spa products', 7)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, slug, description, display_order)
VALUES ('Snacks & Gourmet', 'snacks-and-gourmet', 'Premium snacks and gourmet treats', 8)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, slug, description, display_order)
VALUES ('Packaging', 'packaging', 'Elegant hamper packaging options', 9)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

-- 2. OCCASIONS
INSERT INTO public.occasions (name, slug, is_active, display_order)
VALUES ('Diwali', 'diwali', true, 1)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order;

INSERT INTO public.occasions (name, slug, is_active, display_order)
VALUES ('Birthday', 'birthday', true, 2)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order;

INSERT INTO public.occasions (name, slug, is_active, display_order)
VALUES ('Anniversary', 'anniversary', true, 3)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order;

INSERT INTO public.occasions (name, slug, is_active, display_order)
VALUES ('Valentine's Day', 'valentines-day', true, 4)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order;

INSERT INTO public.occasions (name, slug, is_active, display_order)
VALUES ('Raksha Bandhan', 'raksha-bandhan', true, 5)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order;

INSERT INTO public.occasions (name, slug, is_active, display_order)
VALUES ('Mother's Day', 'mothers-day', true, 6)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order;

INSERT INTO public.occasions (name, slug, is_active, display_order)
VALUES ('Father's Day', 'fathers-day', true, 7)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order;

INSERT INTO public.occasions (name, slug, is_active, display_order)
VALUES ('Corporate Gifting', 'corporate-gifting', true, 8)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order;

INSERT INTO public.occasions (name, slug, is_active, display_order)
VALUES ('Housewarming', 'housewarming', true, 9)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order;

INSERT INTO public.occasions (name, slug, is_active, display_order)
VALUES ('Self-Care', 'self-care', true, 10)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order;

-- 3. PRODUCTS & PRICING

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'chocolates-and-sweets';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Premium Assorted Chocolate Box', 'premium-assorted-chocolate-box', 'Mock description for Premium Assorted Chocolate Box', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 300, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Premium%20Assorted%20Chocolate%20Box', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'valentines-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'chocolates-and-sweets';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Belgian Truffle Collection', 'belgian-truffle-collection', 'Mock description for Belgian Truffle Collection', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 450, 0.3)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Belgian%20Truffle%20Collection', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'valentines-day';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'chocolates-and-sweets';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Dark Chocolate Selection', 'dark-chocolate-selection', 'Mock description for Dark Chocolate Selection', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 250, 0.2)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Dark%20Chocolate%20Selection', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'fathers-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'chocolates-and-sweets';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Milk Chocolate Gift Pack', 'milk-chocolate-gift-pack', 'Mock description for Milk Chocolate Gift Pack', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 150, 0.225)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Milk%20Chocolate%20Gift%20Pack', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'raksha-bandhan';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'chocolates-and-sweets';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Handmade Fudge Box', 'handmade-fudge-box', 'Mock description for Handmade Fudge Box', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 200, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Handmade%20Fudge%20Box', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'mothers-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'chocolates-and-sweets';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Gourmet Praline Box', 'gourmet-praline-box', 'Mock description for Gourmet Praline Box', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 400, 0.275)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Gourmet%20Praline%20Box', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'valentines-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'chocolates-and-sweets';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Assorted Indian Sweets Box', 'assorted-indian-sweets-box', 'Mock description for Assorted Indian Sweets Box', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 280, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Assorted%20Indian%20Sweets%20Box', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'raksha-bandhan';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'chocolates-and-sweets';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Chocolate-Dipped Biscuit Pack', 'chocolate-dipped-biscuit-pack', 'Mock description for Chocolate-Dipped Biscuit Pack', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 120, 0.2)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Chocolate-Dipped%20Biscuit%20Pack', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'dry-fruits-and-nuts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Premium Mixed Dry Fruit Box', 'premium-mixed-dry-fruit-box', 'Mock description for Premium Mixed Dry Fruit Box', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 500, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Premium%20Mixed%20Dry%20Fruit%20Box', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'dry-fruits-and-nuts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Cashew Almond Gift Jar', 'cashew-almond-gift-jar', 'Mock description for Cashew Almond Gift Jar', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 350, 0.225)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Cashew%20Almond%20Gift%20Jar', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'dry-fruits-and-nuts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Roasted Pistachio Jar', 'roasted-pistachio-jar', 'Mock description for Roasted Pistachio Jar', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 400, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Roasted%20Pistachio%20Jar', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'fathers-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'dry-fruits-and-nuts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Premium Walnut Box', 'premium-walnut-box', 'Mock description for Premium Walnut Box', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 450, 0.275)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Premium%20Walnut%20Box', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'dry-fruits-and-nuts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Mixed Nut & Berry Jar', 'mixed-nut-berry-jar', 'Mock description for Mixed Nut & Berry Jar', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 300, 0.2)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Mixed%20Nut%20%26%20Berry%20Jar', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'mothers-day';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'self-care';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'dry-fruits-and-nuts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Honey-Coated Almond Jar', 'honey-coated-almond-jar', 'Mock description for Honey-Coated Almond Jar', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 350, 0.3)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Honey-Coated%20Almond%20Jar', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'candles-and-fragrance';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Vanilla Soy Scented Candle', 'vanilla-soy-scented-candle', 'Mock description for Vanilla Soy Scented Candle', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 150, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Vanilla%20Soy%20Scented%20Candle', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'candles-and-fragrance';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Rose Oud Scented Candle', 'rose-oud-scented-candle', 'Mock description for Rose Oud Scented Candle', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 225, 0.3)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Rose%20Oud%20Scented%20Candle', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'valentines-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'candles-and-fragrance';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Lavender Relaxation Candle', 'lavender-relaxation-candle', 'Mock description for Lavender Relaxation Candle', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 180, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Lavender%20Relaxation%20Candle', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'self-care';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'mothers-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'candles-and-fragrance';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Sandalwood Aroma Candle', 'sandalwood-aroma-candle', 'Mock description for Sandalwood Aroma Candle', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 200, 0.275)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Sandalwood%20Aroma%20Candle', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'candles-and-fragrance';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Jasmine Fragrance Candle', 'jasmine-fragrance-candle', 'Mock description for Jasmine Fragrance Candle', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 150, 0.2)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Jasmine%20Fragrance%20Candle', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'valentines-day';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'candles-and-fragrance';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Reed Diffuser Gift Set', 'reed-diffuser-gift-set', 'Mock description for Reed Diffuser Gift Set', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 350, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Reed%20Diffuser%20Gift%20Set', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'decor-and-festive';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Handcrafted Diya Set', 'handcrafted-diya-set', 'Mock description for Handcrafted Diya Set', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 100, 0.2)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Handcrafted%20Diya%20Set', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'decor-and-festive';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Brass Diya Pair', 'brass-diya-pair', 'Mock description for Brass Diya Pair', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 250, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Brass%20Diya%20Pair', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'decor-and-festive';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Festive Decorative Lantern', 'festive-decorative-lantern', 'Mock description for Festive Decorative Lantern', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 300, 0.3)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Festive%20Decorative%20Lantern', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'decor-and-festive';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Artificial Flower Bouquet', 'artificial-flower-bouquet', 'Mock description for Artificial Flower Bouquet', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 200, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Artificial%20Flower%20Bouquet', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'valentines-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'decor-and-festive';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Mini Floral Table Arrangement', 'mini-floral-table-arrangement', 'Mock description for Mini Floral Table Arrangement', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 250, 0.225)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Mini%20Floral%20Table%20Arrangement', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'mothers-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'decor-and-festive';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Decorative Rangoli Set', 'decorative-rangoli-set', 'Mock description for Decorative Rangoli Set', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 150, 0.2)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Decorative%20Rangoli%20Set', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'decor-and-festive';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Festive Tealight Holder Set', 'festive-tealight-holder-set', 'Mock description for Festive Tealight Holder Set', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 180, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Festive%20Tealight%20Holder%20Set', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'beverages';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Premium Green Tea Collection', 'premium-green-tea-collection', 'Mock description for Premium Green Tea Collection', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 250, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Premium%20Green%20Tea%20Collection', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'self-care';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'beverages';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Assorted Herbal Tea Box', 'assorted-herbal-tea-box', 'Mock description for Assorted Herbal Tea Box', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 200, 0.2)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Assorted%20Herbal%20Tea%20Box', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'mothers-day';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'beverages';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Gourmet Arabica Coffee Pack', 'gourmet-arabica-coffee-pack', 'Mock description for Gourmet Arabica Coffee Pack', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 300, 0.3)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Gourmet%20Arabica%20Coffee%20Pack', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'fathers-day';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'beverages';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Hot Chocolate Gift Tin', 'hot-chocolate-gift-tin', 'Mock description for Hot Chocolate Gift Tin', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 280, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Hot%20Chocolate%20Gift%20Tin', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'beverages';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Masala Chai Gift Box', 'masala-chai-gift-box', 'Mock description for Masala Chai Gift Box', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 150, 0.225)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Masala%20Chai%20Gift%20Box', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'personalized-gifts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Personalized Coffee Mug', 'personalized-coffee-mug', 'Mock description for Personalized Coffee Mug', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 150, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Personalized%20Coffee%20Mug', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'personalized-gifts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Personalized Photo Frame', 'personalized-photo-frame', 'Mock description for Personalized Photo Frame', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 250, 0.3)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Personalized%20Photo%20Frame', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'valentines-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'personalized-gifts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Personalized Name Keychain', 'personalized-name-keychain', 'Mock description for Personalized Name Keychain', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 100, 0.2)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Personalized%20Name%20Keychain', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'fathers-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'personalized-gifts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Inspirational Message Card', 'inspirational-message-card', 'Mock description for Inspirational Message Card', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 50, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Inspirational%20Message%20Card', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'mothers-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'personalized-gifts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Premium Anniversary Greeting Card', 'premium-anniversary-greeting-card', 'Mock description for Premium Anniversary Greeting Card', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 80, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Premium%20Anniversary%20Greeting%20Card', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'personalized-gifts';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Personalized Gift Tag Set', 'personalized-gift-tag-set', 'Mock description for Personalized Gift Tag Set', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 60, 0.2)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Personalized%20Gift%20Tag%20Set', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'self-care';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Lavender Bath & Body Set', 'lavender-bath-body-set', 'Mock description for Lavender Bath & Body Set', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 400, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Lavender%20Bath%20%26%20Body%20Set', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'mothers-day';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'self-care';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'self-care';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Rose Hand Cream Duo', 'rose-hand-cream-duo', 'Mock description for Rose Hand Cream Duo', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 250, 0.275)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Rose%20Hand%20Cream%20Duo', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'valentines-day';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'self-care';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Herbal Soap Collection', 'herbal-soap-collection', 'Mock description for Herbal Soap Collection', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 200, 0.2)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Herbal%20Soap%20Collection', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'self-care';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'self-care';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Relaxation Spa Gift Set', 'relaxation-spa-gift-set', 'Mock description for Relaxation Spa Gift Set', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 500, 0.3)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Relaxation%20Spa%20Gift%20Set', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'valentines-day';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'self-care';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'self-care';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Aromatherapy Bath Salt Jar', 'aromatherapy-bath-salt-jar', 'Mock description for Aromatherapy Bath Salt Jar', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 250, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Aromatherapy%20Bath%20Salt%20Jar', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'mothers-day';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'self-care';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'snacks-and-gourmet';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Gourmet Butter Cookie Box', 'gourmet-butter-cookie-box', 'Mock description for Gourmet Butter Cookie Box', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 180, 0.2)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Gourmet%20Butter%20Cookie%20Box', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'snacks-and-gourmet';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Premium Assorted Biscuit Tin', 'premium-assorted-biscuit-tin', 'Mock description for Premium Assorted Biscuit Tin', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 250, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Premium%20Assorted%20Biscuit%20Tin', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'snacks-and-gourmet';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Gourmet Trail Mix Pack', 'gourmet-trail-mix-pack', 'Mock description for Gourmet Trail Mix Pack', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 200, 0.225)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Gourmet%20Trail%20Mix%20Pack', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'fathers-day';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'self-care';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'snacks-and-gourmet';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Mini Gourmet Granola Jar', 'mini-gourmet-granola-jar', 'Mock description for Mini Gourmet Granola Jar', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 150, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Mini%20Gourmet%20Granola%20Jar', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'mothers-day';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'packaging';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Premium Rigid Gift Box', 'premium-rigid-gift-box', 'Mock description for Premium Rigid Gift Box', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 120, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Premium%20Rigid%20Gift%20Box', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'birthday';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'anniversary';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'packaging';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Woven Hamper Basket', 'woven-hamper-basket', 'Mock description for Woven Hamper Basket', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 200, 0.3)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Woven%20Hamper%20Basket', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'housewarming';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'valentines-day';
END $$;

DO $$
DECLARE
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM public.categories WHERE slug = 'packaging';

    INSERT INTO public.products (name, slug, description, category_id, stock_quantity, status)
    VALUES ('Premium Wooden Hamper Tray', 'premium-wooden-hamper-tray', 'Mock description for Premium Wooden Hamper Tray', v_category_id, 10, 'active')
    ON CONFLICT (slug) DO UPDATE 
    SET stock_quantity = 10, status = 'active', category_id = v_category_id
    RETURNING id INTO v_product_id;

    -- Upsert Pricing
    INSERT INTO public.product_pricing (product_id, cost_price, target_margin)
    VALUES (v_product_id, 300, 0.25)
    ON CONFLICT (product_id) DO UPDATE
    SET cost_price = EXCLUDED.cost_price, target_margin = EXCLUDED.target_margin;

    -- Upsert Image
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id) THEN
        INSERT INTO public.product_images (product_id, image_url, is_primary)
        VALUES (v_product_id, 'https://placehold.co/600x400/eeeeee/333333?text=Premium%20Wooden%20Hamper%20Tray', true);
    END IF;

    -- Upsert Occasions
    -- First delete existing to ensure clean state
    DELETE FROM public.product_occasions WHERE product_id = v_product_id;
    
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'corporate-gifting';
    INSERT INTO public.product_occasions (product_id, occasion_id)
    SELECT v_product_id, id FROM public.occasions WHERE slug = 'diwali';
END $$;
