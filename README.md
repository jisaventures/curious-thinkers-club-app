# Curious Thinkers Club

## Run locally in Cursor

No Docker and no Supabase account are required to click through the app.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). Demo mode starts by itself when `SUPABASE_URL` or `SUPABASE_ANON_KEY` is missing. You are signed in as Sam, with children Pip (7), Lou (4) and Mo (5), and the pirate pack already in progress. Use the yellow bar to open **Admin** (Ada) or return to **Sam's club**. Data lives in the dev server's memory and resets on restart.

To force demo mode even after you add Supabase keys, set `NEXT_PUBLIC_DEMO_MODE=true`. Set it to `false` only when you want the real database and the keys are present.

Architecture notes for later edits are in [AGENTS.md](AGENTS.md).

Members’ area for [Curious Thinkers Club](https://curiousthinkersclub.org). Families who buy a printable learning pack in the Shopify shop use this app, on a subdomain such as `club.curiousthinkersclub.org`, to follow each pack as a step-by-step path.

An adult manages the account. Children are nicknames, ages and chosen avatars. The app does not collect surnames, dates of birth, photos of children, or passwords.

## What works in v1

- Demo mode with no Docker or Supabase: in-memory Sam, Pip, Lou and Mo, and every screen clickable from `npm run dev`.
- Email magic-link sign-in (no passwords), behind an auth provider switch, once Supabase is configured.
- Adult confirmation (18+) before the club opens.
- Up to five child profiles per account. One purchase unlocks a pack for every child.
- Dashboard: packs and progress, points, a nickname-only leaderboard, reward codes, and a moderated “share your work” upload with a required social-sharing consent tick.
- Pack path: winding steps, Together and Solo, separate progress, a catch-up nudge at three steps apart, video resume per child per step, points, and a certificate with bonus points when the pack is finished.
- Admin (role checked on the server): packs, steps and order, submission moderation, reward codes, and manual grants.
- Shopify `orders/paid` webhook with HMAC verification. It grants matching packs when the adult already has a club account.
- Row Level Security on every table. Step videos are only readable for packs the account owns.

## Stubbed for later

- Shopify Customer Account API sign-in. The button and `lib/auth/shopify.ts` describe the OAuth flow and stop there. No real shop is called.
- Reward codes are placeholders in this database. They are not Shopify discounts until the same codes exist in the shop.
- The pirate (and other) videos are a silent placeholder at `public/videos/guide.mp4`, not a real lesson. Production videos should be unlisted YouTube or Vimeo, or files in the private `pack-videos` bucket.
- The webhook does not create a club account. If an order arrives before that email has signed in, it is stored as unmatched and an admin can retry it.

## Local setup

You need Node 22+, Docker, and the Supabase CLI (`npx supabase`, already a dev dependency).

```bash
npm install
npx supabase start
npx supabase db reset
```

`supabase start` prints `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY`. Copy them into `.env.local` (see `.env.example`). The service role key stays on the server. Do not prefix it with `NEXT_PUBLIC_`.

```bash
npm run dev
```

The app listens on [http://127.0.0.1:43123](http://127.0.0.1:43123).

If `supabase start` dies while “Initialising schema” and containers cannot reach each other, this machine’s bridge firewall is in the way. On Linux, `sudo sysctl -w net.bridge.bridge-nf-call-iptables=0` and start again. A normal Docker Desktop install does not need that.

Magic links sent locally appear in Mailpit at [http://127.0.0.1:54324](http://127.0.0.1:54324). With `DEV_DEMO_LOGIN=true` the login page can also open the seeded accounts directly. Turn that off before deploying.

### Seeded accounts

| Who | Email | Use |
| --- | --- | --- |
| Sam, parent of Pip (7), Lou (4) and Mo (5) | sam@demo.curiousthinkersclub.test | The family dashboard and the pirate path |
| Ada, admin | admin@demo.curiousthinkersclub.test | Packs, moderation, codes, grants |

There is no password. Pip has 340 points and is on step 5 of *Be a pirate for the day*. Lou is on step 2 with the video saved at 2:14, so the catch-up nudge says she is 3 steps behind. Knight and space packs are locked at £8.99.

## Scripts

```bash
npm run dev
npm run test
npm run typecheck
npm run lint
npm run build
```

## Deploy on Vercel

1. Create a Supabase project (the free tier is enough). Do not commit its keys.
2. In the Supabase SQL editor, run `supabase/migrations/*.sql` in order, then decide whether to run `supabase/seed.sql`. The seed is for local demo data. For production, create the admin by signing in once and setting `accounts.role` to `admin` in the SQL editor. Do not leave `DEV_DEMO_LOGIN` on.
3. Authentication → URL configuration: site URL `https://club.curiousthinkersclub.org`, redirect `https://club.curiousthinkersclub.org/auth/callback`.
4. Authentication → SMTP: add the club’s own mail provider. The built-in Supabase mailer is rate limited and not suitable for families.
5. Storage: the migrations create private buckets `work-submissions` (5MB, jpeg/png/webp) and `pack-videos`.
6. Vercel project env (Production and Preview):

   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SITE_URL` = `https://club.curiousthinkersclub.org`
   - `NEXT_PUBLIC_SHOP_URL` = the Shopify storefront
   - `AUTH_PROVIDER` = `supabase`
   - `SHOPIFY_WEBHOOK_SECRET` once the custom app exists

7. Deploy. Point the subdomain at Vercel.

Sessions use httpOnly cookies. `Secure` is set when `NODE_ENV` is production, which it is on Vercel’s HTTPS.

## Shopify, when you are ready

Do this in the Shopify Partner / custom app for the existing store. This repo does not connect to a shop.

1. Create a **custom app** for the Curious Thinkers store (not a public App Store app).
2. Customer Account API:
   - `SHOPIFY_SHOP_DOMAIN`
   - `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID`
   - `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET` (server only)
   - `SHOPIFY_CUSTOMER_ACCOUNT_ISSUER` (`https://shopify.com/authentication/<shop_id>`)
   - Set `AUTH_PROVIDER=shopify` only after `lib/auth/shopify.ts` is implemented. Until then, families use the email link.
   - The planned exchange is server-side. It should store `accounts.shopify_customer_id` and then issue a Supabase session so Row Level Security stays in Postgres.
3. Webhooks:
   - Topic `orders/paid`
   - URL `https://club.curiousthinkersclub.org/api/shopify/webhooks/orders-paid`
   - API secret → `SHOPIFY_WEBHOOK_SECRET`
   - Put each pack’s Shopify product id on the pack in admin (the seed uses placeholders `900000000001` … `900000000005`).
   - The adult needs to have opened the club with the same email before the order can be matched. Otherwise the order is listed under Admin → Grants as unmatched, and **Retry unmatched** grants it once the account exists.
4. Create the real discount codes (`CURIOUS15`, and any others you add in admin) in Shopify. This app only shows the code. It does not create the discount.

A signed test from your machine:

```bash
BODY='{"id":1001,"email":"sam@demo.curiousthinkersclub.test","line_items":[{"product_id":900000000004}]}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SHOPIFY_WEBHOOK_SECRET" -binary | base64)
curl -s -X POST http://127.0.0.1:43123/api/shopify/webhooks/orders-paid \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: $SIG" \
  -d "$BODY"
```

Unsigned requests are rejected. If the secret is missing the route returns 503 and does nothing.

## Security and children’s data

- RLS is enabled on every public table. Families read and write their own rows. Pack steps, including video URLs, are hidden until `pack_ownership` exists for that account.
- Admins are `accounts.role = 'admin'`. Middleware and each admin page check it. Members cannot change their own role, email, or Shopify customer id.
- Points are awarded by database triggers and `review_submission`, not by the browser.
- Uploads are checked for JPEG, PNG or WEBP magic bytes and capped at 5MB. A parent must tick consent before a photo can enter the moderation queue. Approving a photo awards 25 points. The queue reminds moderators to refuse faces and surnames.
- The leaderboard is a security-definer function that returns nickname, age, avatar, points and rank. It does not return account ids or emails.
- Leaderboard ages are visible to signed-in adults only, because the mockup shows them. Say if you would rather drop ages from that list.
- No third-party analytics and no advertising profile of a child.

This is aimed at the UK GDPR and the ICO Age Appropriate Design Code: an adult is the account holder, data is limited to what the club needs, and children are not asked for their own login.

## What Josh needs to provide

- A Supabase project URL, anon key and service role key for production, plus the Vercel project.
- DNS for `club.curiousthinkersclub.org`.
- An SMTP provider for magic links.
- The email address that should be the first admin (or promote Ada’s seeded user only on a private demo).
- Real pack copy, printable references and video URLs.
- The Shopify custom app credentials, webhook secret, and real product ids listed above.
- Matching discount codes in the Shopify admin.
