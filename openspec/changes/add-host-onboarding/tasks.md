# Tasks: add-host-onboarding

## 1. Database

- [x] 1.1 Add the `HostProfile` model to `packages/db/prisma/schema.prisma` (per `docs/data-model.md` §3.2) + the relation on `User`
- [x] 1.2 Generate the migration

## 2. Shared

- [x] 2.1 Add `BecomeHostSchema` (Zod: `displayName` ≥2, `payoutEmail` email, `acceptedTerms` literal `true`) + inferred type
- [x] 2.2 Add host-onboarding `t()` strings
- [x] 2.3 Vitest: `BecomeHostSchema` accepts valid input and rejects each violation

## 3. Backend

- [x] 3.1 Add `requireRole(...roles)` middleware
- [x] 3.2 Extend `UserRepository`: `createHostProfileAndAddRole` (transactional)
- [x] 3.3 Add `AuthService.becomeHost()` (reject if already host → 409; create profile + add role + audit `role_added`; return fresh access token)
- [x] 3.4 Add `POST /users/me/become-host` (behind `requireAuth`) + mount a `/users` router in `app.ts`
- [x] 3.5 Vitest integration tests (DB-backed): success (roles, profile, audit, new token carries host), already-host → 409, unauthenticated → 401; `requireRole` allows host / 403s a guest

## 4. Verify

- [x] 4.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green; integration tests run against a local Postgres (21 api tests pass)
- [x] 4.2 `openspec validate add-host-onboarding --strict` and `node scripts/check-mvp-scope.mjs` pass
