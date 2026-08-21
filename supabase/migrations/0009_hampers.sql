CREATE TABLE IF NOT EXISTS public.hampers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    actual_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.hampers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on active hampers" ON public.hampers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin full access on hampers" ON public.hampers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

INSERT INTO public.hampers (name, stock_quantity, selling_price, actual_cost) VALUES
('Glass Boys Hamper', 8, 129, 90),
('Glass Stationery Hamper', 8, 129, 90),
('Glass Straw Hamper', 8, 169, 110),
('Bow Boys Hamper', 8, 179, 80),
('Bow Girls Hamper', 8, 179, 110),
('Snacks Hamper', 8, 429, 280),
('Golden Girls Hamper', 8, 449, 290),
('Golden Boys Hamper', 8, 199, 118),
('Dry Fruits Hamper', 8, 749, 589),
('White Box DIY Jar', 8, 849, 661),
('White Box White Tumbler + Dark Chocolate', 8, 849, 629),
('White Box DIY Tumbler + Mug', 8, 749, 424),
('Yellow Green Girls Hamper', 8, 799, 490),
('White Box Evil Eye', 8, 999, 762),
('Pink Hamper', 8, 649, 500),
('Kids PVC Bag White & Blue Tumbler', 8, 499, 385),
('PVC Girls Bag Dark Fantasy', 8, 649, 485),
('Blue Coffee Hamper', 8, 699, 510);
