-- Phase 7: Prompt Generation, Review & Refinement
-- Extend ai_designs with prompt status tracking, negative prompt, and refinement data

ALTER TABLE public.ai_designs
    ADD COLUMN IF NOT EXISTS negative_prompt TEXT,
    ADD COLUMN IF NOT EXISTS prompt_status VARCHAR(50) DEFAULT 'GENERATED', -- GENERATED, VALIDATED, REFINED, FAILED
    ADD COLUMN IF NOT EXISTS refinement_request TEXT,
    ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;
