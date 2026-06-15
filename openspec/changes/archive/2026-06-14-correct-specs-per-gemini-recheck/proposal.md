## Why

The Gemini re-check review (`docs/gemini-adversarial-review-recheck.md`, 2026-06-13) surfaced three corrections needed in the canonical capability specs:

- **Finding 17 (Major / Blocker)**: `openspec/specs/payments/spec.md` says "booking total minus snapshotted host commission" in the "Admin sees amounts owed per host" requirement and scenario. Per `docs/data-model.md` §3.11, `Booking.payoutCents = subtotalCents − hostCommissionCents` (where booking total = `subtotalCents + guestServiceFeeCents`). Implementing the spec as written would pay hosts the guest service fee on top of their subtotal — the platform would lose its entire guest-side margin on every booking.
- **Finding 18 (Minor)**: `openspec/specs/search/spec.md` defines pagination but is silent on sort order. Without a deterministic default, pagination is non-deterministic (later pages can repeat or skip items as the underlying order shifts) and two implementers will pick different orderings.
- **Finding 20 (Major / Blocker)**: `openspec/specs/admin/spec.md` requirement text says re-enable restores "still-active listings" and the scenario says listings "in status `published` are again returned by guest-facing search." `docs/data-model.md` §3.6 invariants say "re-enabling reverts to `DRAFT`, not `PUBLISHED`." Per the conflict-resolution hierarchy in `openspec/project.md` §6, the spec wins by default, but the data-model's behavior is the safer one (forces manual re-review before a previously-disabled listing goes live). Align the spec with the data-model.

All three are corrections to existing spec text/scenarios — no new design space, no new requirements added.

## What Changes

### Payments (Finding 17)

- MODIFY the "Admin sees amounts owed per host" requirement: replace "booking total minus snapshotted host commission" with "subtotal minus snapshotted host commission (equivalent to `Booking.payoutCents` per `docs/data-model.md` §3.11)."
- Tighten the scenario to reference the canonical `Booking.payoutCents` field instead of restating the formula.

### Search (Finding 18)

- ADD a requirement "Search results have a deterministic default sort order" with a default of `createdAt DESC, id ASC` (newest published listings surface first; id tiebreaker keeps pagination deterministic).
- Add scenarios: (a) default sort applied when no sort param is provided, (b) two consecutive pages do not overlap or skip when result set is stable, (c) tiebreaker is applied when two listings share the same `createdAt`.

### Admin (Finding 20)

- MODIFY the "Admin can disable a user" requirement: replace "restoring login access and un-hiding still-active listings" with "restoring login access; listings whose status was transitioned to `DISABLED` by the user-disable cascade revert to `DRAFT` per `docs/data-model.md` §3.6 invariant — the host MUST manually re-publish them."
- MODIFY the "Admin re-enables a previously disabled user" scenario to assert: listings revert to `DRAFT`, NOT `PUBLISHED`, and search does NOT return them until the host re-publishes.
- Tighten the host-disable scenario to assert explicitly that listings transition to `DISABLED` status (not just "hidden") — closing a related gap where the spec said "no longer appear in guest-facing search" without naming the status transition that data-model.md §7.4 invariant 4 already specifies.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `payments`: tighten the "Admin sees amounts owed per host" requirement to fix the math error (subtotal, not booking total).
- `search`: add a new "deterministic default sort order" requirement covering default sort, tiebreaker, and stable pagination.
- `admin`: align the disable-user / re-enable text and scenarios with `docs/data-model.md` §3.6 and §7.4 — explicit listing status transitions on both directions.

## Impact

- **Files added**: `openspec/changes/correct-specs-per-gemini-recheck/` (proposal, design, tasks, three delta specs). After archive, deltas are merged into the three canonical specs.
- **Code affected**: None (no monorepo yet). When the implementing tickets land, TDD will produce tests that match the corrected behavior.
- **APIs / dependencies**: None.
- **Downstream**: Resolves Findings 17, 18, 20 of `docs/gemini-adversarial-review-recheck.md`. No new `[OPEN]` markers added; no existing ones touched.
- **Out of scope**: Findings 14 (already resolved by PR #15 — re-check missed it) and 19 (doc consistency for stay rules — handled separately in this PR via a doc-only commit).
