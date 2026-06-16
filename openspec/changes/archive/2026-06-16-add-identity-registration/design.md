# Design: add-identity-registration

## Decisions

- **bcrypt cost = 12.** Above the project floor of 10 (`project.md` §4 / compliance
  spec), a common default that balances security and latency. Centralized as a
  constant so a future tuning ticket changes one place.
- **Verification token: random 32-byte secret, stored as a SHA-256 hash, 24h TTL,
  single-use.** Only the hash is persisted (mirrors the refresh-token "store the
  hash, never the raw token" rule). The raw token travels only in the email. The
  consume endpoint is a later slice; this ticket only issues the token.
- **No session at registration.** The access-token TTL `[OPEN]` decision belongs to
  the login slice; registration issues no tokens, so it stays deferred.
- **Email delivery is stubbed.** `EmailService` is an interface; the wired adapter
  (`LoggingEmailService`) logs a dispatch via the structured logger. Real Resend
  delivery is a separate infra ticket. Tests inject a fake that records calls.
- **Enumeration resistance.** Duplicate email returns a generic `409`-style error
  that does not distinguish "email taken" from other failures; the audit log
  records the real reason server-side only.

## Reconciliation

`docs/data-model.md` §5 did not list `registration_failed`, but the identity spec's
duplicate-email scenario requires recording `user.registration_failed`. The Prisma
enum is authoritative once code exists (`project.md` §6 item 4); the data-model doc
is updated in this change to add the value.

## Layering

`routes/auth.ts` → `controllers/auth.controller.ts` (HTTP, Zod parse, IP/UA
extraction) → `services/auth.service.ts` (policy, hashing, token issue, audit) →
`repositories/user.repository.ts` (Prisma). The service depends on repository and
`EmailService` interfaces for testability.
