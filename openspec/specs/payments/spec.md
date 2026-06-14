# payments Specification

## Purpose

Money-in via Stripe Checkout (no card data on the platform) and money-out via admin-recorded manual payouts. Snapshots platform fee and host commission onto each `Booking` at confirmation time so config changes never alter prior bookings. Owns the `PlatformFeeConfig`, `StripeProcessedEvent`, `RefundRequest`, `Payout`, and `PayoutBooking` aggregates; the `PayoutBooking.bookingId` UNIQUE constraint enforces one-settlement-per-booking.

## Requirements
### Requirement: Guest pays through Stripe Checkout

The system SHALL collect guest payment exclusively through a hosted Stripe Checkout session. The platform MUST NOT collect or persist card numbers, CVCs, or any other PAN data; all such data is handled by Stripe.

The Stripe Checkout session MUST present the host price, the guest service fee, and the total. On successful payment the guest MUST be redirected back to a confirmation page; on cancellation the guest MUST be returned to the listing without a booking being created.

#### Scenario: Guest is redirected to Stripe Checkout for a valid booking

- **GIVEN** an authenticated guest who has selected a `published` listing and a date range with full availability
- **WHEN** the guest proceeds to payment
- **THEN** the guest is redirected to a Stripe Checkout session
- **AND** the session price breakdown displays the host price, the guest service fee, and the total
- **AND** no card data is collected by the NomadHome platform itself

#### Scenario: Successful Checkout finalizes the booking via webhook

- **GIVEN** a guest who has completed a Stripe Checkout session for a pending booking
- **WHEN** Stripe delivers `checkout.session.completed` to the platform webhook
- **THEN** the booking is transitioned to `confirmed`
- **AND** the guest is redirected to the confirmation page on return from Checkout

#### Scenario: Cancelled Checkout leaves no confirmed booking

- **GIVEN** a guest who started a Stripe Checkout session and abandoned it
- **WHEN** the Stripe session expires or the guest cancels
- **THEN** no booking is left in status `confirmed`
- **AND** the dates remain bookable for other guests

### Requirement: Fees are snapshotted at booking time

The system SHALL compute the guest service fee and the host commission at booking creation time, using the platform configuration current at that moment, and SHALL persist both values onto the booking record. Later changes to the configured fee rates MUST NOT alter previously snapshotted bookings.

> **\[OPEN]** Exact guest service fee percentage and host commission percentage are not fixed by this baseline. They are platform configuration (e.g., environment variables or a single config table row) and the first payments-implementing ticket MUST resolve their values before merging. See PRD §7 and §12.

#### Scenario: Fee configuration change does not retroactively alter prior bookings

- **GIVEN** a booking confirmed at time `T1` with snapshotted guest service fee `F1` and host commission `C1`
- **WHEN** the platform fee configuration is changed at time `T2 > T1` to `F2 != F1` or `C2 != C1`
- **THEN** the booking's stored fee snapshot remains `F1` and `C1`
- **AND** any subsequent payout calculation for that booking uses `F1` and `C1`

### Requirement: Admin sees amounts owed per host

The system SHALL expose, to authenticated admins only, a per-host view of amounts owed: the sum across the host's bookings of the host portion (booking total minus snapshotted host commission), counting only bookings that have completed (check-out date passed) and are not yet covered by a recorded payout, grouped by currency.

#### Scenario: Admin views payouts dashboard

- **GIVEN** an authenticated user with role `admin`
- **WHEN** the admin opens the payouts view
- **THEN** the response lists each host that has at least one settled, unpaid booking
- **AND** each row shows the total amount owed, grouped by currency
- **AND** the amount owed equals the sum of (booking total − snapshotted host commission) over qualifying bookings

### Requirement: Admin records a manual payout

The system SHALL allow an admin to record that a payout occurred out-of-band (e.g., bank transfer, Wise, PayPal). Recording a payout MUST capture the method, an external reference, the host, the amount, the currency, and the set of bookings the payout covers, and MUST mark those bookings as settled so they no longer appear in the amounts-owed view.

The system MUST prevent the same booking from being attached to more than one payout.

#### Scenario: Admin records a payout against unpaid settled bookings

- **GIVEN** an authenticated admin
- **AND** a host with `N` settled, unpaid bookings totaling amount `A` in a single currency
- **WHEN** the admin records a payout with method, external reference, and the selected booking set
- **THEN** a payout record is created linking those bookings
- **AND** those bookings no longer appear in the amounts-owed view
- **AND** subsequent payouts cannot include any booking already attached to the recorded payout

#### Scenario: Attempted double-payout of a single booking is rejected

- **GIVEN** a booking already attached to a recorded payout
- **WHEN** an admin attempts to include the same booking in a new payout
- **THEN** the operation is rejected with a conflict error
- **AND** no second payout is created

