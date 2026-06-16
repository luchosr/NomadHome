# Proposal: add-identity-registration

## Why

The `identity` capability is fully specified but unimplemented, and every other
capability (listings, booking, payments, reviews) depends on having real user
accounts. This change ships the first vertical slice of identity — email/password
registration — now that the database test harness (`add-db-test-harness`) makes
DB-backed integration tests possible. It establishes the `User`,
`EmailVerificationToken`, and `AuthAuditEvent` tables that later identity slices
(login, refresh tokens, host onboarding, email verification) build on.

## What

- The first identity migration: `User`, `EmailVerificationToken`, and
  `AuthAuditEvent` models (with the `AuthAuditEventType` enum), per
  `docs/data-model.md`.
- A shared `RegisterSchema` (Zod) enforcing the password policy (≥10 chars, ≥1
  letter, ≥1 digit) — the single source of truth for the request shape.
- A `POST /auth/register` endpoint (controller → `AuthService` → `UserRepository`)
  that hashes the password with bcrypt, creates a `guest` account, issues a
  single-use email-verification token, dispatches a verification email, and
  appends an audit event. Duplicate emails and weak passwords are rejected
  without account creation and without leaking whether an email exists.

## Impact

- **Capabilities affected**: `identity` (registration requirement implemented +
  refined); `compliance` (bcrypt hashing exercised, audit log written).
- **Breaking changes**: no.
- **Migration required**: yes — first identity migration (`0_init`).
- **Docs reconciliation**: `docs/data-model.md` §5 gains the `registration_failed`
  audit event value (required by the identity spec's duplicate-email scenario but
  missing from the baseline enum). Schema wins; the doc is updated in this change.
- **Out of scope**: login, access/refresh tokens, host onboarding, the
  verify-email endpoint, and real email delivery (a logging `EmailService` stub
  ships now; the Resend integration is a separate infra ticket).

## Risks & Mitigations

| Risk                                              | Likelihood | Mitigation                                                                                                      |
| ------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| Hand-crafted baseline migration is wrong          | Low        | Generated via `prisma migrate diff`; CI applies it with `migrate deploy` and runs integration tests against it. |
| Email enumeration via timing/response differences | Medium     | Duplicate-email returns the same generic success-shaped response path; no "email exists" signal.                |
| bcrypt cost too low                               | Low        | Cost fixed at 12 (≥ project floor of 10), recorded in `design.md`.                                              |

## Rollout

Big bang — first identity endpoint. No feature flag. Verified by DB-backed
integration tests in CI.
