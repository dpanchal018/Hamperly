-- Phase 1 Schema Adjustments

-- 1. ENUMS
CREATE TYPE user_role_enum AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE ai_generation_status AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'REJECTED');
CREATE TYPE ai_validation_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 2. ROLES
-- Drop the old admin_roles table and replace it with a comprehensive user_roles table
DROP TABLE IF EXISTS public.admin_roles CASCADE;

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE, -- references auth.users(id)
    role user_role_enum NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically assign CUSTOMER role on new auth user creation
-- (Note: In a real Supabase environment, this relies on auth.users which is in the auth schema)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'CUSTOMER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We comment out the trigger binding here so it doesn't fail if auth.users doesn't exist locally,
-- but this is the SQL you would run on Supabase:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. SLUGS & SCHEMA ENHANCEMENTS
ALTER TABLE public.categories ADD COLUMN slug VARCHAR(255) UNIQUE;
ALTER TABLE public.categories ADD COLUMN display_order INTEGER DEFAULT 0;

ALTER TABLE public.occasions ADD COLUMN slug VARCHAR(255) UNIQUE;
ALTER TABLE public.occasions ADD COLUMN display_order INTEGER DEFAULT 0;

ALTER TABLE public.products ADD COLUMN slug VARCHAR(255) UNIQUE;

-- 4. SECURE PRICING SEPARATION
-- We remove internal pricing from the public-facing products table
ALTER TABLE public.products DROP COLUMN selling_price;
ALTER TABLE public.products DROP COLUMN cost_price;
ALTER TABLE public.products DROP COLUMN target_margin;

-- Selling price is added back as a normal column, to be updated by triggers from product_pricing
ALTER TABLE public.products ADD COLUMN selling_price DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE TABLE public.product_pricing (
    product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    cost_price DECIMAL(10,2) NOT NULL,
    target_margin DECIMAL(5,2) NOT NULL DEFAULT 0.25,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_margin CHECK (target_margin >= 0 AND target_margin < 1)
);

-- Trigger to recalculate selling_price on products when product_pricing changes
CREATE OR REPLACE FUNCTION public.update_product_selling_price()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET selling_price = (NEW.cost_price / (1 - NEW.target_margin)),
      updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_product_pricing_changed
  AFTER INSERT OR UPDATE ON public.product_pricing
  FOR EACH ROW EXECUTE PROCEDURE public.update_product_selling_price();


-- 5. HAMPERS ENHANCEMENTS
ALTER TABLE public.custom_hampers 
    ADD COLUMN theme VARCHAR(255),
    ADD COLUMN color_preference VARCHAR(255),
    ADD COLUMN packaging_preference VARCHAR(255),
    ADD COLUMN recipient_type VARCHAR(255),
    ADD COLUMN custom_message TEXT;

ALTER TABLE public.ai_designs
    ADD COLUMN generation_status ai_generation_status DEFAULT 'PENDING',
    ADD COLUMN validation_status ai_validation_status DEFAULT 'PENDING';


-- 6. ROW LEVEL SECURITY (RLS) UPDATES

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing ENABLE ROW LEVEL SECURITY;

-- user_roles RLS
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- product_pricing RLS (STRICT ADMIN ONLY)
CREATE POLICY "Admins can manage pricing" ON public.product_pricing FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- Drop old product RLS and update for the new user_roles table
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;

CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Admins have full access to products" ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- Apply similar admin policies to categories and occasions for completeness
CREATE POLICY "Admins have full access to categories" ON public.categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins have full access to occasions" ON public.occasions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);
