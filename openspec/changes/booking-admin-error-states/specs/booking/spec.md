# booking — Delta for booking-admin-error-states

## ADDED Requirements

### Requirement: My Bookings shows an error when Complete payment fails

The My Bookings page SHALL show a visible error when starting checkout for a pending booking ("Complete payment") fails. The error message MUST be produced by `getDisplayMessage` and rendered through `ServerErrorAlert`, the same pattern as `CancelBookingModal`. The error MUST be cleared when the guest starts the next Complete payment attempt, and the button MUST become enabled again after the failure so the guest can retry. A successful checkout request MUST still redirect the browser to the returned Stripe Checkout URL exactly as before.

#### Scenario: Checkout request fails

- **Given** an authenticated guest with a booking in `PENDING_PAYMENT`
- **When** they click "Complete payment" and `POST /bookings/:id/checkout` fails
- **Then** an alert with the display message for that error is visible
- **And** no redirect to Stripe occurs

#### Scenario: Guest retries after a failure

- **Given** a Complete payment attempt has failed and its error is visible
- **When** the guest clicks "Complete payment" again
- **Then** the previous error is cleared before the new request resolves
- **And** the button was enabled and clickable after the failure

#### Scenario: Checkout request succeeds

- **Given** an authenticated guest with a booking in `PENDING_PAYMENT`
- **When** they click "Complete payment" and the checkout request returns a URL
- **Then** the browser is redirected to that URL and no error is shown

## MODIFIED Requirements

### Requirement: Booking form page

The web app SHALL provide a `/listings/:id/book` page where an authenticated guest can review the stay summary (listing title, dates, and an itemized price breakdown) before submitting to initiate payment. The check-in and check-out dates in the summary SHALL be rendered through `formatDate` (human-readable), never as raw ISO strings. The page SHALL fetch the price breakdown via `GET /bookings/quote` and display, at minimum: the nightly rate × nights subtotal, the guest service fee as its own line, and a total equal to `subtotalCents + guestServiceFeeCents` — this total SHALL equal the amount subsequently charged at Stripe Checkout. Submitting the form still creates the booking and initiates payment exactly as before, using the ISO values from the query string; the quote is a preview only and does not create a booking itself.

#### Scenario: guest reviews an itemized, fee-inclusive price before paying

- **Given** an authenticated guest is on `/listings/:id/book?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD`
- **When** the page loads
- **Then** it shows the subtotal (nightly rate × nights), a "Service fee" line, and a total
- **And** that displayed total equals `subtotalCents + guestServiceFeeCents` from the quote — the same amount Stripe Checkout will charge

#### Scenario: stay dates are formatted

- **Given** an authenticated guest is on `/listings/:id/book?checkIn=2026-08-01&checkOut=2026-08-04`
- **When** the summary is read
- **Then** the check-in and check-out values equal `formatDate("2026-08-01")` and `formatDate("2026-08-04")`
- **And** the raw strings `2026-08-01` and `2026-08-04` are not shown as text
- **And** the booking request still sends `2026-08-01` and `2026-08-04`

#### Scenario: guest submits booking form

- **Given** an authenticated guest is on `/listings/:id/book?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD`
- **When** they click "Pay now"
- **Then** the app creates a booking via `POST /bookings`, then calls `POST /bookings/:id/checkout`, then redirects the browser to the Stripe Checkout URL

#### Scenario: unauthenticated visitor reaches booking form

- **Given** an unauthenticated visitor navigates to `/listings/:id/book`
- **When** the page loads
- **Then** they are redirected to `/login`

#### Scenario: booking creation fails (overlap)

- **Given** the selected dates are no longer available
- **When** the guest submits the form
- **Then** an inline error "These dates are no longer available." is shown and no Stripe redirect occurs

### Requirement: Booking success page

The web app SHALL provide a `/booking/success` page that reflects the real state of the booking after Stripe redirects back. It SHALL show the confirmation view only when the polled booking status is `CONFIRMED` or `COMPLETED`. When the poll timeout is reached without a confirmed status (including when every poll request failed), it SHALL show a neutral "Still processing" view that does not claim confirmation and links to `/bookings`. When `bookingId` is missing, it SHALL show a neutral "We could not find your booking" view that links to `/bookings` and SHALL NOT poll or call the payment sync. Polling interval, timeout and the payment sync call are unchanged.

#### Scenario: guest lands on success page

- **Given** Stripe redirects to `/booking/success?bookingId=<id>` and the booking status becomes `CONFIRMED` or `COMPLETED`
- **When** the page settles
- **Then** the page shows a confirmation message and a link to "My Bookings"

#### Scenario: payment is not confirmed before the timeout

- **Given** `/booking/success?bookingId=<id>` and the booking stays `PENDING_PAYMENT` until the poll timeout
- **When** the timeout is reached
- **Then** the page shows the "Still processing" view with a link to `/bookings`
- **And** it does not show the confirmation title or confirmation message

#### Scenario: every poll request fails

- **Given** `/booking/success?bookingId=<id>` and every `GET /bookings/:id` request fails until the timeout
- **When** the timeout is reached
- **Then** the page shows the "Still processing" view, not the confirmation view

#### Scenario: booking id is missing

- **Given** the guest opens `/booking/success` without a `bookingId`
- **When** the page loads
- **Then** the page shows "We could not find your booking" with a link to `/bookings`
- **And** no polling request and no payment sync request is made
- **And** the confirmation title is not shown
