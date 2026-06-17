# payments Specification

## Purpose

Money-in via Stripe Checkout (no card data on the platform) and money-out via admin-recorded manual payouts. Snapshots platform fee and host commission onto each `Booking` at confirmation time so config changes never alter prior bookings. Owns the `PlatformFeeConfig`, `StripeProcessedEvent`, `RefundRequest`, `Payout`, and `PayoutBooking` aggregates; the `PayoutBooking.bookingId` UNIQUE constraint enforces one-settlement-per-booking.

## Requirements

### Requirement: Guest pays through Stripe Checkout

The system SHALL collect guest payment exclusively through a hosted Stripe Checkout session. The platform MUST NOT collect or persist card numbers, CVCs, or any other PAN data; all such data is handled by Stripe.

The Stripe Checkout session MUST present the host price (`Booking.subtotalCents`), the guest service fee (`Booking.guestServiceFeeCents`), and the total (`Booking.totalChargedCents`) as separate line items. On successful payment the guest MUST be redirected to a confirmation page. On session cancellation or expiry, the guest MUST be returned to the listing page without any booking state change — the booking remains in `PENDING_PAYMENT` with the `BOOKING_HOLD` intact, and the guest may initiate a new Checkout session.

The webhook endpoint `POST /stripe/webhook` handles `checkout.session.completed` events. On receipt of a valid, non-duplicate event the system SHALL: transition the booking to `CONFIRMED`, set `confirmedAt = now()`, set `stripePaymentIntentId` from the event payload, and dispatch confirmation emails to both the guest and the host via `EmailService`.

#### Scenario: Guest is redirected to Stripe Checkout for a valid booking

- **GIVEN** an authenticated guest who owns a booking in `PENDING_PAYMENT` status for a `published` listing
- **WHEN** the guest submits `POST /bookings/:id/checkout`
- **THEN** the system responds `200 OK` with a Stripe Checkout `url`
- **AND** the session price breakdown includes the host price, the guest service fee, and the total as separate line items
- **AND** no card data is collected by the NomadHome platform itself

#### Scenario: Successful Checkout finalizes the booking via webhook

- **GIVEN** a guest who has completed a Stripe Checkout session for a `PENDING_PAYMENT` booking
- **WHEN** Stripe delivers `checkout.session.completed` to `POST /stripe/webhook`
- **THEN** the booking is transitioned to `CONFIRMED`
- **AND** `booking.confirmedAt` is set
- **AND** `booking.stripePaymentIntentId` is set from the event payload
- **AND** a confirmation email is dispatched to the guest
- **AND** a confirmation email is dispatched to the host

#### Scenario: Cancelled or expired Checkout session leaves booking in PENDING_PAYMENT

- **GIVEN** a guest who started a Stripe Checkout session and abandoned or cancelled it
- **WHEN** the Stripe session expires or the guest cancels
- **THEN** the booking remains in `PENDING_PAYMENT` status
- **AND** the `BOOKING_HOLD` for that booking is not released
- **AND** the guest may submit `POST /bookings/:id/checkout` again to start a new session

### Requirement: Fees are snapshotted at booking time

The system SHALL compute the guest service fee and the host commission at booking creation time, using the platform configuration current at that moment, and SHALL persist both values onto the booking record. Later changes to the configured fee rates MUST NOT alter previously snapshotted bookings.

The platform fee rates are fixed at: **guestServiceFeeBps = 1500** (15 % of subtotal) and **hostCommissionBps = 300** (3 % of subtotal). These values are seeded into the `PlatformFeeConfig` table and applied at booking creation. Changes to the config table take effect for new bookings only.

#### Scenario: Fee configuration change does not retroactively alter prior bookings

- **GIVEN** a booking confirmed at time `T1` with snapshotted guest service fee `F1` and host commission `C1`
- **WHEN** the platform fee configuration is changed at time `T2 > T1` to `F2 != F1` or `C2 != C1`
- **THEN** the booking's stored fee snapshot remains `F1` and `C1`
- **AND** any subsequent payout calculation for that booking uses `F1` and `C1`

### Requirement: Admin sees amounts owed per host

The system SHALL expose, to authenticated admins only via `GET /admin/payouts`, a per-host view of amounts owed: the sum across the host's bookings of `Booking.payoutCents`, counting only bookings where status is `CONFIRMED`, `checkOut` date is in the past, and the booking is not yet linked to a `PayoutBooking` row, grouped by currency.

The host portion is NOT computed from the booking total (which equals `subtotalCents + guestServiceFeeCents`). Using booking total would over-pay the host by exactly the guest service fee.

#### Scenario: Admin views payouts dashboard

- **GIVEN** an authenticated user with role `admin`
- **WHEN** the admin submits `GET /admin/payouts`
- **THEN** the system responds `200 OK` listing each host that has at least one settled, unpaid booking
- **AND** each row shows `hostId`, `hostEmail`, `totalOwedCents`, and `currency`
- **AND** the amount owed for each host equals the sum of `Booking.payoutCents` over qualifying bookings (status `CONFIRMED`, `checkOut < today`, not yet in a `PayoutBooking`)
- **AND** the guest service fee is never included in the amount owed

#### Scenario: Non-admin cannot access the payouts dashboard

- **GIVEN** an authenticated user with role `guest` or `host`
- **WHEN** the user submits `GET /admin/payouts`
- **THEN** the system responds `403 Forbidden`

### Requirement: Admin records a manual payout

The system SHALL allow an admin to record that a payout occurred out-of-band via `POST /admin/payouts`. Recording a payout MUST capture: `method` (string, e.g. "bank_transfer"), `externalReference` (string), `hostId`, `amountCents`, `currency`, and `bookingIds` (the set of bookings covered). The system MUST mark those bookings as settled so they no longer appear in the amounts-owed view.

The system MUST prevent the same booking from being attached to more than one payout (`PayoutBooking.bookingId UNIQUE` constraint at DB level).

#### Scenario: Admin records a payout against unpaid settled bookings

- **GIVEN** an authenticated admin
- **AND** a host with `N` settled, unpaid bookings totalling amount `A` in a single currency
- **WHEN** the admin submits `POST /admin/payouts` with method, externalReference, and the selected bookingIds
- **THEN** the system responds `201 Created` with the payout record
- **AND** those bookings no longer appear in `GET /admin/payouts`

#### Scenario: Attempted double-payout of a single booking is rejected

- **GIVEN** a booking already attached to a recorded payout
- **WHEN** an admin attempts to include the same booking in a new payout
- **THEN** the system responds `409 Conflict`
- **AND** no second payout record is created

#### Scenario: Non-admin cannot record a payout

- **GIVEN** an authenticated user with role `guest` or `host`
- **WHEN** the user submits `POST /admin/payouts`
- **THEN** the system responds `403 Forbidden`

### Requirement: Guest can create a Stripe Checkout session for a pending booking

The system SHALL allow an authenticated guest to initiate payment for a booking they own that is in `PENDING_PAYMENT` status by calling `POST /bookings/:id/checkout`. The system SHALL create a Stripe Checkout session with separate line items for the host price (`Booking.subtotalCents`) and the guest service fee (`Booking.guestServiceFeeCents`), store the resulting `stripeCheckoutSessionId` on the booking, and return the Checkout `url` to the caller. If the booking already has a `stripeCheckoutSessionId`, the system SHALL return the existing session URL without creating a new session, provided the Stripe session is not expired.

The system MUST NOT allow checkout session creation if: the booking does not belong to the requesting guest; the booking is not in `PENDING_PAYMENT` status; or the booking does not exist.

#### Scenario: Guest creates a Checkout session for their pending booking

- **GIVEN** an authenticated guest who owns a booking with status `PENDING_PAYMENT`
- **WHEN** the guest submits `POST /bookings/:id/checkout`
- **THEN** the system responds `200 OK` with `{ url: "<stripe-checkout-url>", sessionId: "<stripeCheckoutSessionId>" }`
- **AND** `Booking.stripeCheckoutSessionId` is set to the new session ID
- **AND** the Stripe Checkout session presents two line items: one for the stay amount (`subtotalCents`) and one for the service fee (`guestServiceFeeCents`)

#### Scenario: Guest cannot create a Checkout session for another guest's booking

- **GIVEN** an authenticated guest
- **AND** a booking owned by a different guest
- **WHEN** the guest submits `POST /bookings/:id/checkout`
- **THEN** the system responds `404 Not Found`

#### Scenario: Guest cannot create a Checkout session for a non-pending booking

- **GIVEN** an authenticated guest who owns a booking with status `CONFIRMED` or `CANCELLED`
- **WHEN** the guest submits `POST /bookings/:id/checkout`
- **THEN** the system responds `422 Unprocessable Entity` with error code `BOOKING_NOT_PENDING`

### Requirement: Stripe webhook events are processed exactly once

The system SHALL deduplicate incoming Stripe webhook events using a `StripeProcessedEvent` table keyed on the Stripe event ID (`stripeEventId`). If an event ID has already been processed, the system SHALL respond `200 OK` immediately without reprocessing. This guarantees `checkout.session.completed` does not double-confirm a booking on Stripe retry.

The system MUST verify the Stripe webhook signature using the `STRIPE_WEBHOOK_SECRET` environment variable before processing any event. Requests with an invalid or missing signature MUST be rejected with `400 Bad Request`.

#### Scenario: Duplicate webhook event is ignored

- **GIVEN** a `checkout.session.completed` event with `stripeEventId = "evt_123"` that was already processed
- **WHEN** Stripe delivers the same event again
- **THEN** the system responds `200 OK`
- **AND** the booking is not modified a second time
- **AND** no duplicate `StripeProcessedEvent` row is created

#### Scenario: Webhook with invalid signature is rejected

- **GIVEN** an incoming `POST /stripe/webhook` request with an invalid `Stripe-Signature` header
- **WHEN** the request is received
- **THEN** the system responds `400 Bad Request`
- **AND** no booking state changes occur
