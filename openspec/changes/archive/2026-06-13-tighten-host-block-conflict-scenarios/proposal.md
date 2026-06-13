## Why

`openspec/specs/listings/spec.md` requirement "Host manages listing availability" has a scenario "Host attempts to block a range overlapping a confirmed booking" that says only "the conflicting booking reference is returned." Finding 15 of `docs/gemini-adversarial-review.md` correctly identifies two gaps:

1. The scenario doesn't say the reference is specifically the `bookingId` — could be interpreted as a free-text reference or a separate identifier.
2. The scenario lumps every overlap into one case, when in practice `docs/data-model.md` §3.10 (tightened during Finding 6 in PR #7) distinguishes `BOOKING_HOLD` overlap (response includes `conflict.bookingId`) from `HOST_BLOCK` overlap (response has no `bookingId` because `HOST_BLOCK` rows have no associated booking).

This is the follow-up I flagged in PR #7 ("Adding a dedicated `Scenario: Host attempts to block a range overlapping a BOOKING_HOLD (PENDING_PAYMENT)` to `openspec/specs/listings/spec.md` would tighten test coverage. Would land via an `add-host-block-conflict-scenarios` OpenSpec change.").

## What Changes

- MODIFY the "Host manages listing availability" requirement to tighten the prose: replace "any existing booking hold or confirmed booking" with "any existing `AvailabilityBlock` regardless of `source`" (the existing wording conflated the booking-status check with the block check, which the data model already deduplicates via §3.11 invariant).
- Replace the vague scenario with a tightened version covering the `BOOKING_HOLD` case explicitly: response is HTTP `409 OVERLAP_CONFLICT`, body follows `docs/data-model.md` §3.10 shape with `conflict.source = "BOOKING_HOLD"`, `conflict.blockId`, and `conflict.bookingId` populated.
- Add a new scenario for the `HOST_BLOCK` overlap case (host re-blocking their own existing range): same `409 OVERLAP_CONFLICT`, body has `conflict.source = "HOST_BLOCK"` and `conflict.blockId` but no `conflict.bookingId`.
- Keep the existing happy-path scenario ("Host blocks an unbooked date range") unchanged.
- No code changes (no monorepo yet).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `listings`: MODIFY the "Host manages listing availability" requirement. Tighten the prose to make the block-source-agnostic rule explicit. Replace the vague overlap scenario with a `BOOKING_HOLD`-specific scenario, and add a `HOST_BLOCK` overlap scenario. The other requirements in the listings spec (`Host can create a listing in draft status`, `Host can publish and unpublish a listing`, `Listing ownership is enforced`) are unchanged.

## Impact

- **Files added**: `openspec/changes/tighten-host-block-conflict-scenarios/` (proposal, design, tasks, delta spec). After archive, the delta is merged into `openspec/specs/listings/spec.md`.
- **Code affected**: None (no monorepo yet). When `add-listings` is implemented, TDD will produce three separate tests for the conflict matrix instead of one vague test.
- **APIs / dependencies**: None.
- **Downstream**: Closes the follow-up I flagged in PR #7 (Finding 6) and resolves Finding 15 of `docs/gemini-adversarial-review.md`.
- **Out of scope**: `ADMIN_BLOCK` overlap scenarios — admin moderation tooling beyond enable/disable is deferred per `openspec/project.md` §3.1 row "Admin"; the data-model §3.10 matrix calls this out and the deferral is explicit. When `ADMIN_BLOCK` is promoted, the scenario can be added via a separate change.
