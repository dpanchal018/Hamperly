-- Seed File for Hamperly Development

-- IMPORTANT: This script assumes you have at least one user in auth.users.
-- Since we are testing logic, we'll insert some mock categories, occasions, and products.
-- This script does NOT insert into auth.users as that requires Supabase internals, 
-- but it does insert into the public tables.

-- Clear existing seed data (if any)
TRUNCATE TABLE public.product_occasions CASCADE;
TRUNCATE TABLE public.product_pricing CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.occasions CASCADE;
TRUNCATE TABLE public.categories CASCADE;

-- Insert Occasions
INSERT INTO public.occasions (id, name, slug, description, is_active, display_order) VALUES
('11111111-1111-1111-1111-111111111111', 'Diwali', 'diwali', 'Festival of Lights', true, 1),
('22222222-2222-2222-2222-222222222222', 'Birthday', 'birthday', 'Celebrate another year', true, 2),
('33333333-3333-3333-3333-333333333333', 'Anniversary', 'anniversary', 'Celebrate your special day', true, 3);

-- Insert Categories
INSERT INTO public.categories (id, name, slug, description, display_order) VALUES
('44444444-4444-4444-4444-444444444444', 'Chocolates', 'chocolates', 'Premium chocolates', 1),
('55555555-5555-5555-5555-555555555555', 'Dry Fruits', 'dry-fruits', 'Healthy and delicious', 2),
('66666666-6666-6666-6666-666666666666', 'Candles', 'candles', 'Scented and decorative', 3);

-- Insert Products
INSERT INTO public.products (id, category_id, name, slug, description, stock_quantity, status, selling_price) VALUES
('77777777-7777-7777-7777-777777777771', '44444444-4444-4444-4444-444444444444', 'Premium Chocolate Box', 'premium-chocolate-box', 'Assorted chocolates', 50, 'active', 400),
('77777777-7777-7777-7777-777777777772', '55555555-5555-5555-5555-555555555555', 'Assorted Dry Fruits', 'assorted-dry-fruits', 'Premium almonds and cashews', 100, 'active', 800),
('77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666666', 'Scented Candle', 'scented-candle', 'Lavender aroma', 20, 'active', 200);

-- Insert Pricing (Admin only)
-- cost_price = 300, target_margin = 0.25 => selling_price = 400
INSERT INTO public.product_pricing (product_id, cost_price, target_margin) VALUES
('77777777-7777-7777-7777-777777777771', 300.00, 0.25), 
-- cost_price = 640, target_margin = 0.20 => selling_price = 800
('77777777-7777-7777-7777-777777777772', 640.00, 0.20),
-- cost_price = 100, target_margin = 0.50 => selling_price = 200
('77777777-7777-7777-7777-777777777773', 100.00, 0.50);

-- Product Occasions (Mapping)
INSERT INTO public.product_occasions (product_id, occasion_id) VALUES
('77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111'), -- Chocolate for Diwali
('77777777-7777-7777-7777-777777777771', '22222222-2222-2222-2222-222222222222'), -- Chocolate for Birthday
('77777777-7777-7777-7777-777777777772', '11111111-1111-1111-1111-111111111111'), -- Dry Fruits for Diwali
('77777777-7777-7777-7777-777777777773', '11111111-1111-1111-1111-111111111111'); -- Candle for Diwali
