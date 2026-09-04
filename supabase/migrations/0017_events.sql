-- =============================================================
-- Events: sub-items under an Occasion, each with its own public page.
-- An Occasion (e.g. "Festivals") stays the only thing shown on the
-- homepage/occasions listing; its Events (e.g. "Diwali", "Holi") get
-- their own page, linked from the parent Occasion's page.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occasion_id   UUID NOT NULL REFERENCES public.occasions(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    description   TEXT,
    image_url     TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_occasion ON public.events(occasion_id);
CREATE INDEX IF NOT EXISTS idx_events_active   ON public.events(is_active);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active events" ON public.events;
CREATE POLICY "Public can view active events"
    ON public.events FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events"
    ON public.events FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
    );

-- Product <-> Event (many-to-many, mirrors product_occasions: one product
-- can be tagged to several events, e.g. a candle usable for both Diwali
-- and Christmas events)
CREATE TABLE IF NOT EXISTS public.product_events (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_product_events_event ON public.product_events(event_id);

ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view product events" ON public.product_events;
CREATE POLICY "Public can view product events"
    ON public.product_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product events" ON public.product_events;
CREATE POLICY "Admins can manage product events"
    ON public.product_events FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
    );

-- Hamper -> Event: single FK, mirroring hampers.occasion_id (a pre-made
-- hamper belongs to at most one event, same as it belongs to at most one
-- occasion today).
ALTER TABLE public.hampers
    ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hampers_event ON public.hampers(event_id);
