-- Courier / delivery tracking reference shown on the customer's invoice.
-- Entered by an admin once the order is dispatched; NULL until then.
ALTER TABLE public.purchases
    ADD COLUMN IF NOT EXISTS delivery_tracking_id VARCHAR(100);
