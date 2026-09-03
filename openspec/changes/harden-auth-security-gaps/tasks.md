# Tasks: harden-auth-security-gaps

## 1. Backend

- [x] 1.1 Add `express-rate-limit` as a dependency of `apps/api` (check the exact installed version convention other deps use in `apps/api/package.json` — pin similarly).
- [x] 1.2 Add `apps/api/src/middleware/rate-limit.ts` exporting `authRateLimit`: `rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: true, legacyHeaders: false })` (5 req/min/IP, matching the number already documented in README for register).
- [x] 1.3 Apply `authRateLimit` to `POST /auth/login` and `POST /auth/register` in `apps/api/src/routes/auth.ts` (middleware runs before the controller handler, so a throttled request never reaches login/registration logic or the audit log — matches the delta spec).
- [x] 1.4 In `apps/api/src/services/token.service.ts`'s `secret()` method, add a minimum-length check (≥32 characters) alongside the existing "is set" check, throwing a clear error (e.g. `"JWT_SECRET must be at least 32 characters"`) when too short.
- [x] 1.5 Update `.github/workflows/ci.yml`'s job-level `JWT_SECRET: ci-test-secret` (14 chars) to a ≥32-char value, otherwise every test that issues a token starts failing once 1.4 ships.

## 2. Tests

- [x] 2.1 Backend: add a test asserting the 6th `POST /auth/login` request from the same IP within a minute returns 429 (check how existing tests simulate/control source IP — likely via a header or supertest's default, verify the actual rate-limit key strategy works in the test environment before writing assertions against it).
- [x] 2.2 Backend: add the equivalent test for `POST /auth/register`.
- [x] 2.3 Backend: add a `token.service.test.ts` (or extend an existing one) case asserting `TokenService` throws when `JWT_SECRET` is set but shorter than 32 characters, and succeeds when it's exactly 32 or more.
- [x] 2.4 Confirmed this was a real problem, and broader than just the two new-test files: (a) within `auth.login.test.ts`/`auth.register.test.ts` themselves, earlier non-throttle login/register calls counted toward the 5/min budget and made the 429 test's own loop unreliable — fixed with an exported `authRateLimitStore` (`MemoryStore`) reset via `authRateLimitStore.resetAll()` in `beforeEach`; (b) several unrelated pre-existing integration files (e.g. `payment.test.ts`'s `tokenFor()` helper, called 9 times) legitimately call `POST /auth/login` more than 5 times per file to seed multiple users, and were getting 429'd and failing with unrelated 401s. Fixed by making the limiter's `limit` configurable via `AUTH_RATE_LIMIT_MAX` (read per-request, default 5, matching the delta spec exactly when unset — always true in production), set to a generous `1000` suite-wide in `apps/api/vitest.config.ts`'s `test.env`. `auth.login.test.ts`/`auth.register.test.ts` explicitly `delete process.env.AUTH_RATE_LIMIT_MAX` in `beforeAll` (restored in `afterAll`) so they still exercise the real 5 req/min/IP limit end-to-end, not a weakened test-only path.

## 3. Docs & Ops

- [x] 3.1 No `.env.example` change needed — `JWT_SECRET` was already documented; the length requirement is now enforced in code, not just prose.
- [x] 3.2 Production note: whoever manages production secrets must confirm the deployed `JWT_SECRET` is ≥32 chars before this ships, since the new check now fails loudly on the first sign/verify call otherwise (login, refresh, `/auth/me`, etc.). This repo has no visibility into production secret values, so this must be verified out-of-band before deploy. No `design.md` was created for this change — this note is the record.
