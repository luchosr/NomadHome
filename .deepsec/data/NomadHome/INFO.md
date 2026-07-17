# NomadHome

## What this codebase does

Co-living and workspace marketplace SaaS. TypeScript strict monorepo: `apps/api`
(Node.js + Express, layered DDD) and `apps/web` (React + Vite SPA). Guests search
and book properties/workspaces; hosts create/publish listings; admins moderate.
Payments via Stripe Checkout (hosted — no card data touches the API); email via
Resend; photo uploads via signed PUT URLs direct to R2/S3 (bytes never flow through
the API). PostgreSQL with `btree_gist` + an EXCLUDE constraint on `AvailabilityBlock`
enforces no overlapping bookings at the DB level.

## Auth shape

- `requireAuth` — verifies Bearer JWT from `Authorization` header, populates
  `req.user: { id, roles }`. **Does NOT hit the DB** — a recently disabled user
  with a valid non-expired access token can still pass this check until expiry.
- `requireRole(...roles)` — RBAC factory applied after `requireAuth`; checks
  `req.user.roles` array (values: `guest`, `host`, `admin`).
- `tokenService.verifyAccessToken` — underlying JWT verification.
- Refresh tokens stored as `tokenHash` (hashed before persist); revoked in bulk
  when a user is disabled (admin cascade).
- `disabledAt` is enforced at the refresh endpoint, not on every request.

## Threat model

- A compromised host account can publish listings and collect Stripe payments;
  IDOR on listing mutations (host accessing another host's listing) is the
  primary lateral-movement vector.
- Stripe webhook spoofing: mitigated by `stripe.webhooks.constructEvent` signature
  verification. The webhook route is mounted **before** `express.json()` to
  preserve the raw body.
- Admin disable cascade must atomically hide listings and flag confirmed bookings;
  partial failures would leave guests holding valid bookings for hidden listings.
- Snapshot immutability: booking fee columns (`nightlyRateCents`, `*FeeBps`,
  `*FeeCents`, `currency`) must never be updated after insert — any UPDATE on these
  columns is a financial integrity bug.

## Project-specific patterns to flag

- **IDOR on listing mutations**: host routes should filter `where: { id, hostId: req.user.id }`.
  A missing `hostId` constraint in a Prisma query gives any authenticated host
  read/write access to every listing.
- **Role gate on `/users/me/become-host`**: adds the `host` role. Should verify
  `emailVerifiedAt` is non-null before granting. Flag if that check is absent.
- **Disabled-user window**: `requireAuth` does not check `disabledAt` — endpoints
  where a disabled user must be rejected immediately (e.g., listing mutations,
  booking creation) need an explicit DB lookup or a very short access-token TTL.
- **Webhook route ordering**: `/stripe/webhook` is mounted before `express.json()`.
  Any new route on `/stripe/*` added after `express.json()` will receive a consumed
  body and fail signature verification silently.
- **Booking hold lifecycle**: `BOOKING_HOLD` rows must be deleted on cancellation
  and `checkout.session.expired`. An orphaned hold permanently blocks those dates.

## Known false-positives

- `/dev-upload/:key` — `express.raw` handler writing files to `uploads/`; active
  **only when `R2_ACCOUNT_ID` is absent** (local dev stub). Not a prod path.
- `/health` — intentionally public, no auth.
- `apps/web/e2e/helpers/auth.ts` and all `apps/web/e2e/` — Playwright test
  fixtures; `localStorage.setItem("nh_refresh_token", ...)` is not production code.
- `packages/db/prisma/seed.ts` — may contain hardcoded admin credentials; dev/CI
  seed only, never deployed with prod secrets.
