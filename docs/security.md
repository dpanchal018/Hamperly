# Security Guidelines

- **Roles:** Strong typing using `user_role_enum` mapping UUIDs in `user_roles`. Default role `CUSTOMER` assigned via DB trigger.
- **Row Level Security (RLS):** Enabled on all core tables.
- **Pricing Data Protection:** `cost_price` and `target_margin` are fully separated into `product_pricing` table to guarantee they are never exposed in standard product catalog queries. `product_pricing` is protected by an Admin-only RLS policy.
- **Hamper Protection:** Users can only view, create, and manage items for their *own* hampers.
- **Catalog Security:** Active categories, occasions, and products are readable by the public. Mutations require Admin privileges.
