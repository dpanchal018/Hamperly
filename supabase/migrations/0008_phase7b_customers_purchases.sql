CREATE TYPE purchase_status_enum AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID');
CREATE TYPE payment_mode_enum AS ENUM ('CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'OTHER');
CREATE TYPE sale_source_enum AS ENUM ('WEBSITE', 'EXHIBITION', 'WALK_IN', 'WHATSAPP', 'PHONE', 'OTHER');

CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_reference VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(50),
    email VARCHAR(255),
    city VARCHAR(100),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_mobile ON public.customers(mobile_number);
CREATE INDEX idx_customers_email ON public.customers(email);

CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    hamper_id UUID,
    occasion_id UUID REFERENCES public.occasions(id) ON DELETE SET NULL,
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sale_source sale_source_enum NOT NULL DEFAULT 'OTHER',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_due DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_mode payment_mode_enum,
    payment_status payment_status_enum NOT NULL DEFAULT 'PENDING',
    payment_reference VARCHAR(255),
    status purchase_status_enum NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_customer_id ON public.purchases(customer_id);
CREATE INDEX idx_purchases_date ON public.purchases(purchase_date);
CREATE INDEX idx_purchases_status ON public.purchases(status);

CREATE TABLE public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    category_snapshot VARCHAR(255),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    catalog_unit_price DECIMAL(10,2) NOT NULL,
    actual_unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_items_purchase_id ON public.purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product_id ON public.purchase_items(product_id);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on customers" ON public.customers FOR ALL TO authenticated USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'ADMIN' );
CREATE POLICY "Admins can do everything on purchases" ON public.purchases FOR ALL TO authenticated USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'ADMIN' );
CREATE POLICY "Admins can do everything on purchase_items" ON public.purchase_items FOR ALL TO authenticated USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'ADMIN' );

CREATE POLICY "Service role can do everything on customers" ON public.customers FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything on purchases" ON public.purchases FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything on purchase_items" ON public.purchase_items FOR ALL TO service_role USING (true);
