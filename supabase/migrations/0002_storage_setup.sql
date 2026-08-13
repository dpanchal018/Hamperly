-- Phase 2: Setup Storage Bucket for Product Images

-- 1. Create the bucket if it doesn't exist (Supabase specific syntax for the storage schema)
-- Note: Supabase's `storage` schema manages buckets and objects.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies

-- Public Read Access: Anyone can view product images
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- Admin Write Access: Only admins can upload, update, or delete product images
CREATE POLICY "Admin Write Access" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'product-images' AND 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'product-images' AND 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'product-images' AND 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);
