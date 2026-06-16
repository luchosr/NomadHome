# Tasks: add-identity-registration

## 1. Database

- [x] 1.1 Add `User`, `EmailVerificationToken`, `AuthAuditEvent` models + `AuthAuditEventType` enum to `packages/db/prisma/schema.prisma` (citext email via postgresqlExtensions)
- [x] 1.2 Generate the `0_init` migration + `migration_lock.toml`
- [x] 1.3 Reconcile `docs/data-model.md` §5 — add `registration_failed` to the enum

## 2. Shared

- [x] 2.1 Add `RegisterSchema` (Zod: email + password policy ≥10/≥1 letter/≥1 digit) and inferred types in `packages/shared/src/schemas/`
- [x] 2.2 Add identity/validation `t()` strings to `packages/shared/src/strings/en.ts`
- [x] 2.3 Vitest: `RegisterSchema` accepts valid input and rejects each policy violation

## 3. Backend

- [x] 3.1 Add `UserRepository` (find by email, create user + verification token) in `apps/api/src/repositories/`
- [x] 3.2 Add `EmailService` interface + `LoggingEmailService` adapter in `apps/api/src/services/`
- [x] 3.3 Add `AuthService.register()` in `apps/api/src/services/` (bcrypt hash, duplicate check, token issue, audit append, no session)
- [x] 3.4 Add auth controller + `POST /auth/register` route, mounted in `app.ts`
- [x] 3.5 Vitest integration tests (against the harness DB, `resetDatabase()` between cases) for the registration scenarios; the persisted verification token stands in for dispatch (default `LoggingEmailService` is a no-op stub)

## 4. Verify

- [x] 4.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green (registration integration tests skip locally without a DB; CI runs them against Postgres)
- [x] 4.2 `openspec validate add-identity-registration --strict` and `node scripts/check-mvp-scope.mjs` pass
