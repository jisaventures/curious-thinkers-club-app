# Agent notes

This is the Curious Thinkers Club members app: Next.js App Router, TypeScript, Tailwind, and Supabase when it is configured. Demo mode is the default local path.

## Demo mode vs Supabase

`lib/demo/mode.ts` `isDemoMode()` is true when `NEXT_PUBLIC_DEMO_MODE=true`, or when `SUPABASE_URL` / `SUPABASE_ANON_KEY` are missing. `NEXT_PUBLIC_DEMO_MODE=false` forces Supabase.

Demo data is an in-memory store on `globalThis` in `lib/demo/store.ts`, seeded with Sam, Pip, Lou, Mo, the pirate pack (Pip on step 5, Lou on step 2 at 2:14), two other owned packs, two locked packs, and the nickname leaderboard. Mutations live in `lib/demo/handlers.ts`. Do not call `createClient()` or the service role on a demo-mode path. Middleware in `lib/supabase/middleware.ts` skips Supabase and uses the `ctc_demo_persona` cookie (`sam` or `admin`).

When you add a screen or a server action, branch on `isDemoMode()` before any Supabase call, and update the memory store so the click-through still works with only `npm run dev`.

## Layout

- `app/club` family dashboard, children, and pack path. Server components load data; small client islands handle video resume, ticks, uploads, and child forms.
- `app/admin` is role-gated in middleware and `requireAdmin()`.
- `app/api/shopify/webhooks/orders-paid` verifies Shopify HMAC. It does not call Shopify.
- `lib/auth/shopify.ts` is a stub for Customer Account API OAuth. Do not invent a second session store. A future OAuth login should still issue a Supabase session so RLS stays in Postgres.
- `supabase/migrations` is the real schema and RLS. `supabase/seed.sql` matches the demo family. Keep the two seeds telling the same story.

## Conventions

- UK English in copy. Ages 2–12. Nicknames only: no surnames, no child photos, no child emails, no passwords.
- Validate writes with zod in `lib/validators.ts`. Points are awarded in the database trigger or `markDemoSteps`, never trusted from the browser.
- Leaderboards expose nickname, age, avatar, and points. Do not add account ids or emails to that shape.
- Cookies for auth are httpOnly. `Secure` is on when `NODE_ENV` is production.
- Brand: bottle green `#1e4d3a`, gold `#f0b429`, cream paper, Nunito body, Fredoka headings. Match the existing club components rather than introducing a new visual system.
- Server secrets stay off `NEXT_PUBLIC_`. The anon key is server-only here (`SUPABASE_ANON_KEY`) because the browser does not talk to Supabase directly.

## Checks

```bash
npm run typecheck
npm run lint
npm test
```

`lib/**/*.test.ts` is excluded from `tsc` and run with Node's type stripper. Imports in those tests keep the `.ts` suffix.
