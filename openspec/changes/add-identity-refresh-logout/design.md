# Design: add-identity-refresh-logout

## Rotation is one transaction

`POST /auth/refresh` on a valid token runs create-new-token + revoke-presented in
a single `prisma.$transaction`, satisfying the spec's atomicity requirement.
`lastUsedAt` on the presented row is set at the same time for forensic context.

## Reuse detection

The endpoint looks the presented token up by its SHA-256 hash:

- not found → 401.
- found, `revokedAt` already set → **reuse**: revoke every row with
  `userId = <user> AND revokedAt IS NULL` in one statement, append
  `refresh_token_reuse_detected` to the audit log, return 401.
- found, not revoked, `expiresAt` in the past → 401 (no rotation).
- found, not revoked, not expired → rotate.

A new `AuthAuditEventType` value `refresh_token_reuse_detected` is required; the
spec mandates the event and the data-model §5 enum did not list it, so the Prisma
enum gains it and the doc is reconciled in this change.

## Logout

`POST /auth/logout` sets `revokedAt` on the presented token only (matched by
hash). Unknown or already-revoked tokens return `204` as well — logout is
idempotent and never leaks whether a token existed.

## Layering

Reuses the NH-006 stack: controller → `AuthService` → `UserRepository` /
`TokenService`. New repository methods: `findRefreshTokenByHash`,
`rotateRefreshToken` (transactional), `revokeRefreshToken`,
`revokeAllActiveForUser`. `TokenService.hashRefreshToken(raw)` exposes the hash
used for lookup.
