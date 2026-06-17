# Design: add-booking

## ADR-001: Flat single-tier cancellation policy

**Status**: Accepted (NH-013)

**Context**

`openspec/specs/booking/spec.md` contains an `[OPEN]` marker on the cancellation-policy requirement:

> **[OPEN]** Cancellation policy windows and refund tiers (e.g., full vs. partial vs. zero refund based on days-to-check-in) are not fixed by this baseline. The first booking-implementing ticket MUST resolve these before merging.

The `openspec/project.md §8` tiebreaker anchor was "Airbnb-style 3-tier (flexible / moderate / strict) with simple day-based windows", but the final call rested with Luciano.

**Decision**

NH-013 implements a **flat single-tier cancellation policy**: any guest cancellation of a confirmed booking before check-in creates a `RefundRequest` with `amountCents = Booking.totalChargedCents` and `status = PENDING_ADMIN`. No day-based windows. No partial refunds. Admin manually executes the actual refund via Stripe dashboard.

`RefundRequestStatus` has two values: `PENDING_ADMIN` and `PROCESSED`. The `PROCESSED` transition is recorded by admin tooling in a later ticket.

**Alternatives considered**

| Alternative                                                           | Why rejected                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Airbnb-style 3-tier (flexible / moderate / strict, day-based windows) | Adds significant complexity to the booking create flow (recording the policy tier at creation time), the cancel flow (date arithmetic to determine tier), and the test matrix. For a learning-vehicle MVP with manual admin payouts, this complexity is unjustified — the admin will review every refund regardless. |
| No refund (zero-refund policy for MVP)                                | Legally and reputationally risky even in a pre-launch MVP. Any test user who cancels expects _some_ paper trail of a refund owed.                                                                                                                                                                                    |
| Tiered policy stored as a `CancellationPolicy` table                  | Deferred to post-MVP per `docs/data-model.md §9` question #3 note: "Default: code constants in MVP." With a flat policy there are no constants to manage — the amount is always `totalChargedCents`.                                                                                                                 |

**Rationale**

The MVP goal is to prove the booking loop end-to-end, not to prove the cancellation policy is sophisticated. Flat full-refund-pending-admin keeps guest trust high (they see a refund request immediately), keeps host expectations clear (they receive a cancellation email), and defers all financial automation complexity to a later ticket when Stripe Connect or automated payout tooling is in scope.

**Consequences**

- `RefundRequest.amountCents` is always equal to `Booking.totalChargedCents` in MVP. This invariant is enforced at the service layer but not at the DB layer (no CHECK constraint).
- An admin who processes the refund must manually issue it via the Stripe dashboard and then update `RefundRequest.status` to `PROCESSED` via admin tooling (NH-admin ticket).
- When tiered policies are promoted out of post-MVP, the `CancellationPolicy` model will join the schema and `BookingService.cancelBooking` will need to compute the refund amount from the applicable tier.

---

## Note: BOOKING_HOLD created at PENDING_PAYMENT, not at CONFIRMED

The `AvailabilityBlock (BOOKING_HOLD)` is created in the **same transaction** as the `Booking (PENDING_PAYMENT)` record, **before** Stripe Checkout completes. This is the atomic-booking-creation invariant documented in `docs/data-model.md §7` cross-cutting invariant 1.

**Rationale**: Creating the hold at `PENDING_PAYMENT` prevents two guests from completing Stripe Checkout for the same dates — the second guest's booking-creation call hits the EXCLUDE constraint and receives 409 immediately, before any Stripe session is created for them. If the hold were only created after Stripe confirmation, both guests could start checkout concurrently and the second one would complete payment only to find a double-booking scenario — requiring a more complex compensating transaction or refund. Holding at PENDING_PAYMENT eliminates this problem at the cost of blocking dates for up to 30 minutes for abandoned sessions (see data-model.md §7 invariant 8 — a sweeper job handles PENDING_PAYMENT expiry, tracked as a follow-up).

---

## Note: PlatformFeeConfig placeholder values (finalized in NH-014)

NH-013 seeds `PlatformFeeConfig` with:

```
guestServiceFeeBps = 1500   (15%)
hostCommissionBps  = 300    (3%)
effectiveFrom      = migration timestamp
```

These are placeholder values that anchor the fee computation logic so the booking creation flow can be tested end-to-end. The `openspec/project.md §8` open decisions table lists "Guest service fee % and host commission %" as owned by NH-014 (`add-payments`). When NH-014 merges, it will:

1. Resolve the open decision with Luciano's final values.
2. Insert a new `PlatformFeeConfig` row (higher `effectiveFrom`) without deleting the seed row, so historical bookings always resolve to the config that was active at their `createdAt`.

The lookup helper in `BookingService` always reads the row with the highest `effectiveFrom <= now()`, so swapping to the final values in NH-014 requires only a seed/migration insert, not a code change.

---

## Note: AvailabilityBlock.bookingId FK added in this migration

In the current `packages/db/prisma/schema.prisma`, `AvailabilityBlock.bookingId` is declared as `String?` with a comment noting "FK to Booking added in booking ticket." This migration adds the proper `@relation(fields: [bookingId], references: [id])` annotation and the corresponding FK constraint in the database.

**Impact analysis**:

- Existing `HOST_BLOCK` rows have `bookingId = null`. A nullable FK column accepts null values in Postgres — no data migration required.
- Existing `ADMIN_BLOCK` rows (none in production yet; enum value is for forward compatibility) similarly have `bookingId = null`.
- Only `BOOKING_HOLD` rows will have a non-null `bookingId`; these do not exist until NH-013 ships.

No backfill query is needed. The migration is purely additive.
