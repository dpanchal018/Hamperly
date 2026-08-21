# Database Schema

This document describes the schema for the Hamperly platform.

## Tables
- `user_roles`: Manages application roles (CUSTOMER, ADMIN) for authenticated users.
- `categories`: Product categories (with unique slug).
- `occasions`: Occasions (with unique slug).
- `products`: Publicly accessible product catalog (cost_price and target_margin removed for security).
- `product_pricing`: STRICTLY Admin-only table containing internal costs and margins for products.
- `product_images`: Images mapping to products.
- `product_occasions`: Many-to-many relationship mapping products to occasions.
- `custom_hampers`: User-generated personalized hampers. Includes preferences (theme, color, packaging) and total price.
- `custom_hamper_items`: Snapshots of products inside a hamper with authoritative unit price.
- `ai_designs`: AI generated hamper imagery mapped to custom hampers.

## Development Seed Data (Phase 2A)
- The development database contains a realistic mock catalog of **50 products** spanning 9 categories and 10 occasions.
- The seed script (`0003_phase2a_seed.sql`) uses idempotent `INSERT ... ON CONFLICT` statements relying on unique slugs. This allows the script to be safely rerun without duplicating categories, occasions, or products.
- **Future Excel Compatibility**: The seed fields (Name, Slug, Description, Category, Occasions, Cost Price, Target Margin, Stock Quantity, Active Status, Image URL) identically match the required columns for future CSV/Excel import tools.

## Cloud Database
The database is hosted on Supabase Cloud. Local Docker is no longer required. Migrations should be pushed using `npx supabase db push --db-url <connection-string>`.
