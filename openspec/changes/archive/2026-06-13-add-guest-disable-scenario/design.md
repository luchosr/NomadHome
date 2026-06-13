# Design Note: Guest-disable scenario coverage

## Status

Accepted, 2026-06-13.

## Context

There is **no new design decision** in this change. All of the behavior was decided earlier:

- **Requirement text** in `openspec/specs/admin/spec.md` already says "Existing confirmed bookings tied to the disabled user (as guest or host) MUST be flagged for admin review." (Added in the `bootstrap-capability-specs` change.)
- **`GUEST_DISABLED` enum value** exists in `docs/data-model.md` §3.18 `BookingFlagReason`. (Justified by Finding 5 → US-8.3.)
- **Cascade transaction semantics** are specified in `docs/data-model.md` §7.4 invariant 4 (rewritten during Finding 5 to split into host-side and guest-side sub-cases, with the explicit note that a single transaction may produce both flag reasons).
- **User story US-8.3** in `docs/PRD.md` §8.8 motivates the guest-cascade path.

What is missing is **scenario coverage** for those behaviors in the canonical spec. The reviewer (Gemini, 2026-06-13) correctly identified that an implementer using TDD against the admin spec will not write a guest-cascade test, leaving the requirement-text rule unverified.

This change is therefore **purely additive on the existing scenarios**: no requirement text changes, no enum changes, no new user stories.

## What is added

Two scenarios appended to the existing `Admin can disable a user` requirement:

1. **Guest-only cascade** — a user with role `guest` (no host listings) and confirmed future bookings as a guest, disabled by an admin, produces `BookingFlag(GUEST_DISABLED)` rows for each affected booking. Bookings remain `confirmed` (US-8.3 explicitly says the admin decides cancel/refund out-of-band, consistent with US-4.2 and US-5.3).

2. **Dual-role cascade** — a user with both `host` and `guest` roles, listings, and confirmed future bookings on both sides, disabled by an admin in a single transaction, produces both `HOST_DISABLED` rows (for bookings on their listings) and `GUEST_DISABLED` rows (for bookings where they are the guest). Asserts the `data-model.md` §7.4 invariant 4 closing note: "A single transaction may produce both `HOST_DISABLED` and `GUEST_DISABLED` rows when the disabled user is both a host and a guest with active bookings."

## What is preserved

- Requirement text unchanged.
- Existing scenario "Admin disables a host with active listings and bookings" unchanged.
- Existing scenario "Admin re-enables a previously disabled user" unchanged — it is generic across host/guest cases and does not need a guest-specific duplicate.
- The other two requirements in the admin spec ("Admin can disable a listing", "Admin actions require the admin role") unchanged.

## Consequences

- TDD against the admin spec now produces a guest-cascade test from day one.
- No data-model change required; no PRD change required; no `openspec/project.md` change required.
- No `[OPEN]` markers are touched — none of the open decisions tracked in `openspec/project.md` §8 are about admin behavior.

## Follow-ups

None.
