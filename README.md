# The Pantry

A small household web app for tracking groceries, reducing food waste, recording kitchen equipment, and suggesting recipes that match both ingredients and tools.

## Stack

- Next.js and TypeScript
- Supabase Postgres and Auth
- Vercel for preview and production deployments
- GitHub Actions for application and database validation

The app can run without Supabase credentials in a clearly labeled prototype mode. Connected development can use either a local Supabase stack or a Supabase project you control. GitHub Actions recreates the database from migrations on a disposable runner.

## Local application setup

1. Install dependencies with `npm ci`.
2. Start the app with `npm run dev`.

To connect Supabase, copy `.env.example` to `.env.local` and add the URL and publishable key from a project you control. You can also run `supabase start` with Docker available; the local stack applies the committed migrations and prints the development URL and publishable key. Never put service-role keys, database passwords, or other secrets in `NEXT_PUBLIC_*` variables.

## Database workflow

All schema changes belong in `supabase/migrations`. Do not edit the production schema directly in the Supabase dashboard.

For normal development:

1. Add a migration locally.
2. Run `supabase db reset` against the local stack.
3. Push it to the maintainer staging project with the Supabase CLI when appropriate.
4. Open a pull request and let CI rebuild a clean database from every migration.
5. Test the Vercel preview.
6. Merge after the application, database, and deployment checks pass.

Production changes should remain backward-compatible so the old and new application versions can both operate while a deployment is in progress.

## Deployment

Vercel's GitHub integration creates preview deployments for branches and deploys `main` to production. GitHub Actions validates the application and reconstructs a disposable local database; it does not receive production secrets or modify hosted Supabase projects. Hosted database migrations remain an explicit maintainer release step.

## Commands

- `npm run dev` — start local Next.js development
- `npm run lint` — check source quality
- `npm test` — run unit tests
- `npm run build` — create a production build
- `npm run check` — run all application checks

## License

The Pantry is available under the [MIT License](LICENSE). Forks are welcome; upstream development is currently maintainer-led.

## Current milestone

The first product slice includes the responsive dashboard, inventory search/filter/sort, suggested categories and expiration dates with overrides, consumption/removal actions, equipment tracking, and equipment-aware recipe matching. Magic-link authentication and household-scoped live Supabase queries (backed by RLS) are now connected; the app falls back to clearly labeled prototype mode with in-memory data whenever Supabase environment variables are absent.
