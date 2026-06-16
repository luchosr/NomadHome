# Proposal: add-identity-login

## Why

Registration (`add-identity-registration`) created accounts but no way to use
them — there is no session, no authenticated request, and nothing for later
capabilities to guard routes against. This change adds login: authenticate
credentials and issue a short-lived JWT access token plus a server-side refresh
token, and verify access tokens on protected routes. It also resolves the
long-standing `[OPEN]` access-token TTL decision.

## What

- `POST /auth/login`: verifies the password (bcrypt), rejects invalid credentials
  and disabled accounts with the same generic error (no enumeration), and on
  success returns a 15-minute access JWT + a 30-day refresh token, auditing
  `login_succeeded` / `login_failed`.
- A `RefreshToken` model + migration (server-side, stored as a hash) so refresh
  tokens are revocable. This slice only issues them; rotation/logout come next.
- A `requireAuth` middleware that validates the access JWT, plus a protected
  `GET /auth/me` that returns the current user — enough to exercise access-token
  verification and expiry.

## Impact

- **Capabilities affected**: `identity` (login + access/refresh token issuance);
  `compliance` (audit log).
- **Resolved decision**: access-token TTL = **15 minutes** (project.md §8
  default). The `[OPEN]` marker is removed from the identity spec and the §8 row
  is dropped in this change.
- **Breaking changes**: no.
- **Migration required**: yes — `RefreshToken` table.
- **New config**: `JWT_SECRET` (env), added to `.env.example` and the CI job.
- **Out of scope (→ next slice)**: refresh-token rotation, reuse detection, and
  logout endpoints; email-verification gating; host onboarding. Those scenarios
  remain in the spec, implemented by a follow-up change.

## Risks & Mitigations

| Risk                                               | Likelihood | Mitigation                                                                                  |
| -------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| JWT secret missing/misconfigured in an environment | Medium     | Token service fails fast if `JWT_SECRET` is unset; documented in `.env.example`; set in CI. |
| Login enables enumeration via differing responses  | Medium     | Invalid credentials and disabled accounts return the identical generic error and status.    |
| 15-minute TTL too short/long                       | Low        | Centralized constant; revisit via ADR if telemetry shows friction.                          |

## Rollout

Big bang — no feature flag. Verified by DB-backed integration tests (locally
against Docker Postgres and in CI).
