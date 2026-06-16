# Tasks: add-identity-login

## 1. Database

- [x] 1.1 Add the `RefreshToken` model to `packages/db/prisma/schema.prisma` (per `docs/data-model.md` §3.3) and the relation on `User`
- [x] 1.2 Generate the migration

## 2. Shared

- [x] 2.1 Add `LoginSchema` (Zod) + inferred type in `packages/shared/src/schemas/`
- [x] 2.2 Add login `t()` strings to `packages/shared/src/strings/en.ts`
- [x] 2.3 Vitest: `LoginSchema` accepts valid input and rejects malformed input

## 3. Backend

- [x] 3.1 Add `TokenService` (sign 15-min access JWT; mint + hash 30-day refresh token) reading `JWT_SECRET`
- [x] 3.2 Extend `UserRepository` (create refresh token row)
- [x] 3.3 Add `AuthService.login()` (bcrypt compare, reject invalid + disabled with one generic error, issue tokens, audit)
- [x] 3.4 Add `requireAuth` middleware validating the access JWT
- [x] 3.5 Add `POST /auth/login` + protected `GET /auth/me`; mount in `app.ts`
- [x] 3.6 Vitest integration tests (DB-backed): login valid / invalid / disabled, `/auth/me` with valid token, access token rejected after expiry

## 4. Config & decision

- [x] 4.1 Add `JWT_SECRET` to `apps/api/.env.example` and the CI job env
- [x] 4.2 Resolve the access-token TTL `[OPEN]`: record in `design.md`, remove the marker from the delta spec, drop the row from `openspec/project.md` §8 and `docs/OPEN-DECISIONS.md`

## 5. Verify

- [x] 5.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green; integration tests run against a local Postgres (11 api tests pass)
- [x] 5.2 `openspec validate add-identity-login --strict` and `node scripts/check-mvp-scope.mjs` pass
