# booking — Delta for add-booking-ui

## ADDED Requirements

### Requirement: Booking form page

The web app SHALL provide a `/listings/:id/book` page where an authenticated guest can review the stay summary (listing title, dates, nightly rate, total) and submit to initiate payment.

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

The web app SHALL provide a `/booking/success` page that confirms the booking after Stripe redirects back.

#### Scenario: guest lands on success page

- **Given** Stripe redirects to `/booking/success?bookingId=<id>`
- **When** the page loads
- **Then** the page shows a confirmation message and a link to "My Bookings"

### Requirement: Booking cancel page

The web app SHALL provide a `/booking/cancel` page shown when a guest abandons Stripe Checkout.

#### Scenario: guest abandons checkout

- **Given** Stripe redirects to `/booking/cancel?listingId=<id>`
- **When** the page loads
- **Then** the page shows a "Payment cancelled" message and a link back to the listing detail page
