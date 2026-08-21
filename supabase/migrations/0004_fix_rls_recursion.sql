-- Fix infinite recursion in user_roles policy
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;

-- Create a SECURITY DEFINER function to bypass RLS when checking admin status
-- This prevents the infinite recursion when a policy queries user_roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'ADMIN'
  );
END;
$$;

-- Replace the recursive policy with one that uses the security definer function
CREATE POLICY "Admins can read all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin());

-- Also update all other policies that directly query user_roles to use the helper function
-- This improves performance by avoiding recursive RLS evaluation on user_roles

-- Products
DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products" ON public.products FOR ALL USING (public.is_admin());

-- Categories
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
CREATE POLICY "Admins have full access to categories" ON public.categories FOR ALL USING (public.is_admin());

-- Occasions
DROP POLICY IF EXISTS "Admins have full access to occasions" ON public.occasions;
CREATE POLICY "Admins have full access to occasions" ON public.occasions FOR ALL USING (public.is_admin());

-- Product Images
DROP POLICY IF EXISTS "Admin Write Access: Only admins can upload, update, or delete product images" ON storage.objects;
CREATE POLICY "Admin Write Access: Only admins can upload, update, or delete product images"
ON storage.objects FOR ALL
USING (
    bucket_id = 'product-images' AND 
    public.is_admin()
)
WITH CHECK (
    bucket_id = 'product-images' AND 
    public.is_admin()
);

-- And the others from storage that used the old exists query
DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;

-- Product Pricing
DROP POLICY IF EXISTS "Admins can manage pricing" ON public.product_pricing;
CREATE POLICY "Admins can manage pricing" ON public.product_pricing FOR ALL USING (public.is_admin());
