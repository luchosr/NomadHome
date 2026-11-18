## ADDED Requirements

### Requirement: Link-style buttons render as a single anchor

Link-style buttons SHALL render as exactly one anchor element (call to action,
secondary and tertiary navigation actions) carrying the `buttonVariants`
classes, for example a router `Link` with `className={buttonVariants({ variant })}`.
A `button` element MUST NOT be nested inside a link and a link MUST NOT be nested
inside a `button`. Each such action MUST expose one `link` role, keep its existing
accessible name and `href`, and be reached by exactly one tab stop. Width
extensions such as `w-full sm:w-auto` and `block` MUST be passed as `className`
and merged with the variant classes.

#### Scenario: One anchor, no nested interactive element

- **GIVEN** any screen that renders a link-style action (empty state link, listing detail, host listings, booking form, booking cancel, booking success, verify email)
- **WHEN** the action is queried
- **THEN** it is one `link` with the existing accessible name and `href`
- **AND** the document contains no `a button` and no `button a` descendant pair on that screen

#### Scenario: One tab stop

- **GIVEN** a screen with a link-style action
- **WHEN** the user presses Tab until the action is focused
- **THEN** exactly one tab stop reaches the action and Enter on it navigates to its `href`

#### Scenario: Width extensions merge with the variant

- **GIVEN** a link-style action rendered with `w-full sm:w-auto`
- **WHEN** its class list and computed width are inspected
- **THEN** the width classes are present, the variant classes are present and the width is full at 360 px and auto from the `sm` breakpoint

### Requirement: UI package exports buttonVariants

`@nomadhome/ui` SHALL export `buttonVariants` and its `ButtonVariantProps` type
from the package entry point, with the variants `primary`, `secondary`, `tertiary`
and `destructive` and `primary` as the default. `buttonVariants` MUST carry a
44px minimum height (`min-h-11`) and `no-underline` so that an anchor never
inherits the browser underline, and MUST keep the tertiary `hover:underline`
treatment. It MUST have no router dependency and MUST add no new package
dependency. `Button` MUST consume the same helper, so that the class list of
`buttonVariants({ variant })` is contained in the class list rendered by
`<Button variant>` for every variant.

#### Scenario: Entry point exports the helper

- **GIVEN** the `packages/ui` entry point
- **WHEN** `buttonVariants` and `ButtonVariantProps` are imported from `@nomadhome/ui`
- **THEN** both resolve and `buttonVariants()` returns the primary class list

#### Scenario: Anchor-safe base

- **GIVEN** `buttonVariants({ variant })` for each variant
- **WHEN** the class string is inspected
- **THEN** it contains `min-h-11` and `no-underline`
- **AND** the tertiary string also contains `hover:underline`

#### Scenario: Same classes as Button

- **GIVEN** each variant
- **WHEN** `<Button variant>` is rendered and `buttonVariants({ variant })` is computed
- **THEN** every class in the helper output is present on the rendered button

#### Scenario: No router dependency

- **GIVEN** the `packages/ui` manifest and sources
- **WHEN** they are searched for `react-router` and for new dependencies
- **THEN** no match is found and the dependency list is unchanged

### Requirement: Migrated screens use buttonVariants and keep no local CTA constants

The migrated screens SHALL render their link-style actions through
`buttonVariants`: `EmptyState`, `ListingDetailPage`, `HostListingsPage`,
`BookingFormPage`, `BookingCancelPage`, `BookingSuccessPage` and
`VerifyEmailPage`. They MUST NOT define local CTA class
constants (`CTA_BASE`, `PRIMARY_CTA`, `SECONDARY_CTA`, `TERTIARY_CTA`,
`PRIMARY_LINK`) or `FLAT_SECONDARY`. Routes, hrefs, accessible names, visible
strings and tab order MUST NOT change. The `BookingCancelPage` secondary links
MUST hover to the same `bg-surface-inset` as every other secondary. The
`BookingFormPage` back link MUST use the tertiary variant extended with `px-2
underline hover:no-underline`, so it keeps its padded, underlined-at-rest look.

#### Scenario: Local constants are gone

- **GIVEN** the sources of the seven migrated files
- **WHEN** they are searched for `CTA_BASE`, `PRIMARY_CTA`, `SECONDARY_CTA`, `TERTIARY_CTA`, `PRIMARY_LINK` and `FLAT_SECONDARY`
- **THEN** no match is found

#### Scenario: Migrated actions keep name and destination

- **GIVEN** each migrated screen
- **WHEN** its link-style actions are queried by role and name
- **THEN** each is one `link` with the same accessible name and `href` as before this change

#### Scenario: Back link keeps its look

- **GIVEN** the booking form page
- **WHEN** the back link is inspected
- **THEN** it carries the tertiary variant classes plus `px-2` and `underline` and `hover:no-underline`, and points to `/listings/<id>`

#### Scenario: Cancel page hover is unified

- **GIVEN** the booking cancel page secondary links
- **WHEN** their class list is inspected
- **THEN** they hover to `bg-surface-inset` and carry no `hover:bg-surface-raised`

## MODIFIED Requirements

### Requirement: UI package ships brand base styles and fonts

The system SHALL provide a single shared stylesheet entry point in
`packages/ui` that loads the brand fonts (a self-hosted grotesque display and
text family chosen outside the common default-font list, plus a mono family),
declares the design-token CSS custom properties, and applies base element
styles: the default canvas is the paper surface token, headings use the display
family set solid, and every focusable element (button, link, card, input, select,
textarea and checkbox) exposes the same visible two-layer focus ring, a 3px
outline plus a 2px paper gap layer, that meets WCAG 2.1 AA non-text contrast on
paper, stone, sage, orange and ink surfaces. No primitive or call site MAY
override or replace the gap layer, so a secondary button or a card MUST NOT lose
it. The stylesheet MUST keep the `@tailwind base/components/utilities`
directives.

#### Scenario: Base styles apply the brand canvas and display headings

- **GIVEN** the UI package stylesheet is imported by an app
- **WHEN** the document body and an `h1` are rendered with no extra classes
- **THEN** the body background resolves to the paper surface token and the `h1` uses the display font family

#### Scenario: Focus ring is visible on every surface

- **GIVEN** an interactive element focused by keyboard on a paper, stone, sage, orange, or ink panel
- **WHEN** the focus ring is rendered
- **THEN** it has a contrast ratio of at least 3:1 against its adjacent colors

#### Scenario: Focus ring has two layers on every focusable

- **GIVEN** a primary, a secondary, a tertiary and a destructive button, a link-style action and a card, each focused by keyboard
- **WHEN** the computed outline and box shadow are read
- **THEN** each has a 3px outline and a 2px `--focus-gap` box shadow
- **AND** the same elements show a computed box shadow of `none` when not focused

### Requirement: Shared primitives follow the design system

The system SHALL provide shared React primitives in `packages/ui` that match the
design system: a `Button` supporting `primary`, `secondary`, `tertiary`, and
`destructive` variants, plus `Badge`, `Input`, `Card`, and `Skeleton`
components. The `Button` default variant MUST be the solid ink primary on the
warm panel system, and all primitives MUST be exported from the package entry
point. Every `Button` variant MUST paint its edge with `border-2` and MUST NOT
use a ring or a box shadow at rest; the secondary variant MUST set `border-border`
on that edge and a disabled secondary MUST keep `border-dashed` and
`border-border-muted` at the same 2px width. `Card` MUST render with `border-2`
and `border-border` and no `ring-*` utility, and the shared `FLAT_CARD_CLASS`
override MUST NOT exist. Existing primitive consumers MUST keep working without
prop changes (the `variant` prop is optional and defaults to `primary`); this
change SHALL NOT alter any primitive's public props or behavior, only its
styling and the added `buttonVariants` export.

#### Scenario: Button renders the requested variant

- **GIVEN** the `Button` primitive
- **WHEN** it is rendered with `variant="secondary"`
- **THEN** it renders the secondary (outlined, transparent-fill) treatment
- **AND** rendering with no `variant` prop yields the solid ink primary

#### Scenario: Existing primitive APIs are preserved

- **WHEN** `Button`, `Badge`, `Input`, `Card`, and `Skeleton` are imported from the `packages/ui` entry point
- **THEN** each resolves to a renderable React component accepting the same props as before this change

#### Scenario: Variants have a 2px edge and no ring or shadow

- **GIVEN** each `Button` variant
- **WHEN** its class list is inspected and its computed style is read at rest
- **THEN** it has `border-2`, has no `ring` or `shadow` utility, and its computed box shadow is `none`
- **AND** the secondary variant has `border-border` and no `border` or `ring-1` single-pixel pairing

#### Scenario: Disabled secondary keeps a dashed 2px edge

- **GIVEN** a disabled secondary `Button`
- **WHEN** its class list and computed border are inspected
- **THEN** it has `border-dashed` and `border-border-muted` and a 2px border width

#### Scenario: Card has a 2px edge and no ring

- **GIVEN** a `Card`
- **WHEN** its class list and computed style are inspected
- **THEN** it has `border-2` and `border-border`, no `ring-` utility and a computed box shadow of `none`
- **AND** no source file exports or references `FLAT_CARD_CLASS`

### Requirement: My bookings uses flat cards and shape-coded status tags

The my-bookings page SHALL render each booking in a flat card with a 2px ink
edge, a radius of at most 4px and no shadow, that keeps the `rounded-card` class.
The booking status MUST render in a status tag that carries the status by shape
as well as by text, using the unchanged label strings: pending payment with a
dashed ink edge, confirmed with a solid ink edge, cancelled with struck-through
text and a solid muted edge, completed with a solid ink edge and a filled
marker. The tag MUST NOT be a pill and MUST NOT depend on colour alone. The
action buttons (complete payment, cancel, review) MUST keep their role, name,
conditions and handlers, MUST use the plain `Button` variants with no local
`FLAT_SECONDARY` override and no `![box-shadow:none]` class, and a cancellable
booking MUST expose exactly one button whose name matches "cancel". The loading
state MUST be a flat skeleton (no pill, no radius above 2px) marked `aria-busy`.
The error state MUST be a panel with `role="alert"`, a 2px solid danger edge, the
danger tint fill and a filled danger tile, containing the existing generic error
text.

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

#### Scenario: Secondary actions carry no override

- **GIVEN** a booking card with a secondary action button
- **WHEN** the button class list and computed style are inspected
- **THEN** the class list contains no `FLAT_SECONDARY` classes and no `![box-shadow:none]`, the border is 2px and the box shadow is `none` at rest

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
two-layer focus ring, and their secondary buttons MUST use the plain `Button`
variant with no `FLAT_SECONDARY` override. The review rating MUST use a drawn star
glyph that is filled or outlined by selection, is `aria-hidden`, and keeps the
button accessible names ("1 star" to "5 stars") and `aria-pressed`; unicode star
characters MUST NOT be used. The review success message MUST render in a flat
panel and MUST keep the existing delayed close. `EmptyState` MUST render flat
with a 2px dashed ink edge and no radius above 4px, keeping its message, props
and optional link, and its optional link MUST be a single anchor styled with
`buttonVariants` with no `button` nested inside. Restyling MUST NOT claim to fix
focus trapping, initial focus or restore, ESC, backdrop close or scroll lock.

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

#### Scenario: Empty state link is a single anchor

- **GIVEN** an `EmptyState` rendered with a link
- **WHEN** it is queried
- **THEN** exactly one `link` with the same name and `href` is present, there is no `button` and `container.querySelector("a button")` is null

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
NOT sit on an ember surface. These panels, and the cards and secondary buttons on
these pages, MUST get their 2px edge from `border-2` and MUST NOT rely on a
`FLAT_SECONDARY` or `FLAT_CARD_CLASS` override or an `![box-shadow:none]` class.
The conditions that select each state MUST NOT change.

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

#### Scenario: No override classes on host pages

- **GIVEN** the host listings, host bookings and edit listing sources
- **WHEN** they are searched for `FLAT_SECONDARY`, `FLAT_CARD_CLASS` and `![box-shadow:none]`
- **THEN** no match is found

### Requirement: Photos and availability cards are flat framed cards

The edit listing page SHALL keep the details form, the photos card and the
availability card inside the card primitive, which draws its own 2px edge with
`border-2` and no ring, so that none of them carries a `FLAT_CARD_CLASS` override,
with a bold ink `h2` per card, no ember and no shadow. Photos MUST render square
with a 2px ink edge and no radius, with the same alt text as before. Delete
actions MUST stay destructive buttons at least 44px tall. The Upload photo button
MUST stay a secondary button using the plain variant, whose solid 2px edge comes
from `border-2` with no ring and no `FLAT_SECONDARY` override, MUST keep its
disabled condition, and the hidden file input and its ref MUST NOT change.
Availability block rows MUST render with a 2px ink edge and no radius, with the
date labels in bold ink and the dates in tabular ink. The Block action MUST be at
least 44px tall and keep its disabled condition. An upload error MUST render
through the shared form-level error alert instead of the red paragraph and, as the
only intended role change, gains `role="alert"`.

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

#### Scenario: Cards and Upload carry no override

- **GIVEN** the photos card, the availability card and the Upload photo button
- **WHEN** their class lists and computed styles are inspected
- **THEN** none contains `FLAT_CARD_CLASS`, `FLAT_SECONDARY` or `![box-shadow:none]`, the border is 2px and the box shadow is `none` at rest

### Requirement: Moderation actions are 44px real buttons with a flat secondary edge

The admin moderation actions SHALL stay real `button` elements, in both layouts, with the same handlers,
labels, accessible names and `disabled` condition (disabled while the mutation is
pending) as before, and MUST be at least 44px tall. Disable MUST stay the
destructive variant, with the paper label on the danger fill. Re-enable MUST stay
the plain secondary variant, with no local override, so that it has a solid 2px
edge from `border-2` and no ring or box shadow. Inside the cards (below `sm`) each action MUST be full
width. Each action MUST be one tab stop.

#### Scenario: Actions are 44px buttons

- **GIVEN** an admin viewing an active account and a disabled account, and a published and a disabled listing, at 1440 px and at 360 px
- **WHEN** the actions of the visible layout are inspected
- **THEN** each Disable and Re-enable is a `button` at least 44px tall and the card actions span the card width at 360 px

#### Scenario: Re-enable has a flat 2px edge

- **GIVEN** a disabled account or listing
- **WHEN** the Re-enable button is inspected
- **THEN** it carries the plain secondary variant classes with no `![box-shadow:none]` and its computed border width is 2px with no box shadow at rest

#### Scenario: Actions still fire the same mutations

- **GIVEN** an active account or published listing and a disabled one
- **WHEN** the admin presses Disable, and separately Re-enable
- **THEN** the same mutation runs with the same arguments and invalidates the same query keys as before this change

### Requirement: Booking and payment restyle changes no behavior

The restyle of the booking and payment screens SHALL NOT change routes, API
calls, query keys, retry behaviour, request payloads, the checkout redirect,
the payment sync and polling interval and timeout, status logic, the cancellable
rule, the set of `t()` keys, the text of any existing string or the API client.
No data, schema or backend file MUST change. The modal accessibility gaps (focus
trap, initial focus and restore, ESC, backdrop close, scroll lock) MUST be
recorded as a follow-up.

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
- **THEN** none is under `apps/api/`, `packages/db/`, `packages/shared/` or `apps/web/src/api/`

#### Scenario: Follow-ups are recorded

- **GIVEN** the change design and the pull request description
- **WHEN** they are read
- **THEN** they list the modal accessibility gaps, the copy defects and the `Badge` pill follow-ups
- **AND** the nested link and button issue is closed by the single-anchor requirement and is not listed as open

### Requirement: Host restyle changes no behavior

The restyle of the host screens SHALL NOT change routes, API calls, query keys,
mutations, handlers, request payloads, validation, publish rules, uploads, status
logic, the set of `t()` keys, the text of any existing string, the API client or
`Modal`. No data, schema or backend file MUST change. The follow-ups (shared
state panel, shared booking status tag, `Badge` pill, listing photo treatment and
the hard-coded photo alt) MUST be recorded; the `Link > Button` in `EmptyState`
and the secondary button override are closed by the single-anchor and
`buttonVariants` requirements and MUST NOT be recorded as open.

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
- **THEN** none is under `apps/api/`, `packages/db/`, `packages/shared/` or `apps/web/src/api/`

#### Scenario: Follow-ups are recorded

- **GIVEN** the change design and the pull request description
- **WHEN** they are read
- **THEN** they list the shared state panel, the shared booking status tag, the `Badge` pill, listing photos (#121) and the hard-coded photo alt
- **AND** the nested link and button issue and the secondary override (#138) are not listed as open

### Requirement: Admin restyle changes no behavior

The restyle of the admin screens SHALL NOT change routes, the `RoleGuard`
`admin` condition, API calls, query keys, mutations and their invalidation,
handlers, `disabled` conditions, accessible names, the set of `t()` keys, the text
of any existing string, the API client or `Badge`. No data, schema or backend
file MUST change. The Disable and Re-enable mutations MUST keep their current
handling of failed requests (none). The moderation behavior of the `admin`
capability is consumed unchanged. The follow-ups (shared state panel and status
tag, the `Badge` pill, mutation error handling, per-row accessible names) MUST be
recorded; the secondary button override is closed by the `buttonVariants`
requirements and MUST NOT be recorded as open.

#### Scenario: Admin flows are unchanged

- **GIVEN** an admin disabling and re-enabling an account and a listing
- **WHEN** each action is completed
- **THEN** the same requests with the same arguments are sent and the same queries are invalidated as before this change

#### Scenario: Dictionary is unchanged

- **GIVEN** the English dictionary before and after this change
- **WHEN** the `admin.users`, `admin.listings`, `host.listings.status_*` and `error.generic.unexpected` keys are compared
- **THEN** their keys and values are identical

#### Scenario: No backend, client or shared change

- **GIVEN** the change diff against `origin/main`
- **WHEN** the changed paths are listed
- **THEN** none is under `apps/api/`, `packages/db/`, `packages/shared/` or `apps/web/src/api/`

#### Scenario: Follow-ups are recorded

- **GIVEN** the change design and the pull request description
- **WHEN** they are read
- **THEN** they list the shared state panel and status tag, the `Badge` pill, the missing mutation error handling and the per-row accessible names
- **AND** `FLAT_SECONDARY` is not listed as open
