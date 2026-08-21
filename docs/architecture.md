# Architecture Overview

## Frontend
- Next.js 16.3 App Router
- React Server Components for data fetching (e.g., Admin Dashboard, List pages).
- Client Components for interactive forms (e.g., `ProductForm` with `react-hook-form` + `zod`).
- **Admin Portal**: Secured under `/admin`, strictly server-side rendered requiring `ADMIN` role.

## Backend / APIs
- Supabase (PostgreSQL, Auth, Storage).
- Server Actions (`src/actions/*`) execute mutations server-side with zero client exposure of secure logic.

## Security
- Pricing fields (`cost_price`, `target_margin`) are completely decoupled into `product_pricing` and exposed *only* to the Admin UI via explicit service/action calls.
- Server Actions validate input using `zod` and explicitly check `requireAdmin()`.
- Supabase Storage `product-images` bucket is protected by RLS (Admin write, Public read).

## Supabase Cloud Architecture
As of Phase 2B, Hamperly uses Supabase Cloud for its backend, removing the runtime dependency on local Docker/Supabase containers. The application communicates directly with Supabase Cloud for Database, Auth, and Storage.
