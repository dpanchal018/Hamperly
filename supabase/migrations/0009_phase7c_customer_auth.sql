-- Phase 7C: Customer Auth & RLS

-- 1. Add user_id to customers table
ALTER TABLE public.customers
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_customers_user_id ON public.customers(user_id) WHERE user_id IS NOT NULL;

-- 3. RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY "Admins can manage all customers"
ON public.customers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- Customers can read their own profile
CREATE POLICY "Customers can view own profile"
ON public.customers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Customers can update their own profile
CREATE POLICY "Customers can update own profile"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- 4. RLS for purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all purchases"
ON public.purchases
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Customers can view own purchases"
ON public.purchases
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

-- 5. RLS for purchase_items
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all purchase_items"
ON public.purchase_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Customers can view own purchase_items"
ON public.purchase_items
FOR SELECT
TO authenticated
USING (
  purchase_id IN (
    SELECT p.id FROM public.purchases p
    JOIN public.customers c ON p.customer_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- 6. RLS for payment_logs
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all payment_logs"
ON public.payment_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Customers can view own payment_logs"
ON public.payment_logs
FOR SELECT
TO authenticated
USING (
  purchase_id IN (
    SELECT p.id FROM public.purchases p
    JOIN public.customers c ON p.customer_id = c.id
    WHERE c.user_id = auth.uid()
  )
);
