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

- **Supabase Client/Server Architecture**: The frontend uses a public anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) for browser-side authenticated queries protected by Row Level Security (RLS). Privileged backend tasks utilize the `SUPABASE_SERVICE_ROLE_KEY` inside protected Server Actions, completely isolated from the browser.

## AI Architecture
- **Gemini Server-Side Architecture**: Hamperly integrates Google Gemini for AI-driven prompt generation. The `GOOGLE_GENERATIVE_AI_API_KEY` is strictly confined to the backend. Client components send requests to Next.js Server Actions, which then invoke the Gemini SDK using the protected key. The browser never receives the API key.
- **Replicate Server-Side Architecture**: Similarly, the `REPLICATE_API_TOKEN` (used for image generation) is restricted to server-side execution only and is never exposed in client bundles.
