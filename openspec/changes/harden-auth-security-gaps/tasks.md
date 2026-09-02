# Tasks: harden-auth-security-gaps

## 1. Backend

- [ ] 1.1 Add `express-rate-limit` as a dependency of `apps/api` (check the exact installed version convention other deps use in `apps/api/package.json` — pin similarly).
- [ ] 1.2 Add `apps/api/src/middleware/rate-limit.ts` exporting `authRateLimit`: `rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: true, legacyHeaders: false })` (5 req/min/IP, matching the number already documented in README for register).
- [ ] 1.3 Apply `authRateLimit` to `POST /auth/login` and `POST /auth/register` in `apps/api/src/routes/auth.ts` (middleware runs before the controller handler, so a throttled request never reaches login/registration logic or the audit log — matches the delta spec).
- [ ] 1.4 In `apps/api/src/services/token.service.ts`'s `secret()` method, add a minimum-length check (≥32 characters) alongside the existing "is set" check, throwing a clear error (e.g. `"JWT_SECRET must be at least 32 characters"`) when too short.
- [ ] 1.5 Update `.github/workflows/ci.yml`'s job-level `JWT_SECRET: ci-test-secret` (14 chars) to a ≥32-char value, otherwise every test that issues a token starts failing once 1.4 ships.

## 2. Tests

- [ ] 2.1 Backend: add a test asserting the 6th `POST /auth/login` request from the same IP within a minute returns 429 (check how existing tests simulate/control source IP — likely via a header or supertest's default, verify the actual rate-limit key strategy works in the test environment before writing assertions against it).
- [ ] 2.2 Backend: add the equivalent test for `POST /auth/register`.
- [ ] 2.3 Backend: add a `token.service.test.ts` (or extend an existing one) case asserting `TokenService` throws when `JWT_SECRET` is set but shorter than 32 characters, and succeeds when it's exactly 32 or more.
- [ ] 2.4 Confirm existing tests that call login/register repeatedly in a loop (if any — check `auth.login.test.ts`, `auth.register.test.ts`, and any test helper that logs in many users in sequence) don't trip the new rate limit; adjust the rate-limiter's test-environment behavior (e.g. skip/raise the limit when `NODE_ENV=test`) only if this turns out to be a real problem, not preemptively.

## 3. Docs & Ops

- [ ] 3.1 No `.env.example` change needed — `JWT_SECRET` was already documented; the length requirement is now enforced in code, not just prose.
- [ ] 3.2 Note in `design.md` (if created) or this file: whoever manages production secrets must confirm their deployed `JWT_SECRET` is ≥32 chars before this ships, since the new check fails loudly on first token operation otherwise. This repo has no visibility into production secret values.
