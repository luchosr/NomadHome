## Why

`openspec/specs/admin/spec.md` requirement "Admin can disable a user" already covers both the host and guest paths in its requirement *text* ("Existing confirmed bookings tied to the disabled user (as guest or host) MUST be flagged for admin review"), but only provides a *scenario* for the host path ("Admin disables a host with active listings and bookings" → `HOST_DISABLED`). The guest path was named as a coverage-tightening follow-up when Finding 5 of `docs/adversarial-review.md` was resolved and remained tracked as deferred work.

Finding 13 of `docs/gemini-adversarial-review.md` correctly identifies this gap as blocking: an implementer using TDD against the admin spec will not write a test for the guest-disable cascade and will ship without flagging bookings where the disabled user is the guest. The `GUEST_DISABLED` enum value exists in the data model (Finding 5, `docs/data-model.md` §3.18) and the cascade transaction is specified in `data-model.md` §7.4 (Finding 5), but the spec scenario is missing.

## What Changes

- Add a dedicated scenario to the "Admin can disable a user" requirement covering the case where the disabled user has confirmed future bookings as a guest.
- Confirm via scenario that the resulting `BookingFlag` row carries `reason = GUEST_DISABLED`, matching the data model enum and `data-model.md` §7.4 invariant.
- Add a second scenario covering the dual-role case (a user who is both a host with listings AND a guest with future bookings) — the cascade produces both `HOST_DISABLED` and `GUEST_DISABLED` rows in the same transaction, as `data-model.md` §7.4 invariant explicitly allows.
- No code changes (no monorepo yet). This is a scenario coverage tightening on the canonical spec.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin`: MODIFY the existing `Admin can disable a user` requirement to add two new scenarios — `GUEST_DISABLED` cascade and the dual-role case where a single transaction produces both `HOST_DISABLED` and `GUEST_DISABLED` rows. The requirement text and the two existing scenarios (`HOST_DISABLED`, re-enable) are preserved unchanged.

## Impact

- **Files added**: `openspec/changes/add-guest-disable-scenario/` (proposal, design, tasks, delta spec). After archive, the delta is merged into `openspec/specs/admin/spec.md`.
- **Code affected**: None (no monorepo yet). When `add-admin-tools` is implemented, TDD will have a scenario per cascade path.
- **APIs / dependencies**: None.
- **Downstream**: Closes the follow-up I flagged in PR #6 ("Adding a dedicated `GUEST_DISABLED` scenario to the admin spec is a coverage-tightening follow-up") and resolves Finding 13 of `docs/gemini-adversarial-review.md`.
- **Out of scope**: Re-enable scenarios for guest-cascade (the existing "Admin re-enables a previously disabled user" scenario is generic across host/guest cases and does not need duplicating). Cascade behavior for `LISTING_DISABLED` (already specified under the separate "Admin can disable a listing" requirement).
