# platform — Delta for booking-admin-error-states

## MODIFIED Requirements

### Requirement: Booking success page is a sign panel

The booking success page SHALL render the confirmed state (booking status
`CONFIRMED` or `COMPLETED`) as an ember sign panel with a 2px ink edge, an
ink-filled check tile and **ink** text only, using the existing strings. The
timed-out path and the missing-`bookingId` path MUST NOT render the confirmed
panel or its copy. The timed-out path (including when every poll request failed)
MUST render a neutral "Still processing" stone panel with a 2px ink edge, no
check tile, no ember surface, `role="status"`, and a single link to `/bookings`.
The missing-`bookingId` path MUST render a neutral "We could not find your
booking" stone panel with a 2px ink edge, no check tile, no ember surface, and a
single link to `/bookings`. Both neutral panels use new strings read through
`t()` and MUST NOT contain the confirmation title. The booking id MUST remain
one text node `#<id>` in the confirmed state. The view-bookings action MUST be a
single link to `/bookings` on a paper area of the panel, not on the ember
surface. The waiting state MUST be a dashed 2px ink edge stone panel with
`role="status"` and `aria-busy="true"`, the existing processing string and a
flat skeleton. The page MUST contain exactly one `h1` in each of the confirmed,
still-processing and not-found states. Polling interval, payment sync call and
the timeout duration MUST NOT change; only what is rendered after the timeout
and when `bookingId` is missing changes.

#### Scenario: Confirmed booking

- **GIVEN** a booking id whose booking is confirmed
- **WHEN** the page settles
- **THEN** one `h1` shows the existing success title inside an ember panel with a 2px ink edge and an `aria-hidden` ink tile
- **AND** the computed colour of every text node on the ember surface equals the ink token
- **AND** the text `#<bookingId>` is a single text node and the view-bookings link points to `/bookings` and contains no `button`

#### Scenario: Timeout shows a neutral still-processing panel

- **GIVEN** a booking id and a polling run that reaches its timeout without a confirmed status
- **WHEN** the page settles
- **THEN** one `h1` shows the "Still processing" title in a stone panel with a 2px ink edge, with no `.bg-ember` ancestor and no check tile
- **AND** the confirmation title and message are absent
- **AND** a single link points to `/bookings` and contains no `button`

#### Scenario: Missing booking id shows a neutral not-found panel

- **GIVEN** the page opened without a booking id
- **WHEN** the page loads
- **THEN** one `h1` shows "We could not find your booking" in a stone panel with a 2px ink edge, with no `.bg-ember` ancestor and no check tile
- **AND** a single link points to `/bookings`
- **AND** no polling and no sync call is made

#### Scenario: Waiting panel

- **GIVEN** a booking id that is not yet confirmed
- **WHEN** the page renders
- **THEN** the processing text sits in a stone panel with a 2px dashed ink border, `role="status"` and `aria-busy="true"`
- **AND** the skeleton bars have no radius above 2px
- **AND** the polling and sync calls are made exactly as before

### Requirement: Booking form page uses the Gantry Signage identity

The booking form page (`/listings/:id/book`) SHALL render the Gantry Signage
identity in the warm palette with no route, payment or API change.
The booking summary MUST be a paper panel with a 2px ink edge, a radius of at
most 4px and no shadow. The listing photo, when present, MUST have a 2px ink
edge and no radius. The total MUST sit in an ember band closed by a 2px ink rule
and MUST be set in ink, using the existing strings and the same label and amount
row. The check-in and check-out dates and the service fee MUST remain plain
text; the dates MUST be formatted through `formatDate` and the service fee keeps
the same value. Pay now MUST remain a `button`, MUST NOT be nested in
a link, and MUST keep its handler and disabled conditions. The back action and
the no-dates action MUST each be a single link (no `button` nested inside) with
the same destination and accessible name. A server error MUST render through the
shared form-level error alert with the same text. The page MUST contain exactly
one `h1`.

#### Scenario: Summary is a paper sign panel with an ember total band

- **GIVEN** a booking form with valid dates and a loaded quote at a 1440 px viewport
- **WHEN** the summary is inspected
- **THEN** the panel has a 2px ink border, a radius of at most 4px and no box shadow
- **AND** the total band background resolves to `#E65F35` and its label and amount resolve to the ink token
- **AND** the row that contains the text "Total" also contains the total amount

#### Scenario: Dates and fee stay plain text

- **GIVEN** `checkIn=2026-08-01` and `checkOut=2026-08-04`
- **WHEN** the summary is read
- **THEN** the text `formatDate("2026-08-01")` and `formatDate("2026-08-04")` and the service fee label are present as plain text
- **AND** the raw ISO strings are not shown

#### Scenario: Pay now and the back action are single interactive elements

- **GIVEN** the loaded booking form
- **WHEN** the interactive elements are listed
- **THEN** Pay now is one `button` and is not a descendant of a link
- **AND** the back action is one `link` to `/listings/<id>` that contains no `button`
- **AND** pressing Pay now creates the booking, requests checkout and redirects to the returned URL exactly as before

### Requirement: Booking and payment restyle changes no behavior

The restyle of the booking and payment screens SHALL NOT change routes, API
calls, query keys, retry behaviour, request payloads, the checkout redirect,
the payment sync and polling interval and timeout, the cancellable rule, the
existing `t()` keys, the text of any existing string or the API client. The
success page status rendering after the timeout and when `bookingId` is missing
is governed by the requirement "Booking success page is a sign panel", and
Complete payment error feedback by the `booking` capability. New keys MAY be
added to `booking.ui`; no existing key or value MUST change. No data, schema or
backend file MUST change. The modal accessibility gaps (focus trap, initial
focus and restore, ESC, backdrop close, scroll lock) are closed by the
requirement "Modal is a keyboard-operable modal dialog" and MUST NOT be
recorded as open follow-ups.

#### Scenario: Payment and booking behavior is unchanged

- **GIVEN** a guest on the booking form with valid dates
- **WHEN** they press Pay now
- **THEN** the booking is created, checkout is requested and the browser is sent to the returned URL, with the same payloads as before
- **AND** the success page polls and syncs on the same interval and timeout as before

#### Scenario: Existing dictionary entries are unchanged

- **GIVEN** the English dictionary before and after this change
- **WHEN** the existing `booking.ui`, `booking.dashboard`, `listings.error.not_found`, `error.generic.unexpected`, `common.loading`, `common.submitting` and `common.action.close` keys are compared
- **THEN** their keys and values are identical
- **AND** any added `booking.ui` key is new

#### Scenario: No backend or client change

- **GIVEN** the change diff against `origin/main`
- **WHEN** the changed paths are listed
- **THEN** none is under `apps/api/`, `packages/db/` or `apps/web/src/api/`

#### Scenario: Follow-ups are recorded

- **GIVEN** the change design and the pull request description
- **WHEN** they are read
- **THEN** they list the copy defects and the `Badge` pill follow-ups
- **AND** the nested link and button issue is closed by the single-anchor requirement and the modal accessibility gaps are closed by the modal dialog requirement, and neither is listed as open

### Requirement: Admin restyle changes no behavior

The restyle of the admin screens SHALL NOT change routes, the `RoleGuard`
`admin` condition, API calls, query keys, mutations and their invalidation,
accessible names, the existing `t()` keys, the text of any existing string, the
API client or `Badge`. The Disable and Re-enable handlers and `disabled`
conditions are extended by the `admin` capability requirement "Admin users and
listings pages show pending and error feedback on moderation actions" (per-row
pending disabling and visible failure feedback); that is the only handler and
`disabled` change. No data, schema or backend file MUST change. The moderation
behavior of the `admin` capability is consumed unchanged. The follow-ups (shared
state panel and status tag, the `Badge` pill, per-row accessible names) MUST be
recorded; the secondary button override is closed by the `buttonVariants`
requirements and MUST NOT be recorded as open, and the missing mutation error
handling is closed by the `admin` requirement above and MUST NOT be recorded as
open.

#### Scenario: Admin flows are unchanged

- **GIVEN** an admin disabling and re-enabling an account and a listing
- **WHEN** each action is completed
- **THEN** the same requests with the same arguments are sent and the same queries are invalidated as before this change

#### Scenario: Dictionary is unchanged

- **GIVEN** the English dictionary before and after this change
- **WHEN** the `admin.users`, `admin.listings`, `host.listings.status_*` and `error.generic.unexpected` keys are compared
- **THEN** their keys and values are identical

#### Scenario: No backend or client change

- **GIVEN** the change diff against `origin/main`
- **WHEN** the changed paths are listed
- **THEN** none is under `apps/api/`, `packages/db/` or `apps/web/src/api/`

#### Scenario: Follow-ups are recorded

- **GIVEN** the change design and the pull request description
- **WHEN** they are read
- **THEN** they list the shared state panel and status tag, the `Badge` pill and the per-row accessible names
- **AND** `FLAT_SECONDARY` and the missing mutation error handling are not listed as open
