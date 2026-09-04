# Proposal: harden-auth-security-gaps

## Why

GitHub issue #100: two security gaps found in review, both about auth hardening claimed in project docs but never implemented in code.

1. **No rate limiting anywhere in the API.** README claims it in four places (lines 81, 215, 260, 1234-1235/1413 — the last specifically documenting `/auth/register` as "5 requests/minute/IP via express-rate-limit → 429"), but `express-rate-limit` isn't installed and no rate-limit middleware exists anywhere in `apps/api/src`. `/auth/login` — the actual credential-stuffing/brute-force target, more so than register — has zero mitigation and isn't even covered by the one concrete doc that exists.
2. **`JWT_SECRET` has no minimum-length validation.** `apps/api/src/services/token.service.ts`'s `secret()` method only checks the env var is set, never that it's long enough. `docs/tasks.md:134` already documents the intended requirement ("min 32 chars"). A short/weak secret would pass silently, undermining HS256 signature security for every token issued.

Neither gap is documented in `openspec/specs/` today — both are genuinely new requirements, not previously specified and then dropped.

## What

- Add `express-rate-limit` and apply it to `POST /auth/login` and `POST /auth/register`: 5 requests/minute/IP (matching the number already documented for register), responding `429` when exceeded.
- Add a minimum-length check (≥32 characters, matching `docs/tasks.md`'s documented intent) to `TokenService`'s secret-reading. Fails loudly (throws, same as the existing "not set" check) rather than silently accepting a weak secret.

## Impact

- **Capabilities affected**: `compliance` (new requirements: rate limiting on auth endpoints, JWT secret strength validation).
- **Breaking changes**: No for normal operation. Deployments running with a `JWT_SECRET` shorter than 32 characters will start failing at first token issuance after this ships — this is the intended fix, not a regression; flagged as a risk below.
- **Migration required**: No code/data migration. Operationally: whoever manages deploy secrets must confirm `JWT_SECRET` is ≥32 chars before this ships (CI already uses `ci-test-secret` — 14 chars — which will need to change, see Risks).
- **Out of scope**: Rate limiting on any endpoint other than login/register (e.g. booking creation, review submission — not brute-force targets, not driven by an observed gap). A distributed/Redis-backed rate-limit store (MVP is single-instance; `express-rate-limit`'s in-memory default store is sufficient, matches "express-rate-limit" as already named in README). Rotating any currently-deployed weak secret — that's an operational action for whoever holds prod credentials, not something this code change does.

## Risks & Mitigations

| Risk                                                                                                                                | Likelihood                                              | Mitigation                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CI's `JWT_SECRET: ci-test-secret` (13 chars) is now too short once the length check ships, breaking every test that issues a token. | High (certain, if unaddressed)                          | Update `.github/workflows/ci.yml`'s job-level `JWT_SECRET` to a ≥32-char value as part of this change, alongside the code fix.                                                       |
| A real deployed environment has a `JWT_SECRET` shorter than 32 chars today.                                                         | Unknown (no visibility into prod config from this repo) | Not this ticket's problem to fix operationally, but flagging here so whoever merges/deploys checks their env before rollout — this is a fail-loud change by design.                  |
| Rate limiting rejects legitimate rapid retries (e.g. a flaky network causing a user to resubmit login quickly).                     | Low                                                     | 5 req/min/IP is the number already documented and presumably already reviewed/accepted for register; applying the same threshold to login is consistent, not a new arbitrary number. |

## Rollout

Big bang, no flag — closing a documented-but-missing security control, not new user-facing functionality.
