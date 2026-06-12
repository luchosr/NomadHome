# NomadHome — Implementation Tasks (MVP)

> **Status**: Draft v0.1
> **Last updated**: 2026-05-27
> **Source**: [docs/PRD.md](PRD.md) §8 (User Stories)
> **Generated via**: `enrich-us` skill — each user story is enriched with implementation-ready detail (endpoints, fields, files, DoD, NFRs) and broken into atomic, checkable tasks aligned with the OpenSpec `tasks.md` template in [CLAUDE.md](../CLAUDE.md) §14.3.
> **Architecture references**: [docs/backend-standards.md](backend-standards.md) (DDD layered: presentation → application → domain → infrastructure), [docs/frontend-standards.md](frontend-standards.md) (features/ folders, TanStack Query for server state, Zustand for client state, RHF + Zod for forms, `t()` helper for copy), [CLAUDE.md](../CLAUDE.md) §3 (locked tech stack and monorepo layout).
> **Note on layout**: CLAUDE.md mandates the monorepo layout `apps/api/`, `apps/web/`, `packages/db/`, `packages/shared/`. Tasks below use that layout. Where the standards docs say `backend/` or `frontend/`, treat those as `apps/api/` and `apps/web/` respectively.

---

## How to use this file

1. Each user story (US-X.Y) from [docs/PRD.md](PRD.md#8-user-stories-and-acceptance-criteria) becomes one task block here.
2. Tasks are grouped by layer: **DB**, **Shared**, **Backend**, **Frontend**, **Tests**, **Docs/Ops**.
3. Every block ends with a **Definition of Done (DoD)** that maps directly to the OpenSpec Quality Gates ([CLAUDE.md](../CLAUDE.md) §7).
4. When promoting a US into an OpenSpec change, lift the relevant block into `openspec/changes/<change-id>/tasks.md` and lift the acceptance criteria into the delta spec.
5. Use TDD ordering per [CLAUDE.md](../CLAUDE.md) §4 Phase 3: **Red** (write failing tests from the acceptance criteria) → **Green** (implement) → **Refactor** → **Verify**.

---

## Conventions used in this file

- **Endpoints**: REST under `/api/v1`. Auth-protected routes require `Authorization: Bearer <jwt>` unless noted as `Public`.
- **Field types**: `string`, `number`, `boolean`, `Date (ISO 8601)`, `enum(...)`, `uuid`.
- **Response envelope**: `{ success, data, message }` for success; `{ success, error: { message, code, details? } }` for errors — per [docs/backend-standards.md](backend-standards.md) §API Design Standards.
- **File paths**: relative to repo root.
- **Coverage**: ≥80% on changed lines per [CLAUDE.md](../CLAUDE.md) §7 (PRD-aligned). Backend standards mention 90% as an aspirational target — keep tests aiming high.
- **i18n**: every user-facing string goes through `t(key)` in [`packages/shared/src/strings/`](../packages/shared/src/strings/) ([docs/frontend-standards.md](frontend-standards.md) §Localization).
- **Commits**: Conventional Commits with ticket suffix, e.g., `feat(identity): add registration endpoint (NH-XXX)`.

---

# 8.1 Identity

## US-1.1 — Register with email and password

**Original (from PRD §8.1):** As a new visitor, I want to register with email and password so that I can become a guest or host.

**Acceptance criteria (verbatim from PRD):**
- Given a valid email not yet registered and a password meeting policy (min 10 chars, 1 letter, 1 number)
- When I submit the registration form
- Then my account is created with role `guest` by default, my password is stored as a bcrypt hash, and I receive a verification email
- And the auth audit log records `user.registered` with timestamp and IP

**Enhanced — Implementation tasks:**

### DB / Schema (`packages/db/`)
- [ ] 1.1.1 Add `User` Prisma model: `id (uuid)`, `email (unique, citext)`, `passwordHash (string)`, `roles (string[])` default `["guest"]`, `emailVerifiedAt (DateTime?)`, `disabledAt (DateTime?)`, `createdAt`, `updatedAt`.
- [ ] 1.1.2 Add `EmailVerificationToken` Prisma model: `id (uuid)`, `userId (FK)`, `tokenHash (string)`, `expiresAt (DateTime)`, `usedAt (DateTime?)`.
- [ ] 1.1.3 Add `AuthAuditEvent` Prisma model: `id (uuid)`, `userId (FK?, nullable)`, `event (enum: registered | login_succeeded | login_failed | password_reset_requested | role_added | user_disabled)`, `ipAddress (string)`, `userAgent (string?)`, `metadata (json?)`, `createdAt`.
- [ ] 1.1.4 Generate migration: `pnpm db:migrate:dev --name add_identity_tables`.
- [ ] 1.1.5 Update [`packages/db/seed.ts`](../packages/db/seed.ts) to seed one verified `admin` user from env vars `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

### Shared (`packages/shared/`)
- [ ] 1.1.6 Add Zod schema `RegisterUserSchema` in [`packages/shared/src/schemas/auth.ts`](../packages/shared/src/schemas/auth.ts): `email (email)`, `password (min 10, regex /(?=.*[A-Za-z])(?=.*\d)/)`.
- [ ] 1.1.7 Add type `RegisterUserPayload = z.infer<typeof RegisterUserSchema>`.
- [ ] 1.1.8 Add error code constants in [`packages/shared/src/errors.ts`](../packages/shared/src/errors.ts): `EMAIL_ALREADY_REGISTERED`, `VALIDATION_ERROR`.

### Backend (`apps/api/`)
- [ ] 1.1.9 Add domain entity `User` in [`apps/api/src/domain/models/User.ts`](../apps/api/src/domain/models/User.ts) with method `hasRole(role)` and static factory `create({ email, passwordHash })`.
- [ ] 1.1.10 Add repository interface `IUserRepository` in [`apps/api/src/domain/repositories/IUserRepository.ts`](../apps/api/src/domain/repositories/IUserRepository.ts): `findByEmail`, `save`, `findById`.
- [ ] 1.1.11 Implement `UserRepository` (Prisma) in [`apps/api/src/infrastructure/repositories/UserRepository.ts`](../apps/api/src/infrastructure/repositories/UserRepository.ts).
- [ ] 1.1.12 Add `AuthAuditService` in [`apps/api/src/application/services/AuthAuditService.ts`](../apps/api/src/application/services/AuthAuditService.ts) with `record(event, { userId, ipAddress, userAgent, metadata })`.
- [ ] 1.1.13 Add `IdentityService.register({ email, password, ipAddress, userAgent })` in [`apps/api/src/application/services/IdentityService.ts`](../apps/api/src/application/services/IdentityService.ts): validates uniqueness, bcrypt-hashes password (cost factor 12), creates user, issues email verification token (32-byte random, hash stored), enqueues verification email via Resend, records `user.registered` audit event.
- [ ] 1.1.14 Add controller `POST /api/v1/auth/register` (Public) in [`apps/api/src/presentation/controllers/authController.ts`](../apps/api/src/presentation/controllers/authController.ts). Returns `201` with `{ userId, email }`, never returns token (verification flow handles login).
- [ ] 1.1.15 Add route binding in [`apps/api/src/routes/auth.ts`](../apps/api/src/routes/auth.ts).
- [ ] 1.1.16 Add error mapping: `EMAIL_ALREADY_REGISTERED → 409`, `VALIDATION_ERROR → 400`.

### Frontend (`apps/web/`)
- [ ] 1.1.17 Add `register` API client in [`apps/web/src/features/auth/api.ts`](../apps/web/src/features/auth/api.ts).
- [ ] 1.1.18 Add `useRegisterMutation` hook in [`apps/web/src/features/auth/hooks/useRegisterMutation.ts`](../apps/web/src/features/auth/hooks/useRegisterMutation.ts) (TanStack Query mutation).
- [ ] 1.1.19 Add `RegisterPage` in [`apps/web/src/features/auth/pages/RegisterPage.tsx`](../apps/web/src/features/auth/pages/RegisterPage.tsx) using React Hook Form + Zod resolver against shared `RegisterUserSchema`. On success, route to `/auth/check-email`.
- [ ] 1.1.20 Add route `/auth/register` in [`apps/web/src/routes/`](../apps/web/src/routes/).
- [ ] 1.1.21 Add copy keys `auth.register.title`, `auth.register.cta`, `auth.register.errors.emailTaken`, etc., in [`packages/shared/src/strings/en.ts`](../packages/shared/src/strings/en.ts).

### Tests (Red first — written by QA before implementation)
- [ ] 1.1.22 Backend unit: `IdentityService.register` — happy path, duplicate email, weak password, audit event written, verification email enqueued.
- [ ] 1.1.23 Backend integration: `POST /auth/register` — `201`, `409`, `400`, response shape.
- [ ] 1.1.24 Frontend unit: `RegisterPage` renders, validates, surfaces server errors.
- [ ] 1.1.25 Playwright E2E: register → see "check your email" page (`apps/web/e2e/register.spec.ts`).

### Docs / Ops
- [ ] 1.1.26 Document `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `BCRYPT_COST` env vars in `.env.example` and `apps/api/README.md`.
- [ ] 1.1.27 Rate-limit `/auth/register` to 5 req/min/IP (express-rate-limit) — NFR.

### Definition of Done
Lint ✅, typecheck ✅, unit + integration + E2E green (≥80% coverage on changed lines) ✅, audit event recorded in DB ✅, verification email actually arrives in test inbox ✅, OpenSpec delta spec validates ✅.

---

## US-1.2 — Log in

**Original (from PRD §8.1):** As a registered user, I want to log in so that I can access my account.

**Acceptance criteria (verbatim):**
- Given valid credentials for a verified account → access token (JWT, short-lived) + refresh token (longer-lived); audit log records `user.login_succeeded`.
- Given invalid credentials → generic error (no enumeration); audit log records `user.login_failed`.

**Enhanced — Implementation tasks:**

### DB
- [ ] 1.2.1 Add `RefreshToken` model: `id (uuid)`, `userId (FK)`, `tokenHash (string)`, `expiresAt`, `revokedAt (DateTime?)`, `createdAt`, `lastUsedAt (DateTime?)`, `userAgent (string?)`. Server-side revocable per [docs/PRD.md](PRD.md) §10.
- [ ] 1.2.2 Generate migration `add_refresh_tokens`.

### Shared
- [ ] 1.2.3 Add `LoginSchema` and `RefreshTokenSchema` in `packages/shared/src/schemas/auth.ts`.
- [ ] 1.2.4 Add `AuthTokensDTO`: `{ accessToken, refreshToken, expiresIn }`.

### Backend
- [ ] 1.2.5 Add `TokenService` in [`apps/api/src/application/services/TokenService.ts`](../apps/api/src/application/services/TokenService.ts): `signAccessToken(user)` (15 min TTL, HS256, claims: `sub`, `roles`, `iat`, `exp`), `issueRefreshToken(user)` (30 day TTL, hashed in DB), `rotateRefreshToken(token)`, `revoke(token)`.
- [ ] 1.2.6 Add `IdentityService.login({ email, password, ipAddress, userAgent })`: verifies user is `emailVerifiedAt != null` and `disabledAt == null`, bcrypt-compares password, issues token pair, records audit event. Generic error on any failure (no enumeration).
- [ ] 1.2.7 Add `IdentityService.refresh({ refreshToken, ipAddress, userAgent })`: validates, rotates (issues new pair, revokes old), records audit event.
- [ ] 1.2.8 Add `IdentityService.logout({ refreshToken })`: revokes token; idempotent.
- [ ] 1.2.9 Endpoints (Public):
  - `POST /api/v1/auth/login` → `200 { data: AuthTokensDTO }` | `401 { error: INVALID_CREDENTIALS }`
  - `POST /api/v1/auth/refresh` → `200 { data: AuthTokensDTO }` | `401`
  - `POST /api/v1/auth/logout` → `204`
  - `POST /api/v1/auth/verify-email` (`{ token }`) → `204` (sets `emailVerifiedAt`)
- [ ] 1.2.10 Add `requireAuth` middleware in [`apps/api/src/middleware/requireAuth.ts`](../apps/api/src/middleware/requireAuth.ts): parses Bearer token, attaches `req.user`, returns `401` on failure.

### Frontend
- [ ] 1.2.11 Add `LoginPage` (`/auth/login`) — RHF + Zod, mutation calls `/auth/login`.
- [ ] 1.2.12 Add `useAuthStore` (Zustand) in [`apps/web/src/features/auth/store.ts`](../apps/web/src/features/auth/store.ts): persisted access token in memory only (refresh token in `httpOnly` cookie set by API). Per [docs/frontend-standards.md](frontend-standards.md) state separation.
- [ ] 1.2.13 Add Axios interceptor in [`apps/web/src/lib/api-client.ts`](../apps/web/src/lib/api-client.ts): on `401`, attempt `/auth/refresh` once, retry original request, else redirect to `/auth/login`.
- [ ] 1.2.14 Add `VerifyEmailPage` (`/auth/verify?token=...`) that POSTs to `/auth/verify-email` and redirects to login on success.

### Tests
- [ ] 1.2.15 Backend unit: `IdentityService.login` (success, wrong password, unverified, disabled, all yield same generic error externally but different audit events internally).
- [ ] 1.2.16 Backend integration: full login → refresh → logout cycle; token reuse after revoke returns `401`.
- [ ] 1.2.17 Playwright E2E: register → verify (mock email link) → login → land on home with authenticated UI state.

### Docs / Ops
- [ ] 1.2.18 Document `JWT_SECRET` (min 32 chars), `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `COOKIE_DOMAIN` env vars.
- [ ] 1.2.19 Rate-limit `/auth/login` to 10 req/min/IP.

### Definition of Done
All gates green; rotation invariant verified (old refresh token unusable after rotation); refresh token never returned in JSON body, only in `httpOnly`, `Secure`, `SameSite=Lax` cookie.

---

## US-1.3 — Upgrade to host role

**Original (from PRD §8.1):** As a guest, I want to upgrade to a host role so that I can list a property.

**Acceptance criteria (verbatim):**
- Given I am logged in as a guest, when I complete the host onboarding form, then my account gains the `host` role in addition to `guest` and I can access host-only routes.

**Enhanced — Implementation tasks:**

### DB
- [ ] 1.3.1 Add `HostProfile` model: `userId (FK, unique)`, `displayName (string)`, `payoutEmail (string)`, `acceptedTermsVersion (string)`, `createdAt`. (Phone is deferred to Post-MVP per `docs/data-model.md` §3.2.)

### Shared
- [ ] 1.3.2 Add `BecomeHostSchema`: `displayName (min 2)`, `payoutEmail (email)`, `acceptedTermsVersion (string)`.

### Backend
- [ ] 1.3.3 Add `IdentityService.becomeHost({ userId, payload })`: idempotent — if already host, returns existing profile; else adds `"host"` to roles array, creates `HostProfile`, records `role_added` audit event.
- [ ] 1.3.4 Endpoint: `POST /api/v1/users/me/become-host` (auth required) → `200 { data: HostProfile }`.
- [ ] 1.3.5 Add `requireRole(role)` middleware factory in [`apps/api/src/middleware/requireRole.ts`](../apps/api/src/middleware/requireRole.ts).

### Frontend
- [ ] 1.3.6 Add `BecomeHostPage` (`/host/onboarding`) gated by `requireAuth`.
- [ ] 1.3.7 After success, refresh `useAuthStore` user data so role-guarded host routes become accessible.
- [ ] 1.3.8 Add `<RoleGate role="host">` component used to wrap host-only routes.

### Tests
- [ ] 1.3.9 Backend unit: idempotency (calling twice does not duplicate audit events or profile rows).
- [ ] 1.3.10 Frontend: `RoleGate` hides children for non-host, renders for host.
- [ ] 1.3.11 Playwright: login as guest → onboarding → access `/host/listings`.

### DoD
Token after upgrade contains `host` in `roles` claim on next refresh; old access token still works for guest-only routes until its 15-min TTL expires (documented behavior — no forced re-login).

---

# 8.2 Listings

## US-2.1 — Create a listing

**Original (from PRD §8.2):** As a host, I want to create a listing so that guests can discover and book it.

**Acceptance criteria (verbatim):**
- Given I am authenticated as a host, when I submit a listing with title, description, type (`property` or `workspace`), city, capacity, nightly rate, at least one photo, and at least one amenity, then the listing is created in `draft` status, owned by me, and visible only to me until published.

**Enhanced — Implementation tasks:**

### DB
- [ ] 2.1.1 Add `Listing` model: `id (uuid)`, `hostId (FK User)`, `title (string)`, `description (text)`, `type (enum: PROPERTY | WORKSPACE)`, `city (string)`, `country (string)`, `addressLine (string)`, `latitude (Decimal?)`, `longitude (Decimal?)`, `capacity (int)`, `nightlyRateCents (int)`, `currency (string, default "USD")`, `status (enum: DRAFT | PUBLISHED | DISABLED)`, `disabledAt (DateTime?)`, `createdAt`, `updatedAt`.
- [ ] 2.1.2 Add `ListingPhoto` model: `id (uuid)`, `listingId (FK)`, `url (string)`, `position (int)`, `createdAt`. Unique `(listingId, position)`.
- [ ] 2.1.3 Add `Amenity` model: `code (string PK)`, `label (string)`. Seed with: `wifi`, `kitchen`, `workspace_desk`, `washer`, `air_conditioning`, `heating`, `pets_allowed`, `parking`, `gym`, `coworking_24_7`, `meeting_room`, `monitor`, `printer`.
- [ ] 2.1.4 Add join table `ListingAmenity` (`listingId`, `amenityCode`, composite PK).
- [ ] 2.1.5 Index `Listing(city, status)` and `Listing(hostId)`.
- [ ] 2.1.6 Migration `add_listings`.

### Shared
- [ ] 2.1.7 Add `CreateListingSchema` in [`packages/shared/src/schemas/listings.ts`](../packages/shared/src/schemas/listings.ts): all required fields validated; `nightlyRateCents > 0`, `capacity >= 1`, `photos: z.array(z.string().url()).min(1)`, `amenityCodes: z.array(z.string()).min(1)`.
- [ ] 2.1.8 Add `ListingDTO` and `ListingSummaryDTO` types.

### Backend
- [ ] 2.1.9 Add `Listing` domain entity in [`apps/api/src/domain/models/Listing.ts`](../apps/api/src/domain/models/Listing.ts) with methods `publish()`, `unpublish()`, `disable()`, invariants: cannot publish without ≥1 photo, ≥1 amenity, non-zero rate.
- [ ] 2.1.10 Add `IListingRepository` and `ListingRepository` (Prisma).
- [ ] 2.1.11 Add `ListingService.create({ hostId, payload })`: validates, persists in `DRAFT`.
- [ ] 2.1.12 Endpoint `POST /api/v1/listings` (auth + `host` role) → `201 { data: ListingDTO }`.
- [ ] 2.1.13 Endpoint `GET /api/v1/listings/me` (host) — list own listings (all statuses).
- [ ] 2.1.14 Endpoint `GET /api/v1/listings/:id` — public if `PUBLISHED`, owner-only if `DRAFT`, `404` if `DISABLED` and not admin.
- [ ] 2.1.15 Endpoint `PUT /api/v1/listings/:id` (host owner) — partial update.

### Photo storage (open item — see PRD §12)
- [ ] 2.1.16 Wire photo upload via signed-URL flow: `POST /api/v1/listings/:id/photos/sign` returns presigned PUT URL for chosen storage (Cloudflare R2, S3, or Supabase Storage — decision tracked as an ADR). Client uploads directly, then `POST /api/v1/listings/:id/photos` persists the resulting URL + position.

### Frontend
- [ ] 2.1.17 Add `useListingsQueries` in [`apps/web/src/features/listings/hooks/`](../apps/web/src/features/listings/hooks/) (TanStack Query): `useMyListings`, `useListing(id)`, `useCreateListingMutation`, `useUpdateListingMutation`.
- [ ] 2.1.18 Add `ListingFormPage` (`/host/listings/new` and `/host/listings/:id/edit`) — multi-step RHF form: basics → location → capacity & pricing → amenities → photos. Zod resolver against shared schema.
- [ ] 2.1.19 Add photo uploader component using the signed-URL flow.
- [ ] 2.1.20 Add copy keys under `listings.form.*`.

### Tests
- [ ] 2.1.21 Backend unit: `Listing.publish()` throws when invariants violated; `ListingService.create` snapshots `currency`.
- [ ] 2.1.22 Backend integration: `POST /listings` happy + auth + role failures.
- [ ] 2.1.23 Frontend: form validation, photo upload retry on signed-URL expiry.
- [ ] 2.1.24 Playwright: host creates listing as draft.

### DoD
Draft listing is invisible to anonymous search (covered by US-3.1 test); only owner can `GET /listings/:id` for a `DRAFT`; quality gates green.

---

## US-2.2 — Publish a listing

**Original (from PRD §8.2):** As a host, I want to publish a listing so that it appears in guest search results.

**Acceptance criteria (verbatim):**
- Given I own a `draft` listing with the minimum required fields, when I publish it, then its status becomes `published` and it becomes searchable.
- And I can revert to `draft` at any time to remove it from search.

**Enhanced — Implementation tasks:**

### Backend
- [ ] 2.2.1 `ListingService.publish(listingId, hostId)`: loads listing, enforces ownership, calls `Listing.publish()` (domain invariants), persists `status = PUBLISHED`.
- [ ] 2.2.2 `ListingService.unpublish(listingId, hostId)`: sets `DRAFT`. Existing confirmed bookings remain valid (see US-8.2 for the cascading rules — same principle).
- [ ] 2.2.3 Endpoints:
  - `POST /api/v1/listings/:id/publish` → `204`
  - `POST /api/v1/listings/:id/unpublish` → `204`
- [ ] 2.2.4 Error codes: `LISTING_INVARIANT_VIOLATED` (422), `NOT_OWNER` (403), `NOT_FOUND` (404).

### Frontend
- [ ] 2.2.5 Add publish/unpublish buttons on host listing detail page with confirmation dialog (shadcn `AlertDialog`).
- [ ] 2.2.6 On success, invalidate `useMyListings` query.

### Tests
- [ ] 2.2.7 Backend unit: publish fails when invariants not met; unpublish keeps existing bookings intact.
- [ ] 2.2.8 Playwright: draft → publish → appears in search → unpublish → disappears from search.

### DoD
All gates green; search query in US-3.1 confirmed to exclude `DRAFT` and `DISABLED`.

---

## US-2.3 — Manage listing availability

**Original (from PRD §8.2):** As a host, I want to manage listing availability so that I do not get double-booked.

**Acceptance criteria (verbatim):**
- Given I own a published listing, when I block a date range, then that range is unavailable for booking and does not appear as bookable in search results.

**Enhanced — Implementation tasks:**

### DB
- [ ] 2.3.1 Add `AvailabilityBlock` model: `id (uuid)`, `listingId (FK)`, `startDate (Date)`, `endDate (Date)`, `source (enum: HOST_BLOCK | BOOKING_HOLD | ADMIN_BLOCK)`, `bookingId (FK?, nullable)`, `createdAt`. Index `(listingId, startDate, endDate)`.
- [ ] 2.3.2 Add DB-level exclusion constraint or service-level lock to prevent overlapping `BOOKING_HOLD` ranges per listing (Postgres `daterange && daterange` with `EXCLUDE USING gist` is the canonical pattern — add as a manual SQL step in the migration).

### Backend
- [ ] 2.3.3 `AvailabilityService.block({ listingId, hostId, startDate, endDate })`: enforces ownership, rejects ranges overlapping existing `BOOKING_HOLD` rows.
- [ ] 2.3.4 `AvailabilityService.unblock({ blockId, hostId })`: only `HOST_BLOCK` rows can be removed by host.
- [ ] 2.3.5 `AvailabilityService.isAvailable({ listingId, startDate, endDate })` — used by Search (US-3.1) and Booking (US-4.1).
- [ ] 2.3.6 Endpoints:
  - `GET /api/v1/listings/:id/availability?from=&to=` — public.
  - `POST /api/v1/listings/:id/blocks` (host owner) → `201`.
  - `DELETE /api/v1/blocks/:blockId` (host owner) → `204`.

### Frontend
- [ ] 2.3.7 Add calendar component (shadcn `Calendar` + custom range selector) on host listing detail page.
- [ ] 2.3.8 Show booked ranges (read-only) and host-blocked ranges (editable).

### Tests
- [ ] 2.3.9 Backend unit: cannot block over a confirmed booking; cannot unblock a `BOOKING_HOLD`.
- [ ] 2.3.10 Integration: concurrent block attempts (two requests, same range) — only one succeeds, the other returns `409 OVERLAP_CONFLICT`.
- [ ] 2.3.11 Playwright: host blocks range → search by guest for that range returns empty.

### DoD
Overlap-prevention enforced at DB level (not just app level); NFR: availability queries answer in <100ms for 1000-listing dataset.

---

# 8.3 Search

## US-3.1 — Search by city and date range

**Original (from PRD §8.3):** As a guest, I want to search listings by city and date range so that I can find places to stay.

**Acceptance criteria (verbatim):**
- Given I provide a city, a check-in date, and a check-out date, when I submit the search, then I receive a paginated list of published listings in that city that have availability for the entire requested range.
- And the listing card shows photo, title, type, nightly rate, and computed total for the requested range.

**Enhanced — Implementation tasks:**

### Shared
- [ ] 3.1.1 Add `SearchListingsQuerySchema` in [`packages/shared/src/schemas/search.ts`](../packages/shared/src/schemas/search.ts): `city (string, min 2)`, `checkIn (Date)`, `checkOut (Date, > checkIn)`, `type ('property' | 'workspace' | 'any')`, `page (int, default 1)`, `pageSize (int, default 20, max 50)`.
- [ ] 3.1.2 Add `ListingSearchResultDTO`: `id`, `title`, `type`, `city`, `coverPhotoUrl`, `nightlyRateCents`, `currency`, `totalCents (computed)`, `nights (int)`.

### Backend
- [ ] 3.1.3 `ListingRepository.search(query)`: filters `status = PUBLISHED`, `city = ?` (case-insensitive), excludes listings with any `AvailabilityBlock` overlapping `[checkIn, checkOut)`. Returns paginated results.
- [ ] 3.1.4 Add `SearchService.search(query)` that calls repository and computes `totalCents = nightlyRateCents * nights`.
- [ ] 3.1.5 Endpoint `GET /api/v1/listings/search` (Public) — query params per schema; returns `{ data: ListingSearchResultDTO[], pagination: { page, pageSize, totalItems, totalPages } }`.
- [ ] 3.1.6 Cache search results (in-memory LRU, TTL 60s, keyed by normalized query) — NFR for first-page UX.

### Frontend
- [ ] 3.1.7 Add `useSearchListings` hook (TanStack Query, keepPreviousData: true).
- [ ] 3.1.8 Add `SearchPage` (`/search`) with sticky search bar (city + date range + type) and result grid of `ListingCard` components.
- [ ] 3.1.9 Read query params from URL so search results are shareable.
- [ ] 3.1.10 Empty state: clear copy via `t('search.empty')`.

### Tests
- [ ] 3.1.11 Backend unit: excludes draft, disabled, fully-booked listings.
- [ ] 3.1.12 Integration: pagination correctness; city matching is accent-insensitive.
- [ ] 3.1.13 Playwright: search a seeded city → at least one card visible; click card opens detail.

### DoD
Full-text on city is **out of scope** (exact match only in MVP); document in PRD §12 if not already.

---

## US-3.2 — Filter search results

**Original (from PRD §8.3):** As a guest, I want to filter search results so that I can narrow down candidates.

**Acceptance criteria (verbatim):**
- Given I have a result set, when I apply filters (price range, type, amenities, capacity), then the results update and only listings matching all filters are shown.

**Enhanced — Implementation tasks:**

### Shared
- [ ] 3.2.1 Extend `SearchListingsQuerySchema` with optional fields: `minPriceCents`, `maxPriceCents`, `amenityCodes (string[])`, `minCapacity (int)`.

### Backend
- [ ] 3.2.2 Extend `ListingRepository.search` to apply filters (AND semantics for amenities — listing must have ALL selected).
- [ ] 3.2.3 Add DB indexes: `Listing(nightlyRateCents)`, `Listing(capacity)`.

### Frontend
- [ ] 3.2.4 Add `SearchFiltersPanel` (slide-over on mobile, sidebar on desktop) with: dual-handle price slider, type radio, capacity stepper, amenity checkboxes.
- [ ] 3.2.5 Sync filter state to URL query params (Zustand for transient panel-open state only).
- [ ] 3.2.6 Add "Clear filters" CTA.

### Tests
- [ ] 3.2.7 Backend unit: AND semantics on amenities (listing with `wifi` only does not match `[wifi, kitchen]`).
- [ ] 3.2.8 Playwright: apply price + amenity → result count shrinks → clear filters → restored.

### DoD
URL state survives reload; no filter-related N+1 queries (verify via Prisma logs in test mode).

---

# 8.4 Booking

## US-4.1 — Book a listing

**Original (from PRD §8.4):** As a guest, I want to book a listing so that I can secure my stay.

**Acceptance criteria (verbatim):**
- Given I am authenticated and a listing is available for my requested dates
- When I confirm the booking and complete Stripe Checkout
- Then a `booking` record is created with status `confirmed`, the dates are blocked on the listing's availability, both the guest service fee and host commission are snapshotted, and a confirmation email is sent to the guest and the host.

**Enhanced — Implementation tasks:**

### DB
- [ ] 4.1.1 Add `Booking` model: `id (uuid)`, `listingId (FK)`, `guestId (FK User)`, `hostId (FK User, denormalized)`, `checkIn (Date)`, `checkOut (Date)`, `nights (int)`, `nightlyRateCents (int, snapshot)`, `subtotalCents (int)`, `guestServiceFeeBps (int, snapshot)`, `guestServiceFeeCents (int)`, `hostCommissionBps (int, snapshot)`, `hostCommissionCents (int)`, `currency (string)`, `totalChargedCents (int)`, `payoutCents (int)`, `status (enum: PENDING_PAYMENT | CONFIRMED | CANCELLED | COMPLETED)`, `stripeCheckoutSessionId (string?)`, `stripePaymentIntentId (string?)`, `createdAt`, `confirmedAt (DateTime?)`, `cancelledAt (DateTime?)`, `cancellationReason (string?)`.
- [ ] 4.1.2 Migration `add_bookings`.
- [ ] 4.1.3 Add `PlatformFeeConfig` table (one row): `guestServiceFeeBps`, `hostCommissionBps`, `effectiveFrom`. Seed from env `PLATFORM_GUEST_FEE_BPS` and `PLATFORM_HOST_COMMISSION_BPS` (basis points: 100 bps = 1%).

### Shared
- [ ] 4.1.4 Add `CreateBookingSchema`: `listingId (uuid)`, `checkIn`, `checkOut (> checkIn)`.
- [ ] 4.1.5 Add `BookingDTO`, `PriceBreakdownDTO`.

### Backend
- [ ] 4.1.6 Add `Booking` domain entity with `confirm()`, `cancel(reason)`, `complete()` and invariants.
- [ ] 4.1.7 Add `PricingService.quote({ listingId, checkIn, checkOut })`: loads listing rate, current fee config, computes breakdown. Returns `PriceBreakdownDTO`.
- [ ] 4.1.8 Add `BookingService.startCheckout({ guestId, payload, ipAddress })`:
  1. Re-check availability via `AvailabilityService.isAvailable`.
  2. Compute price via `PricingService.quote`.
  3. Within a DB transaction: insert `Booking (status=PENDING_PAYMENT)` AND insert `AvailabilityBlock(source=BOOKING_HOLD, bookingId)`. Roll back on overlap conflict.
  4. Create Stripe Checkout Session (mode `payment`, line items reflecting host price + guest fee as separate items, `metadata.bookingId`).
  5. Return `{ bookingId, checkoutUrl }`.
- [ ] 4.1.9 Add `BookingService.handleStripeWebhook(event)`:
  - On `checkout.session.completed` with matching `bookingId`: set `status=CONFIRMED`, `confirmedAt=now`, send guest + host confirmation emails (Resend templates).
  - On `checkout.session.expired`: set `status=CANCELLED`, release `AvailabilityBlock`.
  - Idempotent via Stripe event id stored in `StripeProcessedEvent` table.
- [ ] 4.1.10 Endpoints:
  - `POST /api/v1/bookings/quote` (auth) — returns `PriceBreakdownDTO` without persisting.
  - `POST /api/v1/bookings` (auth) — starts checkout, returns `{ bookingId, checkoutUrl }`.
  - `GET /api/v1/bookings/:id` (auth, guest or host of booking).
  - `GET /api/v1/bookings/me` (auth) — guest's bookings.
  - `POST /api/v1/webhooks/stripe` (Public, signature-verified).
- [ ] 4.1.11 Add `StripeProcessedEvent` model: `eventId (PK)`, `processedAt`. Used to dedupe.

### Frontend
- [ ] 4.1.12 Add listing detail page (`/listings/:id`) with date picker; on date selection, fetch `/bookings/quote` to show breakdown live.
- [ ] 4.1.13 "Reserve" CTA calls `POST /bookings` and redirects to Stripe Checkout URL.
- [ ] 4.1.14 Add `BookingConfirmationPage` (`/bookings/:id/confirmation`) shown after Stripe success redirect — polls `GET /bookings/:id` until status is `CONFIRMED` (handles webhook latency).
- [ ] 4.1.15 Add `MyBookingsPage` (`/me/bookings`).

### Tests
- [ ] 4.1.16 Backend unit: pricing math (bps), snapshot integrity (changing fee config does not retro-alter existing bookings — PRD §7 invariant).
- [ ] 4.1.17 Integration with Stripe in test mode: full happy path; expired session releases hold.
- [ ] 4.1.18 Integration: concurrent double-booking attempt returns `409 OVERLAP_CONFLICT` for the loser.
- [ ] 4.1.19 Playwright: search → listing detail → reserve → Stripe test card → land on confirmation.

### Docs / Ops
- [ ] 4.1.20 Document `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`.
- [ ] 4.1.21 Configure Stripe webhook endpoint in Stripe Dashboard for test + prod modes.

### DoD
PRD §7 invariant tested (fee snapshot frozen); Stripe webhook idempotent (replay same event → no duplicate emails); booking creation atomic (no orphan `AvailabilityBlock` rows on failure).

---

## US-4.2 — Cancel a booking

**Original (from PRD §8.4):** As a guest, I want to cancel a booking before check-in so that I can recover if my plans change.

**Acceptance criteria (verbatim):**
- Given a `confirmed` booking with check-in in the future, when I cancel it, then status becomes `cancelled`, the dates are released, the host is notified, and any refund is recorded as `pending_admin`.

**Enhanced — Implementation tasks:**

### DB
- [ ] 4.2.1 Add `RefundRequest` model: `id (uuid)`, `bookingId (FK)`, `amountCents (int)`, `status (enum: PENDING_ADMIN | PROCESSED | REJECTED)`, `requestedAt`, `processedAt (DateTime?)`, `notes (text?)`.

### Backend
- [ ] 4.2.2 `BookingService.cancelByGuest({ bookingId, guestId })`:
  - Validates guest ownership, status is `CONFIRMED`, `checkIn > now`.
  - In transaction: sets `CANCELLED`, deletes the `BOOKING_HOLD`, creates `RefundRequest` with amount per cancellation policy (open item — PRD §12; default for MVP: full refund if >7d before check-in, 50% if 1–7d, 0% if <24h).
  - Sends cancellation email to host and refund-pending email to guest.
- [ ] 4.2.3 Endpoint: `POST /api/v1/bookings/:id/cancel` (auth, guest of booking) → `200 { data: BookingDTO }`.

### Frontend
- [ ] 4.2.4 Add "Cancel booking" button on `MyBookingsPage` with confirmation dialog showing refund preview.
- [ ] 4.2.5 Show refund status on booking detail.

### Tests
- [ ] 4.2.6 Backend unit: cannot cancel a `CANCELLED` or past booking; refund math matches policy.
- [ ] 4.2.7 Playwright: book → cancel → search shows dates available again.

### DoD
Policy tiers configurable as env or DB row (avoid hardcoding); host cancellation flow is **post-MVP** and not in scope.

---

# 8.5 Payments

## US-5.1 — Pay through Stripe Checkout

Covered in full by US-4.1 tasks 4.1.8 → 4.1.14. No additional tasks; this story is implementation-coupled to booking. Marked done when US-4.1 is done.

---

## US-5.2 — Admin view of host payouts owed

**Original (from PRD §8.5):** As an admin, I want to see what is owed to each host so that I can trigger payouts.

**Acceptance criteria (verbatim):**
- Given I am authenticated as an admin, when I view the payouts page, then I see, per host, the sum of confirmed-and-checked-out bookings minus the host commission, minus any payouts already recorded.

**Enhanced — Implementation tasks:**

### DB
- [ ] 5.2.1 Add `Payout` model: `id (uuid)`, `hostId (FK)`, `amountCents (int)`, `currency (string)`, `paidAt (Date)`, `method (string)`, `externalReference (string?)`, `notes (text?)`, `recordedByAdminId (FK User)`, `createdAt`.
- [ ] 5.2.2 Add `PayoutBooking` join: `payoutId`, `bookingId` (unique on `bookingId` so a booking can be settled only once).
- [ ] 5.2.3 Add scheduled job (or admin-triggered action) to transition `CONFIRMED` bookings to `COMPLETED` when `checkOut <= today`.

### Backend
- [ ] 5.2.4 `PayoutService.computeOwedByHost()`: returns `[{ hostId, displayName, payoutEmail, owedCents, eligibleBookingIds }]` where eligible bookings are `COMPLETED` and not yet attached to any `Payout`.
- [ ] 5.2.5 `PayoutService.recordPayout({ adminId, hostId, bookingIds, paidAt, method, externalReference, notes })`: validates all bookingIds belong to host and are eligible, sums amounts, creates `Payout` + `PayoutBooking` rows in transaction.
- [ ] 5.2.6 Endpoints (admin role):
  - `GET /api/v1/admin/payouts/owed` → `{ data: [...] }`
  - `POST /api/v1/admin/payouts` → `201`
  - `GET /api/v1/admin/payouts?hostId=` → history.

### Frontend
- [ ] 5.2.7 Add `AdminPayoutsPage` (`/admin/payouts`) gated by `<RoleGate role="admin">`.
- [ ] 5.2.8 Table of hosts with owed amounts; "Record payout" dialog captures method + reference + notes.

### Tests
- [ ] 5.2.9 Backend unit: math correctness with mixed-status bookings; double-settlement prevented by unique constraint on `PayoutBooking.bookingId`.
- [ ] 5.2.10 Integration: record payout → owed amount drops to zero for that host.

### DoD
NFR: payout computation runs in <500ms for 10k bookings; query uses single GROUP BY rather than N+1.

---

# 8.6 Reviews

## US-6.1 — Review a listing after the stay

**Original (from PRD §8.6):** As a guest, I want to review a listing after my stay so that I can share my experience.

**Acceptance criteria (verbatim):**
- Given a `confirmed` booking whose check-out date has passed
- When I submit a review with 1–5 stars and optional free text
- Then the review is attached to the booking and the listing, and is visible on the listing's detail page.
- And I cannot submit more than one review per booking.

**Enhanced — Implementation tasks:**

### DB
- [ ] 6.1.1 Add `Review` model: `id (uuid)`, `bookingId (FK, unique)`, `listingId (FK)`, `guestId (FK)`, `rating (int, 1..5)`, `body (text?)`, `createdAt`.
- [ ] 6.1.2 Add denormalized `Listing.averageRating (Decimal?)` and `Listing.reviewCount (int default 0)` for fast listing-page display; updated via service after each review create.

### Shared
- [ ] 6.1.3 Add `CreateReviewSchema`: `rating (int, min 1, max 5)`, `body (string, max 2000, optional)`.

### Backend
- [ ] 6.1.4 `ReviewService.create({ bookingId, guestId, payload })`:
  - Validate booking exists, guest owns it, status is `COMPLETED` (or `CONFIRMED` with `checkOut <= now`).
  - Reject if a review already exists for that booking (`UNIQUE` constraint + explicit error code `REVIEW_ALREADY_EXISTS`).
  - Create review; recompute and update `Listing.averageRating` and `reviewCount` in the same transaction.
- [ ] 6.1.5 Endpoints:
  - `POST /api/v1/bookings/:id/review` (auth, guest) → `201 { data: ReviewDTO }`.
  - `GET /api/v1/listings/:id/reviews?page=&pageSize=` (Public) → paginated reviews.

### Frontend
- [ ] 6.1.6 On `MyBookingsPage`, surface a "Leave review" CTA next to bookings eligible for review.
- [ ] 6.1.7 Add `ReviewForm` (RHF + Zod) with star selector (shadcn or custom) and textarea.
- [ ] 6.1.8 On listing detail page, render `<ReviewList>` with paginated load-more.

### Tests
- [ ] 6.1.9 Backend unit: duplicate review rejected; average rating recomputed correctly.
- [ ] 6.1.10 Playwright: book → simulate past check-out (test helper) → leave review → review visible on listing.

### DoD
Average rating consistent under concurrent review creates (use DB-level recompute or `SELECT FOR UPDATE`); review submission idempotent on retry.

---

# 8.7 Host Tooling

## US-7.1 — See upcoming bookings

**Original (from PRD §8.7):** As a host, I want to see my upcoming bookings so that I can prepare for arrivals.

**Acceptance criteria (verbatim):**
- Given I am authenticated as a host, when I open my dashboard, then I see a list of bookings on my listings with status `confirmed` and check-in in the future, sorted by check-in date.

**Enhanced — Implementation tasks:**

### Backend
- [ ] 7.1.1 `BookingService.listUpcomingForHost(hostId)`: returns bookings where `hostId = ?`, `status = CONFIRMED`, `checkIn >= today`, ordered by `checkIn ASC`. Include guest first name + last initial for privacy, listing title, dates.
- [ ] 7.1.2 Endpoint: `GET /api/v1/host/bookings/upcoming` (auth + host role) → `{ data: HostBookingSummaryDTO[] }`.
- [ ] 7.1.3 Endpoint: `GET /api/v1/host/bookings/:id` — full detail (still no PII beyond first name + masked contact).

### Frontend
- [ ] 7.1.4 Add `HostDashboardPage` (`/host`) with upcoming bookings table and listing summary cards.
- [ ] 7.1.5 Empty state copy: "No upcoming bookings yet."
- [ ] 7.1.6 Add `HostBookingDetailPage` (`/host/bookings/:id`).

### Tests
- [ ] 7.1.7 Backend unit: excludes other hosts' bookings; excludes past + cancelled.
- [ ] 7.1.8 Playwright: as host, book the host's listing as another seeded guest, then dashboard shows it.

### DoD
PII minimized in response per [docs/PRD.md](PRD.md) §10 compliance posture.

---

# 8.8 Admin

## US-8.1 — Disable a user

**Original (from PRD §8.8):** As an admin, I want to disable a user so that I can remove bad actors.

**Acceptance criteria (verbatim):**
- Given I am authenticated as an admin, when I disable a user, then that user can no longer log in, their listings (if any) are hidden from search, and existing confirmed bookings are flagged for admin review.

**Enhanced — Implementation tasks:**

### DB
- [ ] 8.1.1 Add `BookingFlag` model: `id`, `bookingId (FK)`, `reason (enum: HOST_DISABLED | GUEST_DISABLED | LISTING_DISABLED)`, `flaggedAt`, `resolvedAt (DateTime?)`, `resolutionNote (text?)`, `flaggedByAdminId (FK User)`.

### Backend
- [ ] 8.1.2 `AdminService.disableUser({ adminId, userId, reason })`:
  - Set `disabledAt = now` on user.
  - For each PUBLISHED listing they own: set `status = DISABLED`.
  - For each CONFIRMED booking they are guest OR host on: create `BookingFlag`.
  - Revoke all refresh tokens.
  - Record audit event `user_disabled`.
- [ ] 8.1.3 `requireAuth` middleware rejects users with `disabledAt != null` (treats as `401 ACCOUNT_DISABLED`).
- [ ] 8.1.4 Endpoints (admin role):
  - `GET /api/v1/admin/users?q=&page=&pageSize=` — list with search by email substring.
  - `POST /api/v1/admin/users/:id/disable` → `204`.
  - `POST /api/v1/admin/users/:id/enable` → `204` (un-disables but does not auto-republish listings).

### Frontend
- [ ] 8.1.5 Add `AdminUsersPage` (`/admin/users`) — table with disable/enable action and a `ConfirmDialog`.
- [ ] 8.1.6 Show disabled badge.

### Tests
- [ ] 8.1.7 Backend unit: disabling a host cascades to listings and flags; refresh tokens revoked.
- [ ] 8.1.8 Integration: disabled user's `/auth/login` returns generic 401; previously issued access token rejected by `requireAuth`.
- [ ] 8.1.9 Playwright: admin disables a host → search no longer shows their listings.

### DoD
Cascade is atomic (transaction); re-enabling does not silently republish listings (host must manually publish).

---

## US-8.2 — Disable a listing

**Original (from PRD §8.8):** As an admin, I want to disable a listing so that I can remove misleading or unsafe inventory.

**Acceptance criteria (verbatim):**
- Given I am authenticated as an admin, when I disable a listing, then it is removed from search and cannot be booked; existing confirmed bookings remain visible to host and guest with a notice.

**Enhanced — Implementation tasks:**

### Backend
- [ ] 8.2.1 `AdminService.disableListing({ adminId, listingId, reason })`:
  - Set `Listing.status = DISABLED`, `disabledAt = now`.
  - For each CONFIRMED booking on that listing with `checkIn >= today`: create `BookingFlag(LISTING_DISABLED)`.
  - Send notice email to guest and host for each flagged booking.
- [ ] 8.2.2 `AdminService.enableListing(listingId)` reverts `status` to `DRAFT` (host must re-publish).
- [ ] 8.2.3 Endpoints:
  - `GET /api/v1/admin/listings?q=&status=&page=` — admin search across all listings.
  - `POST /api/v1/admin/listings/:id/disable` → `204`.
  - `POST /api/v1/admin/listings/:id/enable` → `204`.

### Frontend
- [ ] 8.2.4 Add `AdminListingsPage` (`/admin/listings`) with status filter and disable/enable action.
- [ ] 8.2.5 On booking detail page (guest + host), display a notice banner when the linked listing is `DISABLED`.

### Tests
- [ ] 8.2.6 Backend unit: bookings flagged; search excludes the listing.
- [ ] 8.2.7 Playwright: admin disables a listing → search empty → guest still sees their booking with notice.

### DoD
Notice copy lives in `t('bookings.notice.listingDisabled')`; quality gates green.

---

# Cross-cutting tasks (not tied to a single US)

These exist because multiple stories assume the substrate is already in place. They should land before or alongside US-1.1.

## XC-1 — Monorepo bootstrap
- [ ] XC-1.1 Initialize `pnpm` workspace and Turbo per [CLAUDE.md](../CLAUDE.md) §3 layout.
- [ ] XC-1.2 Scaffold `apps/api/`, `apps/web/`, `packages/db/`, `packages/shared/`, `packages/ui/`, `packages/config/`.
- [ ] XC-1.3 Configure shared ESLint, Prettier, TS configs in `packages/config/`.
- [ ] XC-1.4 Add Husky + commitlint + lint-staged per [CLAUDE.md](../CLAUDE.md) §7.
- [ ] XC-1.5 Add CI workflow `.github/workflows/ci.yml`: install → lint → typecheck → test (with coverage) → e2e → build → `openspec validate --strict`.
- [ ] XC-1.6 Configure branch protection on `main`.
- [ ] XC-1.7 Track as OpenSpec change `init-monorepo`.

## XC-2 — `t()` helper and copy infrastructure
- [ ] XC-2.1 Implement `t(key, params?)` in [`packages/shared/src/strings/index.ts`](../packages/shared/src/strings/index.ts) using a flat key → English string map.
- [ ] XC-2.2 Add lint rule (eslint-plugin custom or `no-literal-string`) to flag JSX string literals outside `t()`.

## XC-3 — Error middleware + envelope
- [ ] XC-3.1 Add global error middleware that maps domain errors to the envelope in [docs/backend-standards.md](backend-standards.md) §Error Response Format.
- [ ] XC-3.2 Add typed error classes: `NotFoundError`, `ValidationError`, `ConflictError`, `ForbiddenError`, `UnauthorizedError`.

## XC-4 — Logger and request context
- [ ] XC-4.1 Add structured logger (pino) with `requestId` middleware.
- [ ] XC-4.2 Redact PII in logs (email, tokens, payment IDs).

## XC-5 — Email infrastructure
- [ ] XC-5.1 Set up Resend client wrapper in [`apps/api/src/infrastructure/email/`](../apps/api/src/infrastructure/email/) with template registry.
- [ ] XC-5.2 Add transactional templates: `verify-email`, `booking-confirmation-guest`, `booking-confirmation-host`, `booking-cancelled-host`, `refund-pending-guest`, `listing-disabled-notice`, `payout-recorded`.

## XC-6 — Stripe infrastructure
- [ ] XC-6.1 Stripe client wrapper in [`apps/api/src/infrastructure/payments/stripe.ts`](../apps/api/src/infrastructure/payments/stripe.ts).
- [ ] XC-6.2 Webhook signature verification middleware.

## XC-7 — Open items from PRD §12 (resolve before specific stories ship)
- [ ] XC-7.1 Decide platform fee percentages (guest service fee bps + host commission bps) — blocks US-4.1.
- [ ] XC-7.2 Decide cancellation policy tiers — blocks US-4.2.
- [ ] XC-7.3 Decide photo storage backend (R2 vs S3 vs Supabase) — blocks US-2.1.
- [ ] XC-7.4 Confirm USD-only assumption is acceptable for MVP launch — blocks Stripe Checkout line-item currency.
- [ ] XC-7.5 Define min/max stay rules per listing — decide MVP or defer.

---

# Mapping to OpenSpec changes (suggested)

A reasonable decomposition into atomic OpenSpec changes, each with its own delta spec and `tasks.md`:

| # | Change ID | Covers | Stories |
|---|-----------|--------|---------|
| 1 | `init-monorepo` | XC-1, XC-2, XC-3, XC-4 | — |
| 2 | `add-identity` | XC-5 (subset: verify-email), US-1.1, US-1.2, US-1.3 | 8.1 |
| 3 | `add-listings` | US-2.1, US-2.2, US-2.3 + signed-URL photo flow | 8.2 |
| 4 | `add-search` | US-3.1, US-3.2 | 8.3 |
| 5 | `add-booking-and-payments` | XC-6, US-4.1, US-4.2, US-5.1 | 8.4, 8.5 |
| 6 | `add-reviews` | US-6.1 | 8.6 |
| 7 | `add-host-tooling` | US-7.1 | 8.7 |
| 8 | `add-admin-tools` | US-8.1, US-8.2, US-5.2 | 8.5, 8.8 |

Each change runs through the four OpenSpec phases per [CLAUDE.md](../CLAUDE.md) §4, with checkpoints from §9.

---

# Non-functional requirements summary

These apply across all stories above. Each capability's specs must demonstrate compliance.

- **Security**: bcrypt (cost 12+); JWT secrets ≥32 chars; refresh tokens in `httpOnly`/`Secure`/`SameSite=Lax` cookies; rate-limit auth endpoints; Stripe webhooks signature-verified; admin endpoints role-gated server-side (never trust client).
- **Performance**: API p95 < 300ms for read endpoints in MVP load (<100 concurrent users); search query < 200ms with the planned indexes.
- **Observability**: structured logs with `requestId`, `userId`, `route`; auth audit events queryable; Stripe webhook events idempotent and traceable.
- **Reliability**: every multi-row write inside a DB transaction; webhook handlers idempotent; no orphan `AvailabilityBlock` rows on failure paths.
- **Privacy**: PII redacted in logs; guest contact info not exposed to hosts beyond first name until a confirmed booking; refund/payout records retained. (Phone exposure rules return when phone collection is promoted out of Post-MVP — `docs/data-model.md` §3.2.)
- **Accessibility (frontend)**: shadcn primitives chosen for keyboard + ARIA support; forms label every input; color contrast ≥ WCAG AA.
- **i18n readiness**: 100% of user-facing strings via `t()` (XC-2.2 lint rule enforces).
- **Test coverage**: ≥80% on changed lines per [CLAUDE.md](../CLAUDE.md) §7 (target 90% per [docs/backend-standards.md](backend-standards.md)).

---

# End of tasks.md
