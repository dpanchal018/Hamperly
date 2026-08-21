# Security Guidelines

- **Roles:** Strong typing using `user_role_enum` mapping UUIDs in `user_roles`. Default role `CUSTOMER` assigned via DB trigger.
- **Row Level Security (RLS):** Enabled on all core tables.
- **Pricing Data Protection:** `cost_price` and `target_margin` are fully separated into `product_pricing` table to guarantee they are never exposed in standard product catalog queries. `product_pricing` is protected by an Admin-only RLS policy.
- **Hamper Protection:** Users can only view, create, and manage items for their *own* hampers.
- **Catalog Security:** Active categories, occasions, and products are readable by the public. Mutations require Admin privileges.

## Secrets Management & Environment Variables

- **Public Variables:** Only environment variables safe for browser exposure should be prefixed with `NEXT_PUBLIC_`. This includes:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Server-Only Secrets:** Critical API keys must NEVER be prefixed with `NEXT_PUBLIC_` and must be accessed securely via `process.env` in server actions or server components.
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GOOGLE_GENERATIVE_AI_API_KEY`
  - `REPLICATE_API_TOKEN`
- **.env.example Rules:** The `.env.example` file must contain only placeholders (e.g., `your-google-api-key`). It must never contain actual credentials.
- **Secret Rotation:** Any secrets that inadvertently leak into version control or public build artifacts must be immediately marked for rotation and replaced.
