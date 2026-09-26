# StreamVerse

> A modern, full-stack OTT/VOD streaming platform — built from scratch as a real, deployable application with a real backend, real database, real authentication, real video player, and a real admin dashboard. Not a mock. Not a static demo.

![tech](https://img.shields.io/badge/Next.js-16-black) ![ts](https://img.shields.io/badge/TypeScript-5-blue) ![prisma](https://img.shields.io/badge/Prisma-6-teal) ![tailwind](https://img.shields.io/badge/Tailwind-4-cyan) ![hls](https://img.shields.io/badge/HLS.js-1.7-orange)

---

## Features

### Public-facing
- Cinematic dark streaming UI with hero, content rows, browse-by-genre, browse-by-language, subscription CTA, FAQ.
- Movies browse with genre/language/year/sort filters + pagination.
- Series browse with same filters.
- Movie & Series detail pages with backdrop, poster, cast/director, genres, language, age rating, trailer, Watch, Add to My List, Rate, Share, More Like This.
- Full-text search across titles, descriptions, cast, director — with autocomplete, filters, pagination.
- Watch page with HLS.js adaptive-bitrate video player: play/pause, seek, volume, fullscreen, playback speed (0.5–2x), subtitle toggle, quality selector, skip-intro, keyboard controls, episode navigation, auto-progress-save every 5s.
- Continue Watching row on home (driven by WatchHistory).
- My List (watchlist) with All/Movies/Series tabs.
- Watch History with progress bars and resume links.
- Multi-profile support (up to 5 per account, kids flag, maturity level, language, profile switching).
- Account page with profile/subscription/notifications/security tabs.
- Subscription page with 4 plans, comparison table, FAQ.
- Auth pages: login, register (password strength), forgot-password (dev returns reset token), reset-password.
- Legal pages: privacy, terms, copyright/DMCA, content-policy, about, contact.

### Admin dashboard (`/admin`)
- Auth-guarded (role=ADMIN or CONTENT_MANAGER).
- Dashboard overview: KPI cards (users, active users, total content, subscriptions, watch time, revenue, views, movies/series), 14-day views chart, 14-day signups chart, top-content table.
- CRUD for movies, series, seasons, episodes — full forms with multi-select genres/categories, status flags (featured/trending/popular/new-release/recommended), publish/unpublish actions.
- CRUD for genres, categories, languages, banners, subscription plans.
- User management: search, role change, suspend/activate/delete with confirm dialogs.
- Subscriptions list with MRR/ARR KPIs.
- Audit log table (filter by admin, resource, paginated).
- Detailed analytics page: 30-day views chart, top content (10), watch time by genre, searches by day, watchlist adds by day.

### Backend API (57 endpoints)
- Auth: register, login, logout, me, forgot-password, reset-password.
- Content (public): movies, series, episodes, genres, languages, categories, banners, plans, search — all with pagination/filter/sort.
- User-scoped: watchlist (GET/POST/DELETE + check), history (GET/POST), profiles (CRUD + switch), ratings, notifications, notification preferences, subscriptions.
- Admin: dashboard, full CRUD for movies/series/seasons/episodes/genres/categories/languages/banners/users/plans, audit logs, analytics, subscriptions list.
- Unified error shape `{error: {code, message, details?}}`.
- Every route wrapped with `withErrorHandler` — Zod validation errors, Prisma errors, and AuthErrors map to consistent JSON.

### Cross-cutting
- bcrypt password hashing (cost 10). HS256 JWT sessions in `httpOnly` cookies. Same-origin CSRF defense.
- Role-based access control on every mutating route.
- Admin audit log on every admin mutation.
- Prisma ORM throughout — zero raw SQL.
- Original SVG poster artwork generated at seed time — no copyrighted images.
- Demo content uses public-domain test streams (Big Buck Bunny, Sintel, Mux test HLS).
- TypeScript throughout. Zod validation on every API body & query string.

## Screenshots

See `/tmp/admin-fixed.png` (admin dashboard) and `/tmp/home.png` (home page) in the sandbox.

## Architecture

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) and the Mermaid diagrams in [`docs/architecture/`](./docs/architecture/):

- [`system.md`](./docs/architecture/system.md) — system topology
- [`auth-flow.md`](./docs/architecture/auth-flow.md) — login/session sequence
- [`video-flow.md`](./docs/architecture/video-flow.md) — HLS playback sequence
- [`database.md`](./docs/architecture/database.md) — ER diagram + indexes
- [`admin-flow.md`](./docs/architecture/admin-flow.md) — admin CRUD + audit
- [`deployment.md`](./docs/architecture/deployment.md) — production topology

### One-paragraph summary

A single Next.js 16 (App Router) fullstack app serves both the UI (`src/app/**/page.tsx`) and the REST API (`src/app/api/**/route.ts`) from one process. The browser talks to the App; the App talks to PostgreSQL (SQLite in dev) via Prisma; video bytes are served by an external HLS CDN (Mux test stream + Google sample CDN in dev, swappable to any provider in prod via env). All auth is JWT-in-httpOnly-cookie based; no third-party auth dependency. All payments are abstracted through a `PAYMENT_PROVIDER` env var so no card details ever touch the app.

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js 16 (App Router, Turbopack) | unified SSR + API |
| Language | TypeScript 5 | strict |
| UI | React 19 + Tailwind 4 + shadcn/ui (New York) | dark streaming theme |
| State | TanStack Query (server) + Zustand (client) | |
| Forms | React Hook Form + Zod | |
| Charts | Recharts | |
| Auth | bcryptjs + jsonwebtoken | custom JWT sessions |
| Database | Prisma + SQLite (dev) / PostgreSQL (prod) | swap via `DATABASE_URL` |
| Video | HLS.js | native HLS fallback on Safari |
| Validation | Zod | shared between client & server |
| Lint | ESLint 9 + eslint-config-next | |
| Package manager | Bun | |

## Local Development

### Prerequisites

- [Bun](https://bun.sh/) 1.x or newer
- Node.js 20+ (Bun includes a runtime; no separate Node needed for dev)

### First-time setup

```bash
# 1. Install deps
bun install

# 2. Copy env example
cp .env.example .env

# 3. Set the dev secrets (or leave defaults for local dev)
# The .env.example already has safe dev values.

# 4. Push the Prisma schema to your SQLite file
bun run db:push

# 5. Seed demo content
bun run seed
```

The seed creates:
- 16 genres, 10 languages, 8 categories, 4 subscription plans
- 12 sample movies + 4 series with seasons/episodes
- 2 users with profiles:
  - **Admin**: `admin@streamverse.local` / `admin12345`
  - **Demo viewer**: `demo@streamverse.local` / `demo12345`
- 2 hero banners
- Original SVG poster artwork at `public/posters/*.svg` (regenerated on each seed run)

### Running the app

```bash
bun run dev
```

Open <http://localhost:3000>. Visit `/admin` after logging in as the admin user.

### Useful scripts

| Command | What it does |
|---------|--------------|
| `bun run dev` | Start Next.js dev server (port 3000) |
| `bun run lint` | ESLint across the codebase |
| `bun run db:push` | Push `prisma/schema.prisma` to the DB (imperative sync) |
| `bun run db:generate` | Regenerate Prisma Client |
| `bun run seed` | Run `scripts/seed.ts` (idempotent) |
| `bun run build` | Production build (Next.js standalone output) |
| `bun run start` | Start the production server (after build) |

## Environment Variables

See [`.env.example`](./.env.example) for the full list with comments. The minimal set to boot:

```env
DATABASE_URL=file:/home/z/my-project/db/custom.db
AUTH_SECRET=any-32+-char-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_VIDEO_PROVIDER=demo
PAYMENT_PROVIDER=demo
EMAIL_PROVIDER=none
NODE_ENV=development
```

Everything else is optional. Production swaps:
- `DATABASE_URL` → managed Postgres connection string
- `AUTH_SECRET` → generated via `openssl rand -hex 32`
- `NEXT_PUBLIC_APP_URL` → your domain
- `PAYMENT_PROVIDER` → `razorpay` or `stripe` + their secrets
- `EMAIL_PROVIDER` → `resend` or `ses` + their keys
- `VIDEO_PROVIDER` → your CDN provider name

## Database Setup

The schema lives at [`prisma/schema.prisma`](./prisma/schema.prisma). Models:

- **Identity**: `User`, `Profile`, `Account`, `VerificationToken`, `PasswordResetToken`
- **Taxonomy**: `Genre`, `Category`, `Language`
- **Content**: `Movie`, `Series`, `Season`, `Episode`, `Subtitle`
- **Activity**: `Watchlist`, `WatchHistory`, `Rating`, `ContentView`
- **Commerce**: `SubscriptionPlan`, `Subscription`, `Payment`
- **Engagement**: `Banner`, `Notification`, `NotificationPreference`, `AnalyticsEvent`
- **Audit**: `AdminAuditLog`

ER diagram: [`docs/architecture/database.md`](./docs/architecture/database.md).

```bash
# Push schema to the DB
bun run db:push

# If you need to wipe and rebuild (dev only)
rm db/custom.db && bun run db:push && bun run seed
```

For production migrations (when you have real data you don't want to lose), use Prisma Migrate:

```bash
bunx prisma migrate dev --name init
bunx prisma migrate deploy
```

## Seed Data

The seed script at [`scripts/seed.ts`](./scripts/seed.ts) is **idempotent** — running it twice will not create duplicates.

It uses:
- **Public-domain test videos**: Big Buck Bunny, Elephants Dream, Sintel, Tears of Steel (Blender Foundation), Mux test HLS stream. No copyrighted content.
- **Original SVG posters**: generated programmatically with deterministic gradients per title. No third-party images.
- **Fictional titles and cast**: not based on any real production.

To extend the seed, add new entries to the `movieDefs` / `seriesDefs` arrays in `scripts/seed.ts`.

## Testing

### Manual smoke test (recommended after first setup)

1. Visit `/` — home page should render with hero, content rows, browse-by-genre, FAQ.
2. Visit `/movies` — should list 12 sample movies.
3. Click any movie → `/movie/:slug` — should show details, cast, More Like This.
4. Click "Play" → `/watch/movie/:slug` — should redirect to login (if not signed in).
5. Login as `demo@streamverse.local` / `demo12345`.
6. Click "Play" again → video player should load and play HLS stream.
7. Add to My List, then visit `/my-list` — should appear.
8. Watch 5+ seconds, then visit `/history` — should show progress.
9. Logout, login as `admin@streamverse.local` / `admin12345`.
10. Visit `/admin` — should show dashboard with KPIs and charts.
11. Visit `/admin/movies` — should list all 12 movies with Edit/Publish/Delete actions.

### Automated tests (planned)

The repo includes a test runner (`bun test`). To run any tests:

```bash
bun test
```

Unit tests for `recommendations.ts`, `validations.ts`, `auth.ts` and integration tests for the API routes are on the roadmap — see "Roadmap".

## Deployment

### Production checklist

See `docs/architecture/deployment.md` for the topology diagram.

1. **Database** — provision a managed PostgreSQL instance (Neon, Supabase, RDS, Railway, etc.). Copy its connection string into `DATABASE_URL`.
2. **App** — deploy the Next.js app to any Node-capable host:
   - Vercel: `vercel` CLI, set env vars in the dashboard.
   - Railway: connect repo, set env vars, deploy.
   - Fly.io: `fly launch`, set secrets with `fly secrets set`.
   - Self-host: `bun run build && bun run start` behind Caddy/Nginx.
3. **Schema sync** — run `bun run db:push` against the prod DB (one-time per schema change).
4. **Seed (optional)** — run `bun run seed` against the prod DB if you want the demo content. (You probably want a clean slate in prod — skip this and create content via the admin UI.)
5. **Object storage (optional)** — provision an S3/R2/GCS bucket, set `NEXT_PUBLIC_STORAGE_URL` to its public URL.
6. **Payment provider (optional)** — set `PAYMENT_PROVIDER=razorpay` or `stripe`, add the corresponding secrets.
7. **Email provider (optional)** — set `EMAIL_PROVIDER=resend` or `ses`, add the key.
8. **DNS** — point your domain to the host (A/AAAA/CNAME — see below).
9. **HTTPS** — handled by the host (Vercel/Railway/Fly) or by Caddy if self-hosting.

### DNS records

For a subdomain like `streamverse.example.com`:

| Type | Name | Value |
|------|------|-------|
| CNAME | `streamverse` | your-host-target (e.g. `xxx.vercel-dns.com`, `yyy.up.railway.app`) |

For an apex domain (`example.com`):

| Type | Name | Value |
|------|------|-------|
| A | `@` | host IPv4 |
| AAAA | `@` | host IPv6 |

Vercel/Netlify/Railway will show you the exact records to add in their domain settings page.

## Admin Setup

After deploy:

1. If you ran the seed, your admin user is `admin@streamverse.local` / `admin12345` — **change this password immediately** via the Account page.
2. If you skipped the seed, register a new user, then manually promote them to ADMIN via SQL:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
   ```
3. Visit `/admin` to start managing content.

## Video Configuration

The demo uses two public test streams:
- HLS (adaptive bitrate): Mux test stream at `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`
- MP4 (fallback): Google's `gtv-videos-bucket/sample/*.mp4` (Big Buck Bunny, Sintel, etc.)

### Swapping in your own video provider

Each `Movie`/`Episode` row has 4 video fields:
- `videoUrl` — direct MP4 or HLS master URL (used by the player when `hlsUrl` is null)
- `hlsUrl` — master `.m3u8` URL (preferred when present)
- `videoProvider` — `demo` / `external` / `mux` / `s3` (informational; controls future per-provider logic)
- `trailerUrl` — used by hero background autoplay

To use your own CDN: set the URLs to your CDN paths (e.g. `https://cdn.example.com/movies/crimson-frontier/master.m3u8`). The player handles the rest.

To integrate Mux/Cloudflare Stream/etc., extend the `videoProvider` enum and add an API route that mints signed playback URLs from the provider — the player just needs an `hlsUrl` in the end.

## Security

- **Passwords**: bcrypt hashed (cost 10). Never plaintext. Never returned in any API response (explicit `select:` blocks everywhere).
- **Sessions**: HS256 JWT in `httpOnly` cookie. `SameSite=Lax`. `Secure` in production. 7d (remember) or 1d (session).
- **CSRF**: same-origin cookie + JSON `Content-Type` requirement on mutations.
- **Authorization**: every mutating route calls `requireUser` / `requireAdmin` / `requireAdminOnly`. Public routes filter `status = PUBLISHED`.
- **Input validation**: Zod schemas (`src/lib/validations.ts`) on every API body & query.
- **SQL injection**: 100% Prisma ORM. Zero raw SQL anywhere.
- **XSS**: React auto-escapes; no `dangerouslySetInnerHTML` on user content.
- **Secrets**: all in env vars. `.env` is git-ignored. `.env.example` documents each.
- **Audit**: every admin mutation writes to `AdminAuditLog` with adminId, action, resource, resourceId, metadata, IP, user agent.
- **Rate limiting**: extension point at the route level (suggested: 5 req/s per IP on `/api/auth/*`).

## Legal Content Requirements

This platform is for legitimate content only. You MUST NOT use StreamVerse to:

- Download copyrighted movies from unauthorized sources
- Scrape illegal streaming or torrent sites
- Bypass DRM or paywalls
- Redistribute copyrighted material without permission
- Provide pirated links or embed unauthorized streams

The platform supports content that is:

- Owned by the platform operator
- Licensed from rights holders
- In the public domain
- Properly authorized by the original rights holder
- Developer / demo test footage

The seed data uses **only public-domain test assets** (Big Buck Bunny, Sintel, Elephants Dream, Tears of Steel — Blender Foundation open movies, plus the Mux test HLS stream) and **original SVG artwork** generated at seed time. No copyrighted images or videos are stored.

If a third party uploads content they don't have rights to, use the [DMCA / copyright takedown process](./docs/PRODUCT_REQUIREMENTS.md#11-legal-content-requirements) documented on the `/copyright` page.

## Roadmap

### Phase 2 (post-MVP)
- [ ] Migrate SQLite dev → PostgreSQL prod via Prisma Migrate
- [ ] Wire Razorpay/Stripe payment gateway (abstraction is ready)
- [ ] Wire Google OAuth (`Account` model is reserved)
- [ ] Email provider integration (Resend) for verification + password-reset + notifications
- [ ] Mux/Cloudflare Stream signed-URL provider
- [ ] Rate-limit middleware on `/api/auth/*`
- [ ] Server-side image optimization for posters/backdrops (`next/image` is configured; needs real CDN URLs in prod)

### Phase 3 (scaling)
- [ ] Unit + integration tests (Vitest + Playwright)
- [ ] CI/CD via GitHub Actions (install / lint / typecheck / test / build)
- [ ] OpenAPI/Swagger doc generation from route handlers
- [ ] Replace `ILIKE` search with Postgres FTS or OpenSearch
- [ ] Replace deterministic recommendations with embedding-based model

### Phase 4 (mobile/TV)
- [ ] React Native mobile app (consumes same API)
- [ ] Android TV / Fire TV app
- [ ] PWA install + offline watch-list caching
- [ ] Push notifications via FCM

## License

Source code: MIT. See [`LICENSE`](./LICENSE).

Sample video assets used in the demo seed are public-domain or CC-licensed (Blender Foundation open movies, Mux test stream). Brand assets (logos, posters) are original StreamVerse artwork generated by the seed script.

## Contributing

PRs welcome. Please run `bun run lint` before submitting. See [`CONTRIBUTING.md`](./CONTRIBUTING.md).
