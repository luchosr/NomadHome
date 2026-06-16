# Tasks: add-identity-refresh-logout

## 1. Database

- [x] 1.1 Add `refresh_token_reuse_detected` to the `AuthAuditEventType` enum in `packages/db/prisma/schema.prisma` + migration
- [x] 1.2 Reconcile `docs/data-model.md` §5 with the new enum value

## 2. Shared

- [x] 2.1 Add `RefreshTokenSchema` (`{ refreshToken }`) + inferred type in `packages/shared/src/schemas/`
- [x] 2.2 Vitest: `RefreshTokenSchema` accepts/rejects appropriately

## 3. Backend

- [x] 3.1 Add `TokenService.hashRefreshToken(raw)` for server-side lookup
- [x] 3.2 Extend `UserRepository`: `findRefreshTokenByHash`, `rotateRefreshToken` (transactional), `revokeRefreshToken`, `revokeAllActiveForUser`
- [x] 3.3 Add `AuthService.refresh()` (rotate; reject revoked/expired; reuse → full revoke + audit) and `AuthService.logout()` (revoke presented only)
- [x] 3.4 Add `POST /auth/refresh` + `POST /auth/logout` routes/controllers
- [x] 3.5 Vitest integration tests (DB-backed): rotate, reject-after-revocation, reject-after-expiry, reuse→full-revocation+audit, logout-revokes-only-presented

## 4. Verify

- [x] 4.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green; integration tests run against a local Postgres (16 api tests pass)
- [x] 4.2 `openspec validate add-identity-refresh-logout --strict` and `node scripts/check-mvp-scope.mjs` pass
