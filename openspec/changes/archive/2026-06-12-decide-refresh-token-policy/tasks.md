## 1. Decide the policy

- [x] 1.1 Write ADR in `design.md` weighing pure-absolute / pure-sliding / sliding-rotation / sliding-rotation-with-session-cap
- [x] 1.2 Pick option C (sliding rotation + absolute 30-day per-token TTL + reuse detection + per-token logout)

## 2. Modify the identity spec

- [x] 2.1 Author delta `specs/identity/spec.md` modifying the `Access tokens and refresh tokens` requirement: keep existing requirement intro, append the concrete rotation/TTL/reuse/logout rules, tighten the `[OPEN]` marker to access-token TTL only
- [x] 2.2 Keep the two existing scenarios (access-token expiry, refresh-token revocation) and add four new ones: rotation-on-use, absolute-expiry, reuse-triggers-full-revocation, logout-revokes-only-presented
- [x] 2.3 Run `openspec validate decide-refresh-token-policy --strict`

## 3. Propagate the decision to docs

- [x] 3.1 Update `docs/PRD.md` §10 (Compliance) and §12 (Open Questions) to declare the policy and remove any related deferral language
- [x] 3.2 Update `docs/data-model.md` §3.3 to note `JWT_REFRESH_TTL = 30d`

## 4. Close the open decision

- [x] 4.1 Run `openspec archive decide-refresh-token-policy --yes` to materialize the delta into `openspec/specs/identity/spec.md`
- [x] 4.2 Tighten `openspec/project.md` §8 "identity" row to access-token TTL only; update Tiebreaker / Deadline columns
- [x] 4.3 Update `docs/OPEN-DECISIONS.md` synopsis row for `identity`
- [x] 4.4 Mark Finding 9 of `docs/adversarial-review.md` as ✅ RESOLVED + flip summary-table row

## 5. Follow-ups (out of scope for this change)

- [ ] 5.1 Open a follow-up for the periodic prune job that hard-deletes `RefreshToken` rows where `revokedAt < now - 90d`
- [ ] 5.2 Open a follow-up for a `refresh-token-reuse-detected` monitoring signal
- [ ] 5.3 Access-token TTL decision: closed by the first ticket of `add-identity`
