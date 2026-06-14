## MODIFIED Requirements

### Requirement: Host manages listing availability

The system SHALL allow a host to block date ranges on an owned listing so that those ranges are unavailable for booking. Blocked ranges MUST NOT be bookable by guests and MUST NOT appear as bookable in search results.

The system MUST NOT allow a host to block a date range that overlaps any existing `AvailabilityBlock` on the same listing — regardless of the existing block's `source` (`HOST_BLOCK`, `BOOKING_HOLD`, or `ADMIN_BLOCK`). The DB-level EXCLUDE constraint (`docs/data-model.md` §3.10) guarantees this even under concurrent writes. On overlap, the API SHALL respond with HTTP `409 OVERLAP_CONFLICT` and a structured body matching the response shape defined in `docs/data-model.md` §3.10 — the existing block is left unchanged.

#### Scenario: Host blocks an unbooked date range

- **GIVEN** a host who owns a published listing with no existing bookings or holds in the range `[D1, D2)`
- **WHEN** the host blocks the range `[D1, D2)`
- **THEN** the range is marked unavailable
- **AND** subsequent guest searches that include any date in `[D1, D2)` do not return this listing as bookable for that range

#### Scenario: Host attempts to block a range overlapping a BOOKING_HOLD

- **GIVEN** a host who owns a listing with an `AvailabilityBlock` row of `source = BOOKING_HOLD` covering `[D1, D2)` (whose backing `Booking.status` is `PENDING_PAYMENT` or `CONFIRMED`)
- **WHEN** the host attempts to block any range overlapping `[D1, D2)`
- **THEN** the system returns HTTP `409 OVERLAP_CONFLICT`
- **AND** the response body matches the shape defined in `docs/data-model.md` §3.10, populated with:
   - `conflict.source = "BOOKING_HOLD"`
   - `conflict.blockId` = the existing `AvailabilityBlock.id`
   - `conflict.bookingId` = the backing `Booking.id` so the host can identify and contact the affected guest
   - `conflict.startDate` and `conflict.endDate` echoing the existing block's range
- **AND** the existing `AvailabilityBlock` and its backing `Booking` are left unchanged
- **AND** no new `HOST_BLOCK` row is inserted

#### Scenario: Host attempts to block a range overlapping their own existing HOST_BLOCK

- **GIVEN** a host who owns a listing with an existing `AvailabilityBlock` row of `source = HOST_BLOCK` covering `[D1, D2)`
- **WHEN** the host attempts to block any range overlapping `[D1, D2)`
- **THEN** the system returns HTTP `409 OVERLAP_CONFLICT`
- **AND** the response body matches the shape defined in `docs/data-model.md` §3.10, populated with:
   - `conflict.source = "HOST_BLOCK"`
   - `conflict.blockId` = the existing `AvailabilityBlock.id`
   - `conflict.startDate` and `conflict.endDate` echoing the existing block's range
- **AND** `conflict.bookingId` is **absent** from the response body (the `HOST_BLOCK` row has no associated booking, per `docs/data-model.md` §3.10 column note: `bookingId` is nullable and is NOT NULL only when `source = BOOKING_HOLD`)
- **AND** the existing `HOST_BLOCK` row is left unchanged
- **AND** no new `HOST_BLOCK` row is inserted
