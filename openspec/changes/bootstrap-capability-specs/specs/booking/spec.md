## ADDED Requirements

### Requirement: Guest can instant-book a listing

The system SHALL allow an authenticated guest to book a `published` listing for a date range that has full availability. On successful payment the booking SHALL transition to status `confirmed`, the booked dates SHALL be marked unavailable on the listing, the guest service fee and host commission SHALL be snapshotted onto the booking record, and confirmation emails SHALL be dispatched to both the guest and the host.

The MVP supports instant booking only; there is no host approval step.

#### Scenario: Guest completes Stripe Checkout for an available listing

- **GIVEN** an authenticated guest
- **AND** a `published` listing with full availability for the requested range `[check_in, check_out)`
- **WHEN** the guest confirms the booking and completes Stripe Checkout successfully
- **THEN** a booking record is created with status `confirmed`
- **AND** the booked range is marked unavailable on the listing
- **AND** the booking record includes a snapshot of the guest service fee and the host commission that applied at booking time
- **AND** a confirmation email is dispatched to the guest
- **AND** a confirmation email is dispatched to the host

#### Scenario: Booking attempt loses race to another guest

- **GIVEN** two guests attempting to book the same listing for overlapping ranges concurrently
- **WHEN** one Stripe Checkout completes first and the second guest's checkout subsequently completes
- **THEN** at most one booking is in status `confirmed` for any overlapping date
- **AND** the losing guest's payment is either prevented or recorded as a `refund_pending_admin` outcome

### Requirement: Guest can cancel a confirmed booking before check-in

The system SHALL allow a guest to cancel an owned booking whose check-in date is in the future. Cancellation SHALL transition the booking to status `cancelled`, release the dates on the listing's availability, notify the host by email, and record any refund as `pending_admin` (refund execution is manual in MVP).

#### Scenario: Guest cancels a future confirmed booking

- **GIVEN** an authenticated guest who owns a booking with status `confirmed` and check-in date strictly in the future
- **WHEN** the guest cancels the booking
- **THEN** the booking status becomes `cancelled`
- **AND** the previously blocked dates are released on the listing's availability
- **AND** a cancellation email is dispatched to the host
- **AND** any refund owed is recorded with status `pending_admin`

#### Scenario: Guest cannot cancel a booking after check-in has passed

- **GIVEN** a guest who owns a booking with status `confirmed` and check-in date in the past
- **WHEN** the guest attempts to cancel
- **THEN** the system rejects the cancellation
- **AND** the booking remains `confirmed`

### Requirement: Bookings cannot span multiple listings

The system SHALL ensure that a single booking record corresponds to exactly one listing and one continuous date range. Multi-listing carts and multi-leg trips are out of scope for MVP.

#### Scenario: API rejects a booking payload referencing multiple listings

- **GIVEN** a booking creation request referencing more than one listing identifier
- **WHEN** the request is submitted
- **THEN** the system returns a validation error
- **AND** no booking is created

> **\[OPEN]** Cancellation policy windows and refund tiers (e.g., full vs. partial vs. zero refund based on days-to-check-in) are not fixed by this baseline. The first booking-implementing ticket MUST resolve these before merging. See PRD §12.
