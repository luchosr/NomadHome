# Proposal: fix-enable-listing-spec

## Why

`openspec/specs/admin/spec.md` contradicts itself on what status a listing ends up in after `PATCH /admin/listings/:id/enable` (GitHub issue #89):

- Line 13 (capability overview): re-enabling a listing "SHALL revert to `Listing.status = DRAFT` — NOT to their pre-disable status, and NOT to `PUBLISHED`. The host MUST manually re-publish."
- Lines 121-129 (Requirement `enable-listing`, scenario "admin enables a listing"): "the listing's `status` is set to `PUBLISHED`."

`docs/data-model.md:175` — a deeper, unconditional source of truth for this column's semantics — settles it: "re-enabling reverts to `DRAFT`, not `PUBLISHED`," with no carve-out for the direct-disable path vs. the cascade path. The implementation (`apps/api/src/repositories/admin.repository.ts:73-78`) already matches this: it sets `DRAFT`. The only place still asserting `PUBLISHED` is the `enable-listing` requirement's scenario text — a spec authoring error, not an implementation bug.

The corresponding test (`apps/api/src/admin-moderation.test.ts`, "sets listing status to PUBLISHED (200)") was skipped in NH-87 pending this resolution, once fixing an unrelated Turbo bug (#87) made the full suite actually run and surfaced the contradiction.

## What

- Correct the `enable-listing` requirement's scenario in `admin/spec.md` to state `DRAFT` (matching the capability overview and `docs/data-model.md`), so the spec is internally consistent.
- Un-skip the test and rename/adjust its assertion to expect `DRAFT` and `disabledAt: null`, matching the corrected spec and the existing (already-correct) implementation.

## Impact

- **Capabilities affected**: `admin` (spec text only).
- **Breaking changes**: No. No implementation code changes — `AdminService.enableListing` already behaves correctly. Only the spec's written contract and one test assertion change to match reality.
- **Migration required**: No.
- **Out of scope**: Any change to `AdminService`/`AdminRepository` behavior. Any change to the cascade-disable/re-enable flow, which is unaffected by this correction.

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Someone relied on the (wrong) `PUBLISHED` scenario text as the intended future behavior rather than a typo. | Low | `docs/data-model.md`'s unconditional invariant and the capability overview both independently agree on `DRAFT`, giving two independent sources against one. |

## Rollout

Big bang, no flag — this is a documentation/spec correction plus un-skipping one test, not a behavior change.
