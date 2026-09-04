-- =============================================================
-- Phase 1: Modular Catalog Architecture Migration
-- =============================================================
-- This migration is NON-DESTRUCTIVE. It only ADDS new columns,
-- tables, indexes, and constraints. No existing data is altered.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- PART 1: LOOKUP TABLES (replacing future ENUMs for zero-code Admin extensibility)
-- ─────────────────────────────────────────────────────────────

-- Gender lookup (MALE, FEMALE, UNISEX, KIDS — but Admin can add more)
CREATE TABLE IF NOT EXISTS public.genders (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE  -- e.g. 'MALE', 'FEMALE', 'UNISEX', 'KIDS'
);

INSERT INTO public.genders (name) VALUES
    ('MALE'), ('FEMALE'), ('UNISEX'), ('KIDS')
ON CONFLICT (name) DO NOTHING;

-- Recipient Tags lookup (Admin-managed list, e.g. 'Wife', 'Mother', 'Boss')
CREATE TABLE IF NOT EXISTS public.recipient_tags (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO public.recipient_tags (name) VALUES
    ('Wife'), ('Husband'), ('Mother'), ('Father'),
    ('Sister'), ('Brother'), ('Friend'), ('Girlfriend'),
    ('Boyfriend'), ('Daughter'), ('Son'), ('Colleague'),
    ('Boss'), ('Employee'), ('Client'), ('Baby'), ('Kids'),
    ('Bride'), ('Groom'), ('Bridesmaid'), ('Groomsman')
ON CONFLICT (name) DO NOTHING;

-- Packaging Types lookup (e.g. 'Base Box', 'Potli', 'Basket')
CREATE TABLE IF NOT EXISTS public.packaging_types (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO public.packaging_types (name) VALUES
    ('Base Box'), ('Premium Box'), ('Potli'), ('Basket'),
    ('Tote Bag'), ('Gift Bag'), ('Kraft Box'), ('Transparent Box')
ON CONFLICT (name) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- PART 2: OCCASIONS — Add hierarchy support (parent_id)
-- ─────────────────────────────────────────────────────────────

-- Self-referencing parent_id for sub-occasions (e.g. Wedding > Mehendi)
ALTER TABLE public.occasions
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.occasions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS occasion_type TEXT DEFAULT 'GENERAL';
    -- occasion_type: FESTIVAL | CORPORATE | WEDDING | BIRTHDAY | ANNIVERSARY | BABY_SHOWER | JUST_BECAUSE | GENERAL

-- Index for efficient tree queries
CREATE INDEX IF NOT EXISTS idx_occasions_parent_id ON public.occasions(parent_id);


-- ─────────────────────────────────────────────────────────────
-- PART 3: PRODUCTS — Add rich metadata columns
-- ─────────────────────────────────────────────────────────────

-- SKU: unique product identifier, protected against duplication
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS sku               TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS gender_id         INTEGER REFERENCES public.genders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_customizable   BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS min_quantity      INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS weight_grams      INTEGER,
    ADD COLUMN IF NOT EXISTS dimensions_cm     TEXT,  -- stored as 'LxWxH' string for simplicity
    ADD COLUMN IF NOT EXISTS tags              TEXT[]; -- free-form search tags array

-- NULL stock_quantity = Unlimited (existing behavior preserved)
-- A CHECK constraint to prevent negative stock at DB level
ALTER TABLE public.products
    DROP CONSTRAINT IF EXISTS products_stock_not_negative;

ALTER TABLE public.products
    ADD CONSTRAINT products_stock_not_negative
    CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

-- Index for active product lookups (most common storefront query)
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_gender ON public.products(gender_id);


-- ─────────────────────────────────────────────────────────────
-- PART 4: PRODUCT ↔ RECIPIENT TAG  (Many-to-Many)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_recipient_tags (
    product_id        UUID    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    recipient_tag_id  INTEGER NOT NULL REFERENCES public.recipient_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, recipient_tag_id)
);

ALTER TABLE public.product_recipient_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product recipient tags"
    ON public.product_recipient_tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage product recipient tags"
    ON public.product_recipient_tags FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
    );

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_product_recipient_tags_tag
    ON public.product_recipient_tags(recipient_tag_id);


-- ─────────────────────────────────────────────────────────────
-- PART 5: HAMPERS — Add occasion link, packaging, stock guard
-- ─────────────────────────────────────────────────────────────

-- Link pre-made hampers to an occasion and a packaging type
ALTER TABLE public.hampers
    ADD COLUMN IF NOT EXISTS description       TEXT,
    ADD COLUMN IF NOT EXISTS image_url         TEXT,
    ADD COLUMN IF NOT EXISTS occasion_id       UUID REFERENCES public.occasions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS packaging_type_id INTEGER REFERENCES public.packaging_types(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS gender_id         INTEGER REFERENCES public.genders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS slug              TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS tags              TEXT[];

-- NULL stock_quantity = Unlimited for pre-made hampers too
-- A CHECK constraint to prevent negative stock at DB level
ALTER TABLE public.hampers
    DROP CONSTRAINT IF EXISTS hampers_stock_not_negative;

ALTER TABLE public.hampers
    ADD CONSTRAINT hampers_stock_not_negative
    CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

-- Index for fast active-hamper queries
CREATE INDEX IF NOT EXISTS idx_hampers_occasion ON public.hampers(occasion_id);
CREATE INDEX IF NOT EXISTS idx_hampers_active    ON public.hampers(is_active);


-- ─────────────────────────────────────────────────────────────
-- PART 6: HAMPER_ITEMS — Recipe junction table (Pre-made Hamper ↔ Master Products)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hamper_items (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    hamper_id     UUID    NOT NULL REFERENCES public.hampers(id) ON DELETE CASCADE,
    product_id    UUID    NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    -- RESTRICT prevents deleting a product if it's actively used in a hamper recipe
    quantity      INTEGER NOT NULL DEFAULT 1,
    is_required   BOOLEAN NOT NULL DEFAULT true,   -- can the customer remove this item?
    min_qty       INTEGER NOT NULL DEFAULT 1,       -- minimum allowed quantity of this item
    max_qty       INTEGER,                          -- NULL = no upper limit
    sort_order    INTEGER NOT NULL DEFAULT 0,       -- display order in "What's Inside"
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hamper_id, product_id)
    -- One product appears once per hamper recipe; use quantity column for multiples
);

ALTER TABLE public.hamper_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view hamper items"
    ON public.hamper_items FOR SELECT USING (true);

CREATE POLICY "Admins can manage hamper items"
    ON public.hamper_items FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
    );

-- Indexes for recipe lookups and "which hampers use product X?" queries
CREATE INDEX IF NOT EXISTS idx_hamper_items_hamper   ON public.hamper_items(hamper_id);
CREATE INDEX IF NOT EXISTS idx_hamper_items_product  ON public.hamper_items(product_id);

-- Constraint: min_qty must be <= max_qty when max_qty is set
ALTER TABLE public.hamper_items
    ADD CONSTRAINT hamper_items_qty_range
    CHECK (max_qty IS NULL OR max_qty >= min_qty);


-- ─────────────────────────────────────────────────────────────
-- PART 7: HAMPER ↔ RECIPIENT TAG  (Many-to-Many)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hamper_recipient_tags (
    hamper_id         UUID    NOT NULL REFERENCES public.hampers(id) ON DELETE CASCADE,
    recipient_tag_id  INTEGER NOT NULL REFERENCES public.recipient_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (hamper_id, recipient_tag_id)
);

ALTER TABLE public.hamper_recipient_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view hamper recipient tags"
    ON public.hamper_recipient_tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage hamper recipient tags"
    ON public.hamper_recipient_tags FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
    );

CREATE INDEX IF NOT EXISTS idx_hamper_recipient_tags_tag
    ON public.hamper_recipient_tags(recipient_tag_id);


-- ─────────────────────────────────────────────────────────────
-- PART 8: PURCHASE_ITEMS — Snapshot column for immutable order history
-- ─────────────────────────────────────────────────────────────

-- Add a JSONB snapshot column that freezes the exact state of every ordered item
ALTER TABLE public.purchase_items
    ADD COLUMN IF NOT EXISTS item_type        TEXT NOT NULL DEFAULT 'PRE_MADE',
    -- item_type: 'PRE_MADE' | 'CUSTOM' | 'STANDALONE_PRODUCT'
    ADD COLUMN IF NOT EXISTS hamper_id        UUID REFERENCES public.hampers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS item_snapshot    JSONB;
    -- item_snapshot stores: { name, sku, price_paid, recipe: [...], customizations: {...} }


-- ─────────────────────────────────────────────────────────────
-- PART 9: UPDATED_AT TRIGGERS for new tables
-- ─────────────────────────────────────────────────────────────

-- Reuse the generic updated_at trigger pattern if it exists, otherwise create it
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- (hamper_items has no updated_at by design — it's an append-only recipe ledger)


-- ─────────────────────────────────────────────────────────────
-- PART 10: COMMENTS for documentation in Supabase Studio
-- ─────────────────────────────────────────────────────────────

COMMENT ON TABLE public.hamper_items          IS 'Recipe junction: maps master products into pre-made hamper bundles. quantity column handles multiples.';
COMMENT ON TABLE public.product_recipient_tags IS 'Many-to-many: which recipient types a product suits (Wife, Boss, Kids, etc.)';
COMMENT ON TABLE public.hamper_recipient_tags  IS 'Many-to-many: which recipient types a pre-made hamper suits.';
COMMENT ON TABLE public.recipient_tags         IS 'Admin-managed lookup list of recipient types. Add rows here without code changes.';
COMMENT ON TABLE public.packaging_types        IS 'Admin-managed lookup list of packaging options (Box, Potli, Basket, etc.).';
COMMENT ON COLUMN public.products.stock_quantity IS 'NULL = unlimited stock. 0 = out of stock. Positive integer = available quantity.';
COMMENT ON COLUMN public.hampers.stock_quantity  IS 'NULL = unlimited pre-made stock. Tracks assembled boxes, independent from product pool.';
COMMENT ON COLUMN public.purchase_items.item_snapshot IS 'Immutable JSON snapshot of item state at time of purchase. Never changes post-order.';
