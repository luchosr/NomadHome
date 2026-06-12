## Why

`openspec/specs/identity/spec.md` currently carries an `[OPEN]` marker on three deferred decisions (access-token TTL, refresh-token TTL, rotation policy). Finding 9 of `docs/adversarial-review.md` calls out the rotation policy specifically — without a concrete spec, different implementers will pick different policies (rotate on every use vs. expire on idle vs. absolute TTL), with very different security and UX consequences. The data model (`docs/data-model.md` §3.3) already supports any of these via `lastUsedAt`, `expiresAt`, and `revokedAt`, but nobody has committed to which one is correct.

Close two of the three deferred decisions now (refresh-token TTL + rotation policy) so the next ticket on identity can start with a concrete contract. Access-token TTL stays deferred to `add-identity` because that's where the trade-off (security vs. refresh-traffic) is best evaluated against real call patterns.

## What Changes

- Specify a concrete refresh-token policy: **absolute 30-day TTL from issuance, sliding rotation on use, reuse detection via full revocation**.
- Specify logout semantics: revoke only the presented refresh token; other devices stay logged in.
- Tighten the `[OPEN]` marker in the identity spec from three items to one (access-token TTL only).
- No code changes (no app exists yet); this is a doc-and-spec close of an open decision.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `identity`: tighten the existing `Access tokens and refresh tokens` requirement with concrete refresh-token rules and add four new scenarios (rotation-on-use, absolute-expiry, reuse-triggers-full-revocation, logout-revokes-only-presented).

## Impact

- **Files added**: `openspec/changes/decide-refresh-token-policy/` (proposal, design, tasks, delta spec). After archive, the delta is merged into `openspec/specs/identity/spec.md`.
- **Code affected**: None (no monorepo yet).
- **APIs / dependencies**: None.
- **Downstream**: Closes two of the three `[OPEN]` items in the canonical identity spec. `openspec/project.md` §8 row "identity" will be tightened from three deferred decisions to one (access-token TTL). `docs/PRD.md` §10 and §12 get the policy declaration. `docs/data-model.md` §3.3 gets a note linking `JWT_REFRESH_TTL` to the 30-day decision.
- **Out of scope**: access-token TTL stays `[OPEN]` for `add-identity`. Cancellation / fee / pagination / photo-storage / `t(key)` decisions stay deferred.
