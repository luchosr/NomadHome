## MODIFIED Requirements

### Requirement: Admin sees amounts owed per host

The system SHALL expose, to authenticated admins only, a per-host view of amounts owed: the sum across the host's bookings of the host portion (**subtotal minus snapshotted host commission**, equal to `Booking.payoutCents` per `docs/data-model.md` §3.11), counting only bookings that have completed (check-out date passed) and are not yet covered by a recorded payout, grouped by currency.

The host portion is NOT computed from the booking total (which equals `subtotalCents + guestServiceFeeCents`). Using booking total would over-pay the host by exactly the guest service fee — see the `decide-i18n-key-format`-era ADR `correct-specs-per-gemini-recheck` for the math and the trade-off.

#### Scenario: Admin views payouts dashboard

- **GIVEN** an authenticated user with role `admin`
- **WHEN** the admin opens the payouts view
- **THEN** the response lists each host that has at least one settled, unpaid booking
- **AND** each row shows the total amount owed, grouped by currency
- **AND** the amount owed for each host equals the sum of `Booking.payoutCents` (i.e. `subtotalCents − hostCommissionCents`) over qualifying bookings — qualifying meaning booking status is `confirmed`, check-out date is in the past, and the booking is not yet linked to a `PayoutBooking` row
- **AND** the guest service fee is NEVER included in the amount owed — the platform keeps the entire guest-side fee as revenue
