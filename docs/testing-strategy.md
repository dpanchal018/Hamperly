# Testing Strategy

Hamperly employs a multi-layered testing strategy combining Unit, Security, E2E, and Integration tests.

## Security & API Contract Tests
- `tests/security/` validates that Server Actions actively reject unauthenticated or non-admin users.
- Customer-safe API structures are explicitly validated via unit tests to ensure no internal pricing data is leaked from the database.

## Integration & Seed Validation
- `tests/integration/` validates the exact authoritative state of the database after running `0003_phase2a_seed.sql`.
- These tests assert exact product counts (50), stock aggregations (500), referential integrity of occasions/categories, and pricing calculations.

## Run Commands
- `npm run test:unit` (Runs all Vitest suites)
- `npm run test:e2e` (Runs Playwright journeys - Requires running local server)
