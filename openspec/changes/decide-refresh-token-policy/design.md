# ADR: Refresh-token TTL and rotation policy

## Status

Accepted, 2026-06-12.

## Context

`openspec/specs/identity/spec.md` requires refresh tokens to be opaque server-side records that can be revoked, but does not fix:

1. How long an individual refresh token survives.
2. Whether the token is rotated on use, expires on idle, or sits as a long-lived bearer.
3. What happens when a previously-revoked refresh token is presented again.

The data model (`docs/data-model.md` §3.3 `RefreshToken`) supports any of these — `expiresAt`, `revokedAt`, `lastUsedAt` columns exist — so the gap is entirely policy. Finding 9 of `docs/adversarial-review.md` called this out.

## Options considered

### A — Pure absolute TTL, no rotation

Issue refresh token with `expiresAt = now + N days`. Never rotate. User logs in fresh after N days regardless of activity.

- **Pros**: Trivial to implement, no revoked-token-database growth from rotation.
- **Cons**: An exfiltrated token is valid for its entire window. No way to detect compromise short of waiting for expiry. Active users get logged out periodically for no functional reason.

### B — Pure sliding TTL, no rotation (idle timeout)

Issue refresh token with `expiresAt`. On each use, update `expiresAt = now + N days` — the same token row, just push the deadline forward.

- **Pros**: Active users never get logged out. Idle accounts get logged out.
- **Cons**: An exfiltrated token can be kept alive by the attacker forever (they refresh it as often as needed). Indistinguishable from legitimate use. We give up the only cheap signal we have for compromise.

### C — Sliding rotation with absolute TTL per token (chosen)

Issue refresh token with `expiresAt = now + 30d`. On each successful use: revoke the presented token, issue a brand-new token with its own `expiresAt = now + 30d`. The session extends as long as the user keeps using the app within 30-day windows. No single token survives past its individual 30-day window.

Add **reuse detection**: when a refresh token that has *already been revoked* (rotated, logged out, or admin-disabled) is presented, treat it as a theft signal — revoke every active refresh token for that user and return 401.

- **Pros**: Active users never get logged out. Stolen tokens have a maximum 30-day useful window without detection. Detection is automatic via the reuse path (the legitimate client and the attacker will eventually present the same token — whoever loses the race revokes everything). Industry standard (RFC 6819 §5.2.2.3, OAuth 2.0 BCP §4.12).
- **Cons**: Revoked-token database row count grows with active use (mitigated by a periodic prune job — tokens whose `revokedAt < now - 90d` can be hard-deleted). Slightly more complex than A.

### D — Sliding rotation with absolute session cap

Like C, but with an additional cap: even with active rotation, a session that started > 90 days ago forces a fresh login. Requires tracking `originalIssuedAt` (a new column).

- **Pros**: Adds a hard "you must re-prove yourself periodically" floor.
- **Cons**: Requires data-model change (new column). User-friction win is marginal for an MVP whose own existence is short. Could be promoted post-MVP without breaking the C contract.

## Decision

**Option C.** 30-day absolute TTL per token + sliding rotation on use + reuse detection via full revocation + logout-revokes-only-the-presented-token.

## Consequences

- `JWT_REFRESH_TTL = 30d`. The env var name is already in `docs/data-model.md` §3.3.
- The data model needs no schema change. Existing `RefreshToken` columns (`expiresAt`, `revokedAt`, `lastUsedAt`) cover all cases.
- The token-refresh endpoint inserts a new `RefreshToken` row AND sets `revokedAt` on the presented one, in one transaction.
- The reuse-detection path needs a single index lookup on `(userId, revokedAt IS NULL)` to revoke all active tokens. Acceptable cost.
- Logout MUST NOT revoke other refresh tokens of the same user. This is the only way multi-device sessions work.
- A periodic prune job (out of scope for this ADR — tracked as a follow-up) should hard-delete `RefreshToken` rows where `revokedAt < now - 90d` to bound table growth.
- Access-token TTL remains an `[OPEN]` deferral on the identity spec, to be closed by the first ticket of `add-identity` once we can reason about it against real call patterns.

## Follow-ups

- A periodic prune job for revoked `RefreshToken` rows older than 90 days (lands with or after `add-identity`).
- A monitoring signal for "refresh-token-reuse-detected" events (lands with `add-platform-observability`, post-MVP).
- Consider option D's session cap during a future security review; promoting it requires a schema migration.
