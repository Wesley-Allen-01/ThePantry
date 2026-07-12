# The Pantry

A small household web app for tracking groceries, reducing food waste, recording kitchen equipment, and suggesting recipes that match both ingredients and tools.

## Stack

- Next.js and TypeScript
- Supabase Postgres and Auth
- Vercel for preview and production deployments
- GitHub Actions for application and database validation

The daily development workflow does not require containers on your Mac. Local application development can use the hosted staging Supabase project; GitHub Actions recreates the database from migrations on a disposable runner.

## Local application setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add the URL and publishable key from the staging Supabase project.
4. Start the app with `npm run dev`.

Until Supabase credentials are configured, the UI opens in clearly labeled prototype mode with realistic in-memory data.

## Database workflow

All schema changes belong in `supabase/migrations`. Do not edit the production schema directly in the Supabase dashboard.

For normal development:

1. Add a migration locally.
2. Push it to the staging project with the Supabase CLI.
3. Open a pull request and let CI rebuild a clean database from every migration.
4. Test the Vercel preview.
5. Merge after the application and database checks pass.

Production changes should remain backward-compatible so the old and new application versions can both operate while a deployment is in progress.

## Commands

- `npm run dev` — start local Next.js development
- `npm run lint` — check source quality
- `npm test` — run unit tests
- `npm run build` — create a production build
- `npm run check` — run all application checks

## Current milestone

The first product slice includes the responsive dashboard, inventory search/filter/sort, suggested categories and expiration dates with overrides, consumption/removal actions, equipment tracking, and equipment-aware recipe matching. Magic-link authentication and household-scoped live Supabase queries (backed by RLS) are now connected; the app falls back to clearly labeled prototype mode with in-memory data whenever Supabase environment variables are absent.
