# Proposal: add-identity-refresh-logout

## Why

Login (`add-identity-login`) issues a 30-day refresh token but nothing consumes
it: there is no way to obtain a fresh access token without logging in again, and
no way to log out. The "Access tokens and refresh tokens" requirement already
specifies rotation, reuse detection, and per-token logout in full — this change
implements those scenarios, completing the refresh-token lifecycle.

## What

- `POST /auth/refresh`: rotates a valid refresh token (issues a new access token
  and a new 30-day refresh token, revokes the presented one — atomically), and
  rejects revoked or expired tokens with HTTP 401.
- **Reuse detection**: presenting an already-revoked refresh token revokes every
  active refresh token for that user, records `refresh_token_reuse_detected`, and
  returns 401 — treating reuse as a theft signal.
- `POST /auth/logout`: revokes only the presented refresh token; other sessions
  stay alive.

## Impact

- **Capabilities affected**: `identity` (refresh + logout endpoints); `compliance`
  (reuse-detection audit).
- **Breaking changes**: no.
- **Migration required**: yes — adds `refresh_token_reuse_detected` to the
  `AuthAuditEventType` enum.
- **Docs reconciliation**: `docs/data-model.md` §5 gains the new enum value.
- **Out of scope**: email-verification gating, host onboarding, the admin disable
  cascade (revoking a disabled user's tokens lives in the `admin` capability).

## Risks & Mitigations

| Risk                                                | Likelihood | Mitigation                                                                                                       |
| --------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Rotation race leaves a token half-rotated           | Low        | Create-new + revoke-presented run in a single Prisma transaction.                                                |
| Reuse detection misfires on normal rotation         | Low        | Only a token whose `revokedAt` is already set triggers the cascade; the just-rotated client holds the new token. |
| Timing window where two devices rotate concurrently | Low        | Each device holds a distinct token row; rotation touches only the presented row.                                 |

## Rollout

Big bang — no feature flag. Verified by DB-backed integration tests (locally
against Docker Postgres and in CI).
