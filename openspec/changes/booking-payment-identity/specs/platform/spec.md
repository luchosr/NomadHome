# platform — Delta for booking-payment-identity

## ADDED Requirements

### Requirement: Booking form page uses the Gantry Signage identity

The booking form page (`/listings/:id/book`) SHALL render the Gantry Signage
identity in the warm palette with no behavior, route, payment or API change.
The booking summary MUST be a paper panel with a 2px ink edge, a radius of at
most 4px and no shadow. The listing photo, when present, MUST have a 2px ink
edge and no radius. The total MUST sit in an ember band closed by a 2px ink rule
and MUST be set in ink, using the existing strings and the same label and amount
row. The check-in and check-out dates and the service fee MUST remain plain
text with the same values. Pay now MUST remain a `button`, MUST NOT be nested in
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
- **THEN** the text `2026-08-01` and `2026-08-04` and the service fee label are present as plain text

#### Scenario: Pay now and the back action are single interactive elements

- **GIVEN** the loaded booking form
- **WHEN** the interactive elements are listed
- **THEN** Pay now is one `button` and is not a descendant of a link
- **AND** the back action is one `link` to `/listings/<id>` that contains no `button`
- **AND** pressing Pay now creates the booking, requests checkout and redirects to the returned URL exactly as before

#### Scenario: Server error uses the shared alert

- **GIVEN** checkout fails with a message
- **WHEN** the page settles
- **THEN** exactly one element has `role="alert"` and it shows the message with a 2px solid danger edge, the danger tint fill and a decorative filled tile

#### Scenario: Photo is framed

- **GIVEN** a listing with a photo
- **WHEN** the photo is inspected
- **THEN** it has a 2px ink border, a 0 radius and its alt text equals the listing title

### Requirement: Booking form states are sign panels

The booking form SHALL render its no-dates, loading, listing-not-found and error
(quote and generic) states as sign panels using the existing strings and no new
copy. The no-dates state MUST be a solid paper panel with an ink tile, one `h1`
holding the existing message and a single back link. The loading state MUST be a
flat skeleton (no radius above 2px, no pill, no shadow) marked `aria-busy` and
MUST have no `h1`. The not-found and error states MUST each be a panel with
`role="alert"`, a 2px solid danger edge, the danger tint fill and a filled
danger tile, and MUST contain exactly one `h1` with the existing string. Danger
MUST NOT sit on an ember surface. The conditions that select each state MUST NOT
change.

#### Scenario: No dates

- **GIVEN** the booking route without `checkIn` or `checkOut`
- **WHEN** the page renders
- **THEN** one `h1` shows the existing select-dates message in a paper panel with a solid 2px ink edge
- **AND** a single link back to the listing is present and the page has no `role="alert"`

#### Scenario: Loading is flat

- **GIVEN** the listing request has not resolved
- **WHEN** the page renders
- **THEN** the skeleton container has `aria-busy="true"`, no `h1`, no pill block, no radius above 2px and no shadow

#### Scenario: Listing not found and quote error are alert panels

- **GIVEN** the listing request fails with a 404, and separately the quote request fails
- **WHEN** the page settles
- **THEN** exactly one element has `role="alert"` and it contains one `h1` with the existing not-found text or the existing generic error text respectively
- **AND** the panel has a 2px solid danger border, the danger tint background and an `aria-hidden` filled tile

### Requirement: Booking success page is a sign panel

The booking success page SHALL render the success state, including the
no-`bookingId` and timed-out paths that show the same success copy today, as an
ember sign panel with a 2px ink edge, an ink-filled check tile and **ink** text
only, using the existing strings. The booking id MUST remain one text node
`#<id>`. The view-bookings action MUST be a single link to `/bookings` on a paper
area of the panel, not on the ember surface. The waiting state MUST be a dashed
2px ink edge stone panel with `role="status"` and `aria-busy="true"`, the
existing processing string and a flat skeleton. The page MUST contain exactly
one `h1` in the success state. Polling, payment sync, the timeout and the state
logic MUST NOT change.

#### Scenario: Confirmed booking

- **GIVEN** a booking id whose booking is confirmed
- **WHEN** the page settles
- **THEN** one `h1` shows the existing success title inside an ember panel with a 2px ink edge and an `aria-hidden` ink tile
- **AND** the computed colour of every text node on the ember surface equals the ink token
- **AND** the text `#<bookingId>` is a single text node and the view-bookings link points to `/bookings` and contains no `button`

#### Scenario: Missing booking id and timeout show the same panel

- **GIVEN** the page opened without a booking id, and separately a polling run that reaches its timeout
- **WHEN** the page settles
- **THEN** the same ember success panel and existing success copy render, as before this change

#### Scenario: Waiting panel

- **GIVEN** a booking id that is not yet confirmed
- **WHEN** the page renders
- **THEN** the processing text sits in a stone panel with a 2px dashed ink border, `role="status"` and `aria-busy="true"`
- **AND** the skeleton bars have no radius above 2px
- **AND** the polling and sync calls are made exactly as before

### Requirement: Booking cancel page is a neutral sign panel

The booking cancel page SHALL render a paper sign panel with a 2px ink edge, a
radius of at most 4px, no shadow and no ember or danger colour, an outlined
(unfilled) `aria-hidden` tile, one `h1` and the existing message. The back
action MUST be a single link: to the listing when a `listingId` is present, to
search otherwise, with the existing names and hrefs and no nested `button`.

#### Scenario: Cancel with a listing

- **GIVEN** the page opened with `listingId=abc`
- **WHEN** it renders
- **THEN** one `h1` shows the existing cancel title in a paper panel
- **AND** one link named with the existing back-to-listing text points to `/listings/abc` and contains no `button`

#### Scenario: Cancel without a listing

- **GIVEN** the page opened without a `listingId`
- **WHEN** it renders
- **THEN** one link named with the existing back-to-search text points to `/search`

### Requirement: My bookings uses flat cards and shape-coded status tags

The my-bookings page SHALL render each booking in a flat card with a 2px ink
edge, a radius of at most 4px and no shadow, that keeps the `rounded-card` class.
The booking status MUST render in a status tag that carries the status by shape
as well as by text, using the unchanged label strings: pending payment with a
dashed ink edge, confirmed with a solid ink edge, cancelled with struck-through
text and a solid muted edge, completed with a solid ink edge and a filled
marker. The tag MUST NOT be a pill and MUST NOT depend on colour alone. The
action buttons (complete payment, cancel, review) MUST keep their role, name,
conditions and handlers, and a cancellable booking MUST expose exactly one
button whose name matches "cancel". The loading state MUST be a flat skeleton
(no pill, no radius above 2px) marked `aria-busy`. The error state MUST be a
panel with `role="alert"`, a 2px solid danger edge, the danger tint fill and a
filled danger tile, containing the existing generic error text.

#### Scenario: Cards keep their locator and are flat

- **GIVEN** a list of bookings
- **WHEN** the cards are inspected
- **THEN** each card has the `rounded-card` class, a 2px ink border and no box shadow

#### Scenario: Status is carried by shape

- **GIVEN** one booking in each status
- **WHEN** the status tags are inspected
- **THEN** pending has a dashed border, confirmed a solid ink border, cancelled a solid muted border with `line-through` text and completed a solid ink border with a filled marker
- **AND** each tag's text equals the existing label (for example exactly "Cancelled") and none has a pill radius

#### Scenario: Actions are unchanged

- **GIVEN** a confirmed booking whose check-in is in the future
- **WHEN** the card is read
- **THEN** exactly one button matches the name "cancel" and activating it opens the cancel dialog as before
- **AND** a pending booking shows the complete-payment button and a completed booking shows the review button as before

#### Scenario: Loading and error states

- **GIVEN** the bookings request has not resolved, and separately it fails
- **WHEN** the page renders
- **THEN** the loading skeleton has `aria-busy="true"` and no pill block
- **AND** the failure shows exactly one `role="alert"` panel with a 2px solid danger border, tint fill, filled tile and the existing generic error text

### Requirement: Booking modals and empty state use the identity

`Modal` SHALL render without a shadow, with a 2px ink edge, a radius of at most
4px and a flat backdrop with no blur, and MUST keep its existing behavior
(roles, `aria-modal`, labelling and the absence of added handlers). The cancel
and review dialogs MUST render their textarea with a 2px ink edge and a bold
label, show their error through the shared form-level error alert, and use the
two-layer focus ring. The review rating MUST use a drawn star glyph that is
filled or outlined by selection, is `aria-hidden`, and keeps the button
accessible names ("1 star" to "5 stars") and `aria-pressed`; unicode star
characters MUST NOT be used. The review success message MUST render in a flat
panel and MUST keep the existing delayed close. `EmptyState` MUST render flat
with a 2px dashed ink edge and no radius above 4px, keeping its message, props
and optional link. Restyling MUST NOT claim to fix focus trapping, initial focus
or restore, ESC, backdrop close or scroll lock.

#### Scenario: Modal frame is flat

- **GIVEN** the cancel or review dialog is open
- **WHEN** the dialog surface is inspected
- **THEN** it has a 2px ink border, no box shadow, a radius of at most 4px and a backdrop with no blur
- **AND** its role is `dialog`, `aria-modal` is `true` and it is labelled by its title as before

#### Scenario: Dialog form controls

- **GIVEN** the cancel dialog and the review dialog
- **WHEN** their textareas and labels are inspected
- **THEN** each textarea has a 2px ink border and each label is bold ink
- **AND** a failed submit shows exactly one `role="alert"` with the same message, a solid danger edge and a decorative tile

#### Scenario: Stars are drawn and keep their names

- **GIVEN** the review dialog
- **WHEN** the rating buttons are listed
- **THEN** five buttons are named "1 star", "2 stars", "3 stars", "4 stars" and "5 stars" and each contains an `aria-hidden` SVG and no `★` or `☆` character
- **AND** selecting "4 stars" sets `aria-pressed` on that button and fills four glyphs while the fifth stays an outline

#### Scenario: Review success closes after the delay

- **GIVEN** a review submitted successfully
- **WHEN** the success panel shows
- **THEN** the existing success text renders in a flat panel with a 2px ink edge
- **AND** the success callback runs after the same delay as before

#### Scenario: Empty state

- **GIVEN** a list with no bookings
- **WHEN** the empty state renders
- **THEN** it has a 2px dashed ink border and no `rounded-xl`, shows the existing message and a link to `/search` with the existing label

### Requirement: Booking and payment text pairings meet WCAG AA

The booking and payment screens SHALL meet WCAG 2.1 AA for every text and
surface pairing used on the booking form, success, cancel and my-bookings
pages, the booking modals and the empty state, computed with the WCAG 2.1 formula: normal text 4.5:1, large text and
non-text edges and glyphs 3:1. Ink MUST be the only text colour on the ember
surface; paper, `fg-muted`, `fg-subtle` and danger MUST NOT be used as text on
ember. Danger text MUST sit only on paper or the danger tint. Status MUST NOT be
carried by colour alone.

#### Scenario: Pairings pass computed contrast

- **GIVEN** the pairings ink on ember, ink on paper and stone, muted ink on paper and stone, subtle ink on paper and stone, paper on ink, danger on the danger tint, the muted edge on paper and stone, and the danger and ink edges against their surfaces
- **WHEN** their contrast ratios are computed with the WCAG 2.1 formula
- **THEN** every text pairing is at least 4.5:1 and every edge or glyph pairing at least 3:1

#### Scenario: Only ink text sits on ember

- **GIVEN** the booking form total band and the booking success panel at any viewport
- **WHEN** the computed colour of every text node on the ember surface is resolved
- **THEN** each equals the ink token

### Requirement: Booking and payment screens are usable at 360 px, by keyboard and with reduced motion

The booking and payment screens SHALL render, on the booking form, success,
cancel and my-bookings pages and in the booking dialogs, without horizontal
scrolling and without clipped content at a 360 px viewport in every state, including long titles, city names, booking ids,
cancellation reasons and currency amounts. Keyboard focus order MUST follow the
visual order, every call to action MUST be one tab stop, and every interactive
element MUST show the two-layer focus ring, which MUST NOT be clipped by a
panel. Link actions MUST be at least 44px tall. The restyle MUST NOT introduce
animation, and colour transitions MUST be neutralised under
`prefers-reduced-motion: reduce`.

#### Scenario: No horizontal overflow at 360 px

- **GIVEN** each page at 360 px width
- **WHEN** it is shown loaded (with long strings), loading, empty, not found, in error, waiting and succeeded, and with a dialog open
- **THEN** the document scroll width does not exceed the viewport width
- **AND** the primary action is inside the viewport

#### Scenario: Keyboard focus ring

- **GIVEN** the booking form with a loaded quote, the success page and the cancel page
- **WHEN** the user tabs to Pay now and to each link action
- **THEN** each is reached by exactly one tab stop and shows a 3px ink outline with a paper gap ring

#### Scenario: Reduced motion

- **GIVEN** a user with `prefers-reduced-motion: reduce`
- **WHEN** the pages load and are used
- **THEN** no element inside the page content animates and colour transitions complete without delay

### Requirement: Booking and payment restyle changes no behavior

The restyle of the booking and payment screens SHALL NOT change routes, API
calls, query keys, retry behaviour, request payloads, the checkout redirect,
the payment sync and polling interval and timeout, status logic, the cancellable
rule, the set of `t()` keys, the text of any existing string, the API client,
`packages/ui` or any shared primitive. No data, schema or backend file MUST
change. The modal accessibility gaps (focus trap, initial focus and restore, ESC,
backdrop close, scroll lock) MUST be recorded as a follow-up.

#### Scenario: Payment and booking behavior is unchanged

- **GIVEN** a guest on the booking form with valid dates
- **WHEN** they press Pay now
- **THEN** the booking is created, checkout is requested and the browser is sent to the returned URL, with the same payloads as before
- **AND** the success page polls and syncs on the same interval and timeout as before

#### Scenario: Dictionary is unchanged

- **GIVEN** the English dictionary before and after this change
- **WHEN** the `booking.ui`, `booking.dashboard`, `listings.error.not_found`, `error.generic.unexpected`, `common.loading`, `common.submitting` and `common.action.close` keys are compared
- **THEN** their keys and values are identical

#### Scenario: No backend, client or shared change

- **GIVEN** the change diff against `origin/main`
- **WHEN** the changed paths are listed
- **THEN** none is under `apps/api/`, `packages/db/`, `packages/shared/`, `packages/ui/` or `apps/web/src/api/`

#### Scenario: Follow-ups are recorded

- **GIVEN** the change design and the pull request description
- **WHEN** they are read
- **THEN** they list the modal accessibility gaps, the nested link and button issue (#138), the copy defects and the `Badge` pill follow-ups
