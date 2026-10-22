# Security review: ora-frontend

Date: 2026-10-23 · Branch: `claude/security-review` · Base: `main` @ `372754e`

## Scope and stack

The repo was described as Angular, but it is **React 19 + TanStack Start (SSR) + Vite 8**, scaffolded
with Lovable and built and run with Bun/Node (`nitro` node-server preset, Docker → ECS). The Laravel backend
(`ora-backend`) was not available, so every backend statement below is based on what the frontend sends.

What I did:

- Scanned all 221 commits on every branch for secrets: known key patterns, `.env` files, deleted files,
  Supabase, Firebase, AWS, GitHub and Stripe tokens, JWTs, and credentials embedded in URLs.
- Reviewed auth and token handling, route protection, every call that moves money or gold, XSS sinks, logging,
  security headers, and the server-to-backend proxy.
- Ran `bun install --frozen-lockfile`, `bun run build`, all 7 existing `src/lib/*.test.ts` scripts (plus one new
  one), and `bun audit`.
- Smoke-tested the built SSR server. The security headers are present on responses.

Overall, the code is in better shape than most storefronts. Prices are never taken from the browser (orders
carry only server-issued quote IDs), CMS HTML is sanitised on the server, and post-login redirects were
already filtered. Most of the real risk is in dependencies and in a leftover Supabase project.

> **Important: the repo is public.** Anything that was ever committed is in the public git history,
> even if a later commit deleted it. The owner must rotate or decommission it. I did not rotate,
> revoke or rewrite any secret or history.

---

## Critical

### C1. TanStack Start reflected XSS in server-function responses (GHSA-qx66-fv34-fjm8)
- **Where:** `package.json` pinned `@tanstack/react-start` to `1.168.32`, which pulls in `@tanstack/start-server-core@1.169.17`.
  The app exposes server functions (`src/lib/*.functions.ts`, served under `/_serverFn/`).
- **Impact:** an unauthenticated attacker can craft a link that runs script on the storefront origin.
  The session token is stored in `localStorage` (see H2), so this is a full account takeover: the attacker
  can place orders, change the password, add a passkey, and read KYC and wallet data.
- **Fix: DONE.** Bumped to `@tanstack/react-start 1.168.61`, `react-router 1.170.42` and `router-plugin 1.168.43`.
  These are the matching set from the same release line, published 2026-10-10, so they pass the 24h
  `minimumReleaseAge` guard. `start-server-core` now resolves to `1.169.40`, which is patched. The build and
  all tests pass, and the SSR server boots.

## High

### H1. The Supabase project from the Lovable prototype is in public git history
- **Where:** `.env` was committed in `27c7162` (2026-08-30) and removed in `ff276ff` (2026-09-10). It contained
  `SUPABASE_URL` / `VITE_SUPABASE_URL` (project `hewn…`), `SUPABASE_PUBLISHABLE_KEY` /
  `VITE_SUPABASE_PUBLISHABLE_KEY` (`sb_p…`) and `SUPABASE_PROJECT_ID`. `supabase/config.toml` (also deleted)
  held the project ID.
- **Impact:** a publishable key is meant to be public, but anyone can now call that project. The deleted migrations
  `drizzle/migrations/0001_create_wallet.sql` and `0003_wallet_limits.sql` show
  `GRANT EXECUTE ON FUNCTION public.wallet_transact(...) TO authenticated`. That function is
  `SECURITY DEFINER` and accepts `p_kind = 'deposit'` with any amount. It also takes `p_gram_price` from the
  caller for `buy_gold` / `sell_gold`. If the project is still running and signups are open, any user can
  credit their own wallet and trade at a price they choose. `place_order` and `cancel_order` were also
  granted to `authenticated`.
- **Fix: OWNER ACTION REQUIRED.**
  1. If the Supabase project is no longer used, pause or delete it in the Supabase dashboard.
  2. If it must stay, rotate the API keys (Settings → API), disable signups, and `REVOKE EXECUTE` on
     `wallet_transact`, `place_order` and `cancel_order` from `authenticated`.
  3. Check that the project holds no real user data.

  No secret-type key (`sb_secret_…`, `service_role` or a database URL) was ever committed: `SUPABASE_SERVICE_ROLE_KEY`
  and `LOVABLE_DB_MIGRATION_URL` were only read from `process.env`.
- **Fix in repo: DONE.** `.gitignore` now also ignores `.env.*` (except `.env.example`), not only `.env`, so that
  `.env.production` and similar files cannot be committed by accident. `.dockerignore` already did this.

### H2. The session token is stored in `localStorage` and the CSP has no `script-src`
- **Where:** `src/lib/api.ts:15,18,30,49` (keys `zadgold.token` and `zadgold.token.real`) and `src/server.ts:51`
  (`frame-ancestors 'none'; object-src 'none'; base-uri 'self'`).
- **Impact:** any XSS (a vulnerable dependency like C1, a sanitiser gap behind `Prose`, or a compromised
  third-party script) can read the Sanctum bearer token and use it from anywhere until it is revoked.
  The token is long-lived, and the demo flow also keeps a second token (the "real" one) there. Without
  `script-src`, injected inline scripts run. The code comment already acknowledges this (`ponytail: no script-src`).
- **Fix: RECOMMENDED** (needs product and infrastructure changes, so not done here):
  - Best: move web auth to Sanctum SPA cookie sessions (`HttpOnly; Secure; SameSite=Lax` plus a CSRF token),
    or have the SSR server set an `HttpOnly` cookie and proxy authenticated calls.
  - Short term: add a nonce-based `script-src` (TanStack Start supports passing a nonce to its inline
    hydration scripts) that allows `https://www.googletagmanager.com`, plus a `connect-src` that allows the API,
    Reverb, Firebase and GA. Also give Sanctum tokens a short `expiration` and rotate them on use.

## Medium

### M1. Admin HTML is rendered with `dangerouslySetInnerHTML`, and the frontend trusts backend sanitisation
- **Where:** `src/components/Policy.tsx:20` (`Prose`). It is used for static pages, news and reports.
- **Impact:** safe only as long as `Str::sanitizeHtml` in `PageController`, `NewsController` and
  `ReportController` strips scripts, event handlers and `javascript:` URLs. A dashboard admin account, or a
  missed endpoint, becomes a stored-XSS vector against every customer. Combined with H2, that means token theft.
- **Fix: RECOMMENDED.** Keep server-side sanitisation (see "Backend checks needed"). As defence in depth,
  sanitise again on the client with DOMPurify before rendering. I did not add a new runtime dependency in this branch.

### M2. Dependency advisories in tooling (dev and build only)
- `vite 8.1.5`: `server.fs.allow` bypass and cross-origin script execution through dev middleware. **DONE** → 8.1.6.
- `shell-quote <1.11` (critical), `launch-editor ≤2.14.1`, `brace-expansion`, `source-map-js`. These are reached
  only through devtools, eslint and postcss. **DONE** with `bun audit fix` (lockfile-only, in-range bumps).
- `bun audit` now reports only H/L in `@grpc/grpc-js 1.9.16` (see L4).

### M3. The `/broadcasting/auth` header captures the token once
- **Where:** `src/lib/use-notifications.ts:65`.
- **Impact:** low by itself. The Echo client is rebuilt when `user` changes, so a stale token is only a
  correctness issue. It does mean the bearer token is sent to `${BASE}/broadcasting/auth`. Make sure that
  endpoint is on the same trusted API host and served over HTTPS (`VITE_API_URL` must be `https://` in production).
- **Fix: RECOMMENDED.** Check the production build arguments. No code change.

## Low

### L1. Open-redirect hardening in `safeNext`
- **Where:** `src/lib/use-auth.ts` `safeNext()`, used at `src/routes/auth.tsx:449`.
- **Issue:** it rejected `//host`, but browsers treat `\` as `/` and strip tab and newline characters, so
  `/\evil.com` or `/<TAB>/evil.com` could be read as protocol-relative. TanStack's `navigate` probably keeps the
  value as an in-app path, but this filter is the security boundary, so it should be strict.
- **Fix: DONE.** It now rejects backslashes and control characters. Added `src/lib/safe-next.test.ts`.

### L2. Store links from the dashboard are not scheme-checked on the client
- **Where:** `src/routes/index.tsx`, `StoreButton` (`app.android` / `app.ios` from `/settings`).
- **Fix: DONE.** Only `https://` links are rendered as clickable. The backend already restricts these to Play
  and App Store hosts.

### L3. Path IDs interpolated without encoding
- **Where:** `src/routes/orders.tsx` (`/orders/{id}/cancel`, `/orders/{id}/accept-price`) and
  `src/components/PaymentReference.tsx` (`/orders/{id}/payment-reference`).
- **Fix: DONE.** Wrapped in `encodeURIComponent`, as the other calls already do. This is defence in depth: the IDs come from the API.

### L4. `@grpc/grpc-js 1.9.16` (GHSA-m9gg-hp2v-232j high, GHSA-f596-whhp-79r4 low)
- **Where:** pulled in by `firebase > @firebase/firestore`, which pins `~1.9.0`. The app uses only
  `firebase/app` and `firebase/messaging` in the browser, and grpc-js is a Node server library, so this is not reachable.
- **Fix: RECOMMENDED.** Upgrade `firebase` when a release unpins it. Not forced with an override, to avoid breaking Firestore internals.

### L5. Console logging
- `src/routes/__root.tsx:52` and `src/start.ts:12` call `console.error(error)` for render and SSR errors.
  `src/lib/error-capture.ts` expands stacks into server logs. No tokens, passwords or PII are logged anywhere.
  The only `console.log` is in a test file. **No change needed.** Make sure production server logs are not public.

### L6. Lint is currently red on `main` (2 errors and 23 warnings, unrelated to security). Not touched.

---

## Things checked and found OK

- **No price, total or fee is trusted from the browser.** `src/lib/orders.ts` sends only `{sku, qty}` to
  `POST /cart/quote` and then `quote_ids` to `POST /checkout`. `src/routes/wallet.tsx:221` sends
  `{metal, karat, side:"buy", grams}` to `POST /quotes` and then `quote_id` to `POST /orders`. The totals shown in
  `checkout.tsx:113-116` (subtotal and `deliveryFee`) are display estimates, and the receipt screen uses the
  server's `gross_piasters` and `delivery_fee_piasters`.
- Idempotency keys are sent on checkout and gold-buy orders.
- 401 clears the token (`api.ts:154,184`). Logout revokes the token on the server and clears the query cache
  (`use-auth.ts`). Push devices are unregistered first.
- Route "guards" are client-side redirects in `useEffect`. They are UX only and bypassable, which is fine as
  long as every API endpoint enforces auth (see below).
- The `STOREFRONT_KEY` server-to-backend key is read only in `*.server.ts`, and I checked that it is not in
  `.output/public`. No source maps ship. `VITE_*` values (Reverb key, Firebase web config, GA ID) are public by design.
- Security headers: `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, HSTS and `Referrer-Policy`
  are set on every SSR response (`src/server.ts`).
- Server-function inputs that build backend paths are allow-listed or validated as integers (`pages.functions.ts`, `news.functions.ts`).
- The service worker builds click-through URLs from a fixed switch with an encoded ID. There is no open redirect.

---

## Backend checks needed (ora-backend)

Based on what this frontend sends, the Laravel API must enforce the following. None of it can be enforced by the frontend.

**Pricing and money**
1. `POST /quotes {metal, karat, side, grams}`: price only from the server's own desk feed. Validate `metal`/`karat`
   pairs, `side ∈ {buy}` for web (reject `sell` unless the feature exists), and `grams > 0` with a maximum and a
   decimal-places limit. Quote expiry must be short and checked again at `POST /orders`.
2. `POST /orders {quote_id}` and `POST /checkout {quote_ids[], …}`: the quote must belong to the caller, be
   unexpired and unused (single-use, inside a DB transaction with row locks). Balance checks and debits must be
   atomic. Honour `Idempotency-Key` per user. Never accept a price, total, fee or amount field from the body.
3. `POST /cart/quote {items:[{sku,qty}]}`: integer `qty` from 1 to 99, stock checked at execution. The delivery fee is
   computed on the server from `fulfilment` and `governorate`.
4. `payment_method ∈ {instapay, bank, wallet, metal, cash}`. `metal` must debit the caller's own gold or silver at the
   server's price. `payment_reference` is required for `instapay` and `bank`. Uniqueness of the reference across
   orders and deposits helps prevent reuse of a single transfer.
5. `POST /deposits (amount, reference, receipt)`: **must never credit the balance automatically.** Credit only after
   finance approves, or after the Banque Misr VIBAN callback is verified (signature or mTLS, amount and account
   matched to the user's VIBAN, idempotent on bank transaction ID). Enforce min and max amounts, KYC-approved status
   (the UI hides the form only for `unverified`, `pending` and `rejected`) and the 403 for demo users.
   Validate receipt MIME and size on the server, store it outside the web root, and serve it only to staff.
6. `POST /orders/{id}/accept-price` and `/payment-reference`: owner-only, valid only in the `repriced` /
   pending-payment states, using the server's proposed price.
7. `POST /orders/{id}/cancel`: owner-only, only in `CANCELLABLE` states. Refunds come from ledger records, not the request.
8. Demo isolation: `/demo/enter` and `/demo/topup` must only ever touch the demo account's ledger. A demo token
   must not be able to call real-money endpoints, and real balances must never be reachable with a demo token.

**Authentication and authorisation**
9. Every authenticated endpoint (`/me`, `/wallet`, `/wallet/transactions`, `/holdings`, `/orders*`, `/deposits`,
   `/kyc*`, `/cart*`, `/notifications*`, `/devices`, `/me/passkeys*`) must scope by `auth()->id()`, with no IDOR
   on `{id}`. Client redirects are not protection.
10. `/broadcasting/auth`: the private channel `App.Models.User.{id}` must check `$user->id === (int)$id`.
11. Sanctum: set token `expiration`, throttle `/auth/token`, `/auth/otp*`, `/auth/register*` and `/auth/passkey*`,
    and make sure OTP codes are not logged in production (docs/backend-gaps.md notes "the code is in the log").
    `reset_token` must be single-use and short-lived. `PUT /me/password` must revoke other tokens, and
    `/me/passkeys/options` must require `current_password`.
12. WebAuthn: verify the challenge, origin, RP ID and sign counter on the server.
13. `X-Storefront-Key` and `X-Visitor-IP`: accept `X-Visitor-IP` only when the storefront key matches, and only
    from the internal network or ALB. Otherwise any client can spoof its IP to dodge rate limits.

**Content**
14. `Str::sanitizeHtml` must cover every HTML field rendered by `Prose` (pages, news and report bodies, including
    translations) and strip `<script>`, `on*` attributes, `style` expressions, `javascript:`/`data:` URLs and
    `<iframe>`/`<object>`. Dashboard URL fields (store links, images) must be validated to `https://`.
15. CORS: allow only the storefront origin(s). Do not use `*` together with credentials.

## Owner action checklist
- [ ] Decommission, or rotate and lock down, Supabase project `hewn…` (H1).
- [ ] Merge this branch after review (C1 dependency fix).
- [ ] Plan the move away from `localStorage` tokens and/or add a nonce-based CSP (H2).
- [ ] Work through the "Backend checks needed" list in `ora-backend`.
