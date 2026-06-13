# Design Note: Tighten host-block conflict scenarios

## Status

Accepted, 2026-06-13.

## Context

There is **no new design decision** in this change — the same shape as `add-guest-disable-scenario`. All the behavior was decided earlier:

- The 409 response shape with `conflict.source / blockId / bookingId?` lives in `docs/data-model.md` §3.10 "Overlap-conflict semantics" (added during Finding 6 in PR #7).
- The matrix of which fields are populated for which source is in the same section.
- The `AvailabilityBlock` aggregate boundary is in `docs/data-model.md` §3.10 and §4.

What is missing is **scenario coverage** on the canonical spec so TDD against `openspec/specs/listings/spec.md` produces tests that distinguish the `BOOKING_HOLD` case (response includes `bookingId`) from the `HOST_BLOCK` case (no `bookingId`).

Finding 15 (Gemini, 2026-06-13) correctly identifies that the existing scenario says "the conflicting booking reference is returned" without specifying it is `bookingId` or which conflict source it applies to.

## What is added

Two distinct scenarios on the same requirement, replacing one vague scenario:

1. **BOOKING_HOLD overlap** (replaces the existing scenario, renamed and tightened): a host attempts to block a range overlapping a `BOOKING_HOLD` (whose backing booking is either `PENDING_PAYMENT` or `CONFIRMED`). Response is HTTP `409 OVERLAP_CONFLICT` with body fields `conflict.source = "BOOKING_HOLD"`, `conflict.blockId`, and `conflict.bookingId`.

2. **HOST_BLOCK overlap** (new): a host attempts to block a range overlapping their own existing `HOST_BLOCK`. Response is HTTP `409 OVERLAP_CONFLICT` with `conflict.source = "HOST_BLOCK"` and `conflict.blockId` only — no `conflict.bookingId` because `HOST_BLOCK` rows have no associated booking (per `docs/data-model.md` §3.10 column note: `bookingId nullable, NOT NULL when source = BOOKING_HOLD`).

The `BOOKING_HOLD` scenario covers both backing-booking statuses (`PENDING_PAYMENT` and `CONFIRMED`) because the API response is identical between them — only the host's out-of-band remedy differs (contact guest vs. wait for the 30-minute hold sweeper).

## What is also adjusted

The requirement text "MUST NOT allow a host to block a date range that overlaps any existing booking hold or confirmed booking on the same listing" is replaced with "MUST NOT allow a host to block a date range that overlaps any existing `AvailabilityBlock` on the same listing — regardless of the existing block's `source`." This is a tightening, not a change: the original wording conflated the booking-status check with the block check, when in practice the `BOOKING_HOLD` invariant in `docs/data-model.md` §3.11 ("A `BOOKING_HOLD` row in `AvailabilityBlock` exists iff `Booking.status IN (PENDING_PAYMENT, CONFIRMED)`") already deduplicates that.

## What is preserved

- The "Host blocks an unbooked date range" happy-path scenario is unchanged.
- The other three requirements in the listings spec are unchanged.

## Consequences

- TDD against the listings spec now produces three distinct tests (happy path, BOOKING_HOLD conflict, HOST_BLOCK conflict) instead of one.
- The spec now references `docs/data-model.md` §3.10 for the structured response shape rather than duplicating it. Per `openspec/project.md` §6, the data model is canonical for schema-level behavior — referencing keeps a single source of truth.
- `ADMIN_BLOCK` overlap scenarios are not added — admin-block insertion is out of MVP. When promoted, a follow-up change adds the scenario.

## Follow-ups

None. Eventual `ADMIN_BLOCK` promotion is its own scope-defense conversation per `CLAUDE.md` §9 Checkpoint F.
