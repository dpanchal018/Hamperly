-- Phase 5: Personalization
-- Add ribbon_preference to custom_hampers to complete the personalization payload fields

ALTER TABLE public.custom_hampers 
    ADD COLUMN IF NOT EXISTS ribbon_preference VARCHAR(255);
