# booking — Delta for add-guest-dashboard-ui

## ADDED Requirements

### Requirement: Guest bookings dashboard

The web app SHALL provide a `/bookings` page where an authenticated guest can view all their bookings, cancel eligible ones, and submit post-stay reviews.

#### Scenario: guest views bookings list

- **Given** an authenticated guest has bookings in various states
- **When** they navigate to `/bookings`
- **Then** each booking shows listing title, check-in/check-out dates, and a status badge (Pending Payment, Confirmed, Cancelled, Completed)

#### Scenario: guest cancels a confirmed booking

- **Given** a booking in CONFIRMED status with check-in in the future
- **When** the guest clicks "Cancel" and confirms in the modal
- **Then** `POST /bookings/:id/cancel` is called and the booking status updates to CANCELLED in the UI

#### Scenario: guest submits a post-stay review

- **Given** a booking in COMPLETED status with no existing review
- **When** the guest clicks "Leave a review", selects a star rating, and submits
- **Then** `POST /bookings/:id/review` is called with rating and optional text; the "Leave a review" button is hidden on success

## ADDED Requirements

### Requirement: booking list response includes listing title

The `GET /bookings/me` response SHALL include `listing: { title: string }` on each booking row so the guest dashboard can display the property name without additional round-trips.

#### Scenario: listing title present in bookings list

- **Given** a guest has at least one booking
- **When** they call `GET /bookings/me`
- **Then** each item in `data` includes a `listing` object with a `title` string
