# Deployment Guidelines

## Netlify Environment Configuration

Hamperly is deployed on Netlify. The deployment process requires strict adherence to security configurations to prevent secrets from leaking into build artifacts.

### Build Artifact Rules

- **Ignored Directories:** The `.next/`, `.netlify/`, and any `.env.local` files must never be tracked in source control. They are strictly local build artifacts or local configuration files.
- **Generated Build Artifacts:** Next.js Turbopack generates `.next/cache` during local builds which may snapshot local environment variables. Do not deploy local caches to Netlify. Always ensure `.next` and `.netlify` are cleaned before testing deployment locally, or let Netlify's CI build them natively.

### Netlify Secret Scanning Exclusions

Netlify's Secret Scanner aggressively flags credentials in deployment artifacts to protect against accidental leaks. By design, Hamperly ships public credentials to the browser for Supabase connectivity.

Because Next.js embeds `NEXT_PUBLIC_` variables into `.next/static` browser bundles, Netlify's scanner will flag these as potential leaks. 

To resolve this false positive, configure the following environment variable in the **Netlify Dashboard > Site Configuration > Environment Variables**:

- **Key:** `SECRETS_SCAN_OMIT_KEYS`
- **Value:** `NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_APP_URL`

**CRITICAL WARNING:** NEVER exempt actual backend secrets such as `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, or `REPLICATE_API_TOKEN`. If these are flagged by the scanner, it means they have incorrectly leaked into the frontend bundle or build cache and must be investigated.
