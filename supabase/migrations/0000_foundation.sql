-- Foundation Schema for Hamperly

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE hamper_status AS ENUM ('draft', 'generated', 'purchased');

-- 3. TABLES

-- Admin Roles (extends auth.users implicitly by referencing auth.users id if we use Supabase Auth, but here we just create a lookup or mapping)
CREATE TABLE public.admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- references auth.users(id)
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Occasions
CREATE TABLE public.occasions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cost_price DECIMAL(10,2) NOT NULL,
    target_margin DECIMAL(5,2) NOT NULL DEFAULT 0.25, -- E.g. 0.25 for 25% margin
    selling_price DECIMAL(10,2) GENERATED ALWAYS AS (cost_price / (1 - target_margin)) STORED,
    stock_quantity INTEGER DEFAULT 0,
    status product_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product to Occasion mapping
CREATE TABLE public.product_occasions (
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    occasion_id UUID REFERENCES public.occasions(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, occasion_id)
);

-- Custom Hampers (User generated)
CREATE TABLE public.custom_hampers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- References auth.users(id), can be null for guest initially
    occasion_id UUID REFERENCES public.occasions(id),
    status hamper_status DEFAULT 'draft',
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Hamper Items
CREATE TABLE public.custom_hamper_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hamper_id UUID REFERENCES public.custom_hampers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL, -- Snapshot of price at the time
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Designs (Generated imagery)
CREATE TABLE public.ai_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hamper_id UUID REFERENCES public.custom_hampers(id) ON DELETE CASCADE,
    prompt_used TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS)

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_hampers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_hamper_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_designs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (To be expanded in future phases)

-- Public read access to active products, categories, occasions
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public can view active occasions" ON public.occasions FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Public can view product occasions" ON public.product_occasions FOR SELECT USING (true);

-- Users can view their own hampers
CREATE POLICY "Users can view their own hampers" ON public.custom_hampers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create hampers" ON public.custom_hampers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own draft hampers" ON public.custom_hampers FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Users can manage items in their hampers" ON public.custom_hamper_items FOR ALL USING (
    hamper_id IN (SELECT id FROM public.custom_hampers WHERE user_id = auth.uid())
);

-- Admins can do everything (Example policy utilizing admin_roles)
CREATE POLICY "Admins have full access to products" ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
);
