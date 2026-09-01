# booking — Delta for fix-booking-price-preview

## ADDED Requirements

### Requirement: Guest can preview booking price before creating a booking

The system SHALL allow an authenticated guest to retrieve the exact price breakdown (subtotal, guest service fee, fee-inclusive total) for a published listing and a candidate date range, without creating a booking or writing to the database. Pricing SHALL be computed using the same logic used at booking-creation time (`BookingService.create`), so a previewed price and the eventual charge cannot diverge for the same listing, dates, and fee config. Unlike booking creation, this preview SHALL NOT require the guest's email to be verified — only initiating payment does.

#### Scenario: Guest previews price for a valid date range

- **Given** an authenticated guest and a listing with status `PUBLISHED`
- **When** the guest sends `GET /bookings/quote?listingId=&checkIn=&checkOut=`
- **Then** the system responds `200` with `{ nights, nightlyRateCents, subtotalCents, guestServiceFeeBps, guestServiceFeeCents, totalChargedCents, currency }`
- **And** `subtotalCents` equals `nightlyRateCents * nights`
- **And** `guestServiceFeeCents` equals `floor(subtotalCents * guestServiceFeeBps / 10000)`
- **And** `totalChargedCents` equals `subtotalCents + guestServiceFeeCents`
- **And** no `Booking` record is created

#### Scenario: Guest with unverified email can still preview price

- **Given** an authenticated guest whose `emailVerifiedAt` is `null`
- **When** the guest sends `GET /bookings/quote?listingId=&checkIn=&checkOut=`
- **Then** the system responds `200` with the price breakdown
- **And** no `EMAIL_NOT_VERIFIED` error is returned (previewing a price is not gated the way creating a booking is)

#### Scenario: Quote requested for a nonexistent or unpublished listing

- **Given** a `listingId` that does not exist, or whose status is not `PUBLISHED`
- **When** the guest requests a quote for it
- **Then** the system responds `404 Not Found`

## MODIFIED Requirements

### Requirement: Booking form page

The web app SHALL provide a `/listings/:id/book` page where an authenticated guest can review the stay summary (listing title, dates, and an itemized price breakdown) before submitting to initiate payment. The page SHALL fetch the price breakdown via `GET /bookings/quote` and display, at minimum: the nightly rate × nights subtotal, the guest service fee as its own line, and a total equal to `subtotalCents + guestServiceFeeCents` — this total SHALL equal the amount subsequently charged at Stripe Checkout. Submitting the form still creates the booking and initiates payment exactly as before; the quote is a preview only and does not create a booking itself.

#### Scenario: guest reviews an itemized, fee-inclusive price before paying

- **Given** an authenticated guest is on `/listings/:id/book?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD`
- **When** the page loads
- **Then** it shows the subtotal (nightly rate × nights), a "Service fee" line, and a total
- **And** that displayed total equals `subtotalCents + guestServiceFeeCents` from the quote — the same amount Stripe Checkout will charge

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
