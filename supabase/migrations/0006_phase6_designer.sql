-- Phase 6: Hamper Designer
-- Extend ai_designs with structured outputs and status tracking

ALTER TABLE public.ai_designs
    ADD COLUMN IF NOT EXISTS design_version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS input_metadata JSONB,
    ADD COLUMN IF NOT EXISTS design_specification JSONB,
    ADD COLUMN IF NOT EXISTS warnings JSONB;
