# platform — Delta for host-identity

## ADDED Requirements

### Requirement: Host listings page uses the Gantry Signage identity

The host listings page (`/host/listings`) SHALL render the Gantry Signage
identity in the warm palette with no behavior, route or API change. The page MUST
contain exactly one `h1`, set in black ink, and MUST NOT use an ember title band
or any ember surface. New listing and every Edit action MUST each be a single
link (no `button` nested inside) with the same destination and accessible name as
before, at least 44px tall. Each listing MUST render as a flat row with a 2px ink
edge, a radius of at most 4px, no shadow and no ring, that keeps the
`rounded-card` class. The thumbnail MUST be a 64px square with a 2px ink edge and
no radius: with a photo it MUST show the photo with the listing title as its
alt text, and without one it MUST show an `aria-hidden` bed pictogram for a
property or desk pictogram for a workspace on a stone tile. The confirmed-bookings
count MUST keep its text and render bold in the success colour.

#### Scenario: Header and link actions are single interactive elements

- **GIVEN** a host with two listings at a 1440 px viewport
- **WHEN** the interactive elements are listed
- **THEN** the page has one `h1` and New listing is one `link` to `/host/listings/new` that contains no `button`
- **AND** each Edit is one `link` to `/host/listings/<id>/edit` that contains no `button` and has a height of at least 44px
- **AND** no element on the page has an ember background

#### Scenario: Rows are flat ink panels

- **GIVEN** a list of listings
- **WHEN** the rows are inspected
- **THEN** each row has the `rounded-card` class, a 2px ink border, a radius of at most 4px and no box shadow

#### Scenario: Thumbnail with and without a photo

- **GIVEN** one listing with a photo and one property and one workspace without a photo
- **WHEN** the thumbnails are inspected
- **THEN** every thumbnail has a 2px ink border and a 0 radius
- **AND** the photo thumbnail shows an `img` whose alt text equals the listing title
- **AND** the property tile contains an `aria-hidden` bed pictogram and the workspace tile an `aria-hidden` desk pictogram

#### Scenario: Confirmed bookings count keeps its text

- **GIVEN** a listing with confirmed bookings
- **WHEN** its row is read
- **THEN** the existing confirmed-bookings text is present with the same value and renders bold

### Requirement: Listing status is shown by a shape-coded tag

A shared listing status tag SHALL carry the listing status by shape as well as by
text, using the unchanged label strings, and SHALL replace the pill badge on the
host listings page and the edit listing page. A draft MUST have a dashed ink
edge, a published listing MUST have a solid ink edge and a filled ink marker, and
a disabled listing MUST have a solid muted edge and struck-through text. The tag
MUST NOT be a pill, MUST NOT depend on colour alone and MUST hold its label as
its only text node, with the marker an empty `aria-hidden` element, so that a
strict text query for "Draft" or "Published" matches exactly one element.

#### Scenario: Status is carried by shape

- **GIVEN** one listing in each status
- **WHEN** the status tags are inspected
- **THEN** draft has a dashed border, published has a solid ink border and a marker, and disabled has a solid muted border with `line-through` text
- **AND** each tag's text equals the existing label (exactly "Draft", "Published" or "Disabled") and none has a pill radius

#### Scenario: Status text matches exactly one element

- **GIVEN** the edit listing page of a published listing, and separately of a draft listing
- **WHEN** the page is queried by the exact text "Published" and by the exact text "Draft" respectively
- **THEN** exactly one element matches in each case

#### Scenario: Publishing updates the tag

- **GIVEN** the edit page of a draft listing
- **WHEN** the host presses Publish and the request succeeds
- **THEN** the tag shows "Published" with a solid ink edge and a marker, and the request is made exactly as before

### Requirement: Host bookings page is a flat table with shape-coded booking status

The host bookings page (`/host/upcoming`) SHALL render exactly one `h1` in black
ink and a flat table whose head row has a 2px ink bottom rule and bold ink
headings, whose body rows keep a 1px muted rule, and whose amount cells use
tabular figures. Date and amount formatting MUST NOT change. The booking status
MUST render in a local status tag that carries the status by shape and text with
the unchanged `booking.dashboard.status_*` strings: pending dashed ink edge,
confirmed solid ink edge, cancelled solid muted edge with struck-through text,
completed solid ink edge with a filled marker. The tag MUST NOT be a pill. The
table MUST sit in its own horizontal scroll wrapper so the document never
scrolls horizontally. That wrapper MUST stay non-focusable because no existing
translated string can name it; no new copy is added and the keyboard-scroll gap
is recorded as a follow-up. With no bookings the page MUST render the unchanged
`EmptyState` with the same props.

#### Scenario: Table is flat and scrolls inside its wrapper

- **GIVEN** a host with bookings at a 360 px viewport
- **WHEN** the table is inspected
- **THEN** the head row has a 2px ink bottom border and the headings are bold ink
- **AND** the table is inside a wrapper with horizontal overflow auto, and the document scroll width does not exceed the viewport width

#### Scenario: Booking status is carried by shape

- **GIVEN** one booking in each status
- **WHEN** the status tags are inspected
- **THEN** pending has a dashed border, confirmed a solid ink border, cancelled a solid muted border with `line-through` text and completed a solid ink border with a filled marker
- **AND** each tag's text equals the existing label and none has a pill radius

#### Scenario: Empty list

- **GIVEN** a host with no bookings
- **WHEN** the page renders
- **THEN** the existing empty state shows its existing message and link through the unchanged `EmptyState`

### Requirement: Host screen states are flat panels

The host listings, host bookings and edit listing pages SHALL render their
loading, empty and error states with the existing strings and no new copy. The
loading state MUST be a flat skeleton (no pill, no radius above 2px, no shadow)
marked `aria-busy="true"` and MUST have no `h1`. The host listings empty state
MUST be a dashed 2px ink edge paper panel holding the existing no-listings text
and no call to action. The error state, and the edit listing not-found state,
MUST be a panel inside the page wrapper with `role="alert"`, a 2px solid danger
edge, the danger tint fill and a filled danger tile marked `aria-hidden`, and
MUST contain exactly one `h1` with the existing generic error string. Danger MUST
NOT sit on an ember surface. The conditions that select each state MUST NOT
change.

#### Scenario: Loading is flat

- **GIVEN** the listings, bookings or listing request has not resolved
- **WHEN** the page renders
- **THEN** the skeleton container has `aria-busy="true"`, no `h1`, no pill block, no radius above 2px and no shadow

#### Scenario: Empty listings

- **GIVEN** a host with no listings
- **WHEN** the page renders
- **THEN** the existing no-listings text shows in a panel with a 2px dashed ink border and the page contains no link other than the header New listing action

#### Scenario: Error panels

- **GIVEN** the listings request fails, separately the bookings request fails, and separately the edit page listing is not found
- **WHEN** each page settles
- **THEN** exactly one element has `role="alert"` and it contains one `h1` with the existing generic error text
- **AND** the panel has a 2px solid danger border, the danger tint background and an `aria-hidden` filled tile

### Requirement: Listing form fields share one grammar

The Create listing form and the listing details form SHALL render every field
with a bold ink label, a 2px ink edge, a radius of at most 4px and the paper
raised fill, using shared field-class constants so that `Input`, `select` and
`textarea` controls match. On the Create form each field MUST be wrapped in the
shared form field so that an error renders as the danger left-bar text and the
control shows a danger edge while `aria-invalid` is set; a hint MUST render below
the control with a left bar only when the field has no error. Where the Create
form shows a field error, the control MUST link to it with `aria-describedby`
using the same convention as the login and register forms (the control points at
the error id the shared form field renders); hints and the Edit form, which has no
per-field errors, MUST NOT gain `aria-describedby`. Server, save, publish, upload
and block errors MUST render through the shared form-level error alert with the
same text. The submit and save buttons MUST be at least 44px tall and MUST keep
their disabled conditions. `react-hook-form` registration, `noValidate`,
`valueAsNumber`, `required`, `min`, the `isValid` gate and the submitted payload
MUST NOT change.

#### Scenario: Invalid field shows a danger edge and bar

- **GIVEN** the Create listing form with a field made invalid
- **WHEN** the field is inspected
- **THEN** the control has `aria-invalid="true"` and a danger border, and the error text renders with a left bar in the danger colour
- **AND** the control's `aria-describedby` references the element that holds the error text

#### Scenario: Hint renders only while valid

- **GIVEN** a Create form field that has a hint
- **WHEN** the field is valid, and then becomes invalid
- **THEN** the hint shows with a muted left bar while valid and is replaced by the error when invalid
- **AND** the control has no `aria-describedby` while valid

#### Scenario: Labels and controls match

- **GIVEN** the Create form and the listing details form
- **WHEN** their labels, selects and textareas are inspected
- **THEN** every label is bold ink and every `input`, `select` and `textarea` has a 2px ink border and a radius of at most 4px

#### Scenario: Submit is 44px and keeps its gate

- **GIVEN** the Create form while invalid, while valid and while submitting
- **WHEN** the submit button is inspected
- **THEN** it is at least 44px tall, is disabled while invalid and while submitting, and the submitted payload equals the one sent before this change

#### Scenario: Form-level errors use the shared alert

- **GIVEN** a create, save, publish, upload or block request fails with a message
- **WHEN** the page settles
- **THEN** exactly one element has `role="alert"` and it shows the same message with a 2px solid danger edge, the danger tint fill and a decorative tile

### Requirement: Amenity checkboxes use one square checkbox grid

A single amenity checkbox grid SHALL serve both the Create form and the listing
details form. Each amenity MUST remain a native checkbox input (role, checked
state, label click, Space key and form state unchanged) drawn as a square box with
a 2px ink edge and no radius, filling with ink when checked and showing an
`aria-hidden` paper check glyph. Each item MUST have a target at least 44px tall.
The grid props, the amenity list and the toggle behaviour MUST NOT change.

#### Scenario: Checkbox is a real input and toggles

- **GIVEN** the amenity grid with one amenity selected
- **WHEN** the checkboxes are listed and the user clicks a label and presses Space on another checkbox
- **THEN** every amenity is a `checkbox` role element and the checked state follows each interaction
- **AND** the toggle handler runs once per interaction with the same amenity value as before

#### Scenario: Checkbox is a square with a 44px target

- **GIVEN** the amenity grid at a 1440 px viewport
- **WHEN** an unchecked and a checked item are inspected
- **THEN** the box has a 2px ink border and a 0 radius, the checked box fills with ink and shows an `aria-hidden` check glyph
- **AND** each item label is at least 44px tall

#### Scenario: Both forms use the same grid

- **GIVEN** the Create form and the listing details form
- **WHEN** their amenity sections render
- **THEN** both render the shared amenity grid and neither contains inline amenity checkbox markup

### Requirement: Photos and availability cards are flat framed cards

The edit listing page SHALL keep the details form, the photos card and the
availability card inside the card primitive, with a bold ink `h2` per card, no
ember and no shadow. Photos MUST render square with a 2px ink edge and no radius,
with the same alt text as before. Delete actions MUST stay destructive buttons at
least 44px tall. The Upload photo button MUST stay a secondary button with a
solid 2px edge and no inset ring, MUST keep its disabled condition, and the hidden
file input and its ref MUST NOT change. Availability block rows MUST render with
a 2px ink edge and no radius, with the date labels in bold ink and the dates in
tabular ink. The Block action MUST be at least 44px tall and keep its disabled
condition. An upload error MUST render through the shared form-level error alert
instead of the red paragraph and, as the only intended role change, gains
`role="alert"`.

#### Scenario: Photos are framed squares

- **GIVEN** a listing with photos
- **WHEN** the photos are inspected
- **THEN** each has a 2px ink border and a 0 radius and its alt text is unchanged
- **AND** each Delete is a button at least 44px tall

#### Scenario: Upload error is an alert

- **GIVEN** an upload that fails with a message
- **WHEN** the card settles
- **THEN** exactly one element has `role="alert"` and it shows the same message, with no red text outside the token set

#### Scenario: Availability rows are flat

- **GIVEN** a listing with a blocked date range
- **WHEN** the row is inspected
- **THEN** it has a 2px ink border and a 0 radius, and the date inputs keep their labels and values
- **AND** a failed block request shows exactly one `role="alert"` with the same message

### Requirement: Create, Edit and Become host pages use the identity

The Create listing, Edit listing and Become host pages SHALL each contain exactly
one `h1` in black ink and no ember title band. The Edit page status row MUST show
the listing status tag followed by Publish as a primary `button` or Unpublish as a
secondary `button`, with the same handlers, and MUST render a publish error
through the shared form-level error alert on its own line. The Become host page
MUST keep its two fields in the shared form field grammar, MUST render its terms
checkbox as a square 2px ink real checkbox with a 44px target and the shared check
glyph, and MUST render the terms error with the danger left bar and the same text
and no added role. Its server error and submit button MUST stay unchanged.

#### Scenario: One heading per screen

- **GIVEN** the Create, Edit and Become host pages
- **WHEN** each is rendered loaded
- **THEN** each contains exactly one `h1` and none has an ember background

#### Scenario: Publish and Unpublish are real buttons

- **GIVEN** the Edit page of a draft listing and of a published listing
- **WHEN** the status row is inspected
- **THEN** the draft shows a Publish `button` and the published listing shows an Unpublish `button`, each triggering the same request as before

#### Scenario: Terms checkbox and error

- **GIVEN** the Become host form submitted without accepting the terms
- **WHEN** the terms row is inspected
- **THEN** the checkbox is a `checkbox` role element with a 2px ink border, a 0 radius and a target at least 44px tall
- **AND** the existing terms error text shows with a danger left bar and the submit does not send a request

### Requirement: Host text pairings meet WCAG AA

The host screens SHALL meet WCAG 2.1 AA for every text and surface pairing used on
the host listings, host bookings, create, edit and become-host pages and their
cards, tags and states, computed with the WCAG 2.1 formula: normal text 4.5:1,
large text and non-text edges and glyphs 3:1. Danger text MUST sit only on paper
or the danger tint. The off-token `text-red-600` colour MUST NOT be used. Status
MUST NOT be carried by colour alone. No new colour value MAY be introduced.

#### Scenario: Pairings pass computed contrast

- **GIVEN** the pairings ink, muted ink, subtle ink and success on paper, ink pictogram and edge on stone and paper, muted edge on paper and stone, paper on ink, paper on danger, danger on paper, danger on the danger tint, and subtle ink on stone
- **WHEN** their contrast ratios are computed with the WCAG 2.1 formula
- **THEN** every text pairing is at least 4.5:1 and every edge or glyph pairing at least 3:1

#### Scenario: No off-token danger colour

- **GIVEN** the host pages and components
- **WHEN** their class names are searched for `text-red-600`
- **THEN** there is no match

### Requirement: Host screens are usable at 360 px, by keyboard and with reduced motion

The host listings, host bookings, create, edit and become-host pages SHALL render
without document-level horizontal scrolling and without clipped content at a 360
px viewport in every state, including long titles, city names and guest emails;
only the host bookings table MAY scroll, inside its own wrapper. The header New
listing action MUST be full width at 360 px. Keyboard focus order MUST follow the
visual order, every call to action MUST be one tab stop, and every interactive
element, including selects, textareas and checkboxes, MUST show the two-layer focus
ring, which MUST NOT be clipped by a panel. The restyle MUST NOT introduce
animation, and colour transitions MUST be neutralised under
`prefers-reduced-motion: reduce`.

#### Scenario: No horizontal overflow at 360 px

- **GIVEN** each host page at 360 px width
- **WHEN** it is shown loaded with long strings, loading, empty, in error and not found
- **THEN** the document scroll width does not exceed the viewport width
- **AND** the primary action is inside the viewport

#### Scenario: Keyboard focus ring

- **GIVEN** the host listings page and the Create form
- **WHEN** the user tabs to New listing, each Edit and the submit button
- **THEN** each is reached by exactly one tab stop and shows a 3px ink outline with a paper gap ring

#### Scenario: Reduced motion

- **GIVEN** a user with `prefers-reduced-motion: reduce`
- **WHEN** the host pages load and are used
- **THEN** no element inside the page content animates and colour transitions complete without delay

### Requirement: Host restyle changes no behavior

The restyle of the host screens SHALL NOT change routes, API calls, query keys,
mutations, handlers, request payloads, validation, publish rules, uploads, status
logic, the set of `t()` keys, the text of any existing string, the API client,
`packages/ui` or any shared primitive, including `EmptyState` and `Modal`. No
data, schema or backend file MUST change. The follow-ups (shared state panel,
shared booking status tag, `Badge` pill, `Link > Button` in `EmptyState` and the
secondary button override, listing photo treatment, the hard-coded photo alt, and
focusable labelled scroll region for the bookings table) MUST be recorded.

#### Scenario: Host flows are unchanged

- **GIVEN** a host creating a listing, publishing it, blocking a date range and becoming a host
- **WHEN** each flow is completed
- **THEN** the same requests with the same payloads are sent and the same redirects happen as before this change

#### Scenario: Dictionary is unchanged

- **GIVEN** the English dictionary before and after this change
- **WHEN** the `host.listings`, `host.bookings`, `host.photos`, `host.availability`, `identity.become_host`, `booking.dashboard.status_*` and `error.generic.unexpected` keys are compared
- **THEN** their keys and values are identical

#### Scenario: No backend, client or shared change

- **GIVEN** the change diff against `origin/main`
- **WHEN** the changed paths are listed
- **THEN** none is under `apps/api/`, `packages/db/`, `packages/shared/`, `packages/ui/` or `apps/web/src/api/`

#### Scenario: Follow-ups are recorded

- **GIVEN** the change design and the pull request description
- **WHEN** they are read
- **THEN** they list the shared state panel, the shared booking status tag, the `Badge` pill, the nested link and button issue (#138), listing photos (#121), the hard-coded photo alt and the bookings table scroll region
