-- Migration: Create site_content table

CREATE TABLE IF NOT EXISTS site_content (
  section_id TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default header content
INSERT INTO site_content (section_id, content) 
VALUES (
  'header', 
  '{
    "logoText": "Hamperly",
    "navLinks": [
      { "name": "Shop", "href": "/products" },
      { "name": "Occasions", "href": "/occasions" },
      { "name": "Hampers", "href": "/hampers" },
      { "name": "Exhibitions", "href": "/exhibitions" }
    ]
  }'::jsonb
) ON CONFLICT (section_id) DO NOTHING;

-- Insert default footer content
INSERT INTO site_content (section_id, content) 
VALUES (
  'footer', 
  '{
    "logoText": "Hamperly",
    "description": "Curating beautiful, personalized gifts for every special moment. Handcrafted with love and delivered with care.",
    "socialLinks": [
      { "platform": "IG", "url": "#" },
      { "platform": "FB", "url": "#" },
      { "platform": "X", "url": "#" }
    ],
    "columns": [
      {
        "title": "Shop",
        "links": [
          { "name": "Build a Hamper", "href": "/products" },
          { "name": "Pre-made Hampers", "href": "/hampers" },
          { "name": "Shop by Occasion", "href": "/occasions" },
          { "name": "Exhibitions", "href": "/exhibitions" }
        ]
      },
      {
        "title": "Information",
        "links": [
          { "name": "About Us", "href": "/about" },
          { "name": "Contact", "href": "/contact" },
          { "name": "Shipping & Returns", "href": "/shipping" },
          { "name": "FAQ", "href": "/faq" }
        ]
      }
    ]
  }'::jsonb
) ON CONFLICT (section_id) DO NOTHING;

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Site content is readable by everyone" 
  ON site_content FOR SELECT 
  USING (true);

-- Admin update access
CREATE POLICY "Admins can update site content" 
  ON site_content FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );
