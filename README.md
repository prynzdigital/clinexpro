# Clinex Pro — website, booking and admin (Phase 1)

Mobile-first booking site for Clinex Pro Contracting Ltd (Mauritius), with an
installable PWA, English/French SEO pages, an instant-quote booking flow and an
admin dashboard for bookings, customers and business leads.

Stack: Next.js 16 (App Router), Tailwind CSS 4, Drizzle ORM, Postgres.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill SESSION_SECRET and ADMIN_* values
npm run db                   # terminal 1: local Postgres (PGlite) on port 54329
npm run seed -- --demo       # once: admin user + sample data
npm run dev                  # terminal 2: http://localhost:3000
```

Admin: http://localhost:3000/admin (credentials from `.env.local`).

Stop the database with Ctrl+C so it closes cleanly. Its data lives in `.data/`.

## Where things are

| Area | Path |
| --- | --- |
| Prices and booking rules (placeholder MUR figures) | `src/lib/pricing.ts` |
| Service copy (EN/FR) | `src/content/services.ts` |
| Towns served | `src/content/towns.ts` |
| UI text (EN/FR) | `src/dictionaries/` |
| Brand colours (from the Clinex Pro logo) | `src/app/globals.css` (`:root` tokens) |
| Logo and icons (from clinexpro.net) | `public/brand/` |
| Database schema / migrations | `src/db/schema.ts`, `drizzle/` (`npm run db:generate`) |
| Public pages | `src/app/[lang]/` |
| Admin | `src/app/admin/` |
| PWA | `src/app/manifest.ts`, `public/sw.js`, `src/components/pwa.tsx` |
| Old WordPress URL redirects | `next.config.ts` |

## Deploy

1. Create a hosted Postgres (Supabase, Neon…) and set `DATABASE_URL`.
2. Set `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, then run `npm run seed` once against it.
3. Deploy to Vercel or any Node host (`npm run build && npm start`). Migrations run on first request.

## Not yet connected

- Online deposit payment (gateway to be chosen)
- WhatsApp / email notifications (`src/lib/notify.ts` only logs)
- Google Tag Manager / GA4 (`src/lib/track.ts` pushes funnel events once a tag is installed)
