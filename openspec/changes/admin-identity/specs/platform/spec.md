# platform — Delta for admin-identity

## ADDED Requirements

### Requirement: Admin users page uses the Gantry Signage identity

The admin users page (`/admin/users`, under `RoleGuard role="admin"`) SHALL render
the Gantry Signage identity in the warm palette with no behavior, route or API
change. The page MUST contain exactly one `h1`, set in black ink in the heavy
weight, and MUST NOT use an ember title band or any ember surface. It MUST NOT
import or render the pill `Badge`. Roles MUST stay plain muted text
(`roles.join(", ")`) with no role badge. Every visible string, column heading and
accessible name MUST stay the same.

#### Scenario: One heading and no ember

- **GIVEN** an admin viewing a list of users at a 1440 px viewport
- **WHEN** the page is inspected
- **THEN** the page has one `h1` in black ink and no element has an ember background
- **AND** no element carries the `rounded-pill` class

#### Scenario: Roles are plain text

- **GIVEN** a user with the roles `guest` and `host`
- **WHEN** the user's row is read
- **THEN** the roles show as the plain muted text "guest, host" and are not wrapped in a tag or badge

### Requirement: Admin listings page uses the Gantry Signage identity

The admin listings page (`/admin/listings`, under `RoleGuard role="admin"`) SHALL
render the Gantry Signage identity in the warm palette with no behavior, route or
API change. The page MUST contain exactly one `h1`, set in black ink in the heavy
weight, and MUST NOT use an ember title band or any ember surface. It MUST NOT
import or render the pill `Badge`, and the local status label helper MUST be
removed while the listing type label helper stays. Every visible string, column
heading and accessible name MUST stay the same.

#### Scenario: One heading and no pill

- **GIVEN** an admin viewing a list of listings at a 1440 px viewport
- **WHEN** the page is inspected
- **THEN** the page has one `h1` in black ink, no element has an ember background and no element carries the `rounded-pill` class

#### Scenario: Badge is no longer used by admin pages

- **GIVEN** the source of the admin users and admin listings pages
- **WHEN** their imports are searched for `Badge`
- **THEN** there is no match in either file

### Requirement: Account state is shown by a shape-coded tag

The admin users page SHALL carry the account state by shape as well as by text in
one local account status tag, used by both list layouts, with the unchanged
`admin.users.*` Active and Disabled strings. An active account MUST have a solid
ink edge and a filled 8px ink square marker. A disabled account MUST have a solid
muted edge and struck-through muted text. The tag MUST NOT be a pill, MUST NOT
depend on colour alone and MUST hold its label as its only text node, with the
marker an empty `aria-hidden` element, so that a text query for "Active" or
"Disabled" scoped to one layout matches exactly one element.

#### Scenario: State is carried by shape

- **GIVEN** one active and one disabled account
- **WHEN** the status tags of the visible layout are inspected
- **THEN** active has a solid ink border and a marker, and disabled has a solid muted border with `line-through` text
- **AND** each tag's text equals the existing label (exactly "Active" or "Disabled") and none has a pill radius

#### Scenario: Label matches exactly one element within a layout

- **GIVEN** the admin users page with one disabled account
- **WHEN** the table is queried by the exact text "Disabled", and separately the card list
- **THEN** exactly one element matches within each layout

### Requirement: Listing status in admin uses the shared listing status tag

The admin listings page SHALL render each listing status through the shared
`ListingStatusTag`, unchanged, in both list layouts, with the unchanged
`host.listings.status_*` labels. A draft MUST have a dashed ink edge, a published
listing a solid ink edge and a filled ink marker, and a disabled listing a solid
muted edge and struck-through text. The page MUST NOT define its own status label
or tone helper and MUST NOT render the pill `Badge`.

#### Scenario: Status is carried by shape

- **GIVEN** one listing in each status
- **WHEN** the status tags of the visible layout are inspected
- **THEN** draft has a dashed border, published has a solid ink border and a marker, and disabled has a solid muted border with `line-through` text
- **AND** each tag's text equals the existing label (exactly "Draft", "Published" or "Disabled") and none has a pill radius

#### Scenario: Tag is the shared component

- **GIVEN** the admin listings page source
- **WHEN** it is read
- **THEN** it imports and renders `ListingStatusTag` and contains no local status label or tone function

### Requirement: Admin lists are a flat table from sm up and flat cards below it

The admin users and admin listings pages SHALL render the same rows in one of two
layouts chosen by viewport width. From 640px (`sm`) up each MUST render a flat
table whose head row has a 2px ink bottom rule and bold ink headings and whose
body rows keep a 1px muted rule, with the primary cell in ink and the secondary
cells in muted ink. Below 640px each MUST render every row as a flat card instead:
a `rounded-card` block with a 2px ink edge, no shadow and no ring. The users card
MUST hold the email (`break-all`, bold), the account status tag, a `dl` with the
roles and any other existing columns labelled with the existing `admin.users.*_col`
strings, and the action. The listings card MUST hold the title (`break-words`, in
a `min-w-0` column), the listing status tag, the listing type and city, the host
email (`break-all`) and the action, labelled with the existing
`admin.listings.*_col` strings. No new copy is added. The status and the
moderation action MUST be visible at 360px without any horizontal scrolling, and
the document MUST NOT scroll horizontally in either layout. Only one layout MUST
be exposed at a time: the table container uses `hidden sm:block` and the card list
`sm:hidden`, so the inactive layout is `display: none` and out of the
accessibility tree and its text is never announced twice.

#### Scenario: Cards below sm show every field

- **GIVEN** an admin viewing users, one with a very long email, and listings, one with a very long title, at a 360 px viewport
- **WHEN** each page is inspected
- **THEN** each row is a visible card with a 2px ink border showing its identifying text, the status tag and the moderation action
- **AND** the table is not displayed and the document scroll width does not exceed the viewport width

#### Scenario: Table from sm up

- **GIVEN** an admin viewing users or listings at a 1440 px viewport
- **WHEN** the page is inspected
- **THEN** the table is visible with a 2px ink bottom border on the head row and bold ink headings, and the cards are not displayed

#### Scenario: Only one layout is exposed

- **GIVEN** the admin users page and the admin listings page with rows
- **WHEN** their markup is inspected
- **THEN** each table container has the classes `hidden` and `sm:block` and each card list has the class `sm:hidden`, so at any width exactly one of them is displayed and the other is out of the accessibility tree

### Requirement: Moderation actions are 44px real buttons with a flat secondary edge

The admin moderation actions SHALL stay real `button` elements, in both layouts, with the same handlers,
labels, accessible names and `disabled` condition (disabled while the mutation is
pending) as before, and MUST be at least 44px tall. Disable MUST stay the
destructive variant, with the paper label on the danger fill. Re-enable MUST stay
the secondary variant carrying the local `FLAT_SECONDARY` override, so that it has
a solid 2px edge and no inset ring. Inside the cards (below `sm`) each action MUST be full
width. Each action MUST be one tab stop.

#### Scenario: Actions are 44px buttons

- **GIVEN** an admin viewing an active account and a disabled account, and a published and a disabled listing, at 1440 px and at 360 px
- **WHEN** the actions of the visible layout are inspected
- **THEN** each Disable and Re-enable is a `button` at least 44px tall and the card actions span the card width at 360 px

#### Scenario: Re-enable has a flat 2px edge

- **GIVEN** a disabled account or listing
- **WHEN** the Re-enable button is inspected
- **THEN** it carries the `FLAT_SECONDARY` classes and its computed border width is 2px with no box shadow

#### Scenario: Actions still fire the same mutations

- **GIVEN** an active account or published listing and a disabled one
- **WHEN** the admin presses Disable, and separately Re-enable
- **THEN** the same mutation runs with the same arguments and invalidates the same query keys as before this change

### Requirement: Admin screen states are flat panels

The admin users and admin listings pages SHALL render their loading, empty and
error states with the existing strings and no new copy. The loading state MUST be
a flat skeleton (square blocks, no pill, no shadow) marked `aria-busy="true"` and
MUST have no `h1`. The empty state MUST be a dashed 2px ink edge paper panel
holding the existing empty text. The error state MUST be a panel inside the page
wrapper with `role="alert"`, a 2px solid danger edge, the danger tint fill and a
filled danger tile marked `aria-hidden`, and MUST contain exactly one `h1` with the
existing generic error string. Danger MUST NOT sit on an ember surface. The
conditions that select each state MUST NOT change.

#### Scenario: Loading is flat

- **GIVEN** the users or listings request has not resolved
- **WHEN** the page renders
- **THEN** the skeleton container has `aria-busy="true"`, no `h1`, no `rounded-pill` block and no shadow

#### Scenario: Empty list

- **GIVEN** no users or no listings
- **WHEN** the page renders
- **THEN** the existing empty text shows in a panel with a 2px dashed ink border

#### Scenario: Error panel

- **GIVEN** the users request fails, and separately the listings request fails
- **WHEN** each page settles
- **THEN** exactly one element has `role="alert"` and it contains one `h1` with the existing generic error text
- **AND** the panel is inside the page wrapper with a 2px solid danger border, the danger tint background and an `aria-hidden` filled tile

### Requirement: Admin text pairings meet WCAG AA

The admin screens SHALL meet WCAG 2.1 AA for every text and surface pairing used
on the admin users and admin listings pages and their tables, cards, tags, actions
and states, computed with the WCAG 2.1 formula: normal text 4.5:1, large text and
non-text edges and glyphs 3:1. Danger text MUST sit only on paper or the danger
tint. Status MUST NOT be carried by colour alone. No new colour value MAY be
introduced and no ember surface MAY appear.

#### Scenario: Pairings pass computed contrast

- **GIVEN** the pairings ink, muted ink and muted edge on paper, ink edge, dashed edge and marker on paper, ink on stone, paper on danger, danger on the danger tint, danger edge on the danger tint, and the ink focus outline on paper and stone
- **WHEN** their contrast ratios are computed with the WCAG 2.1 formula
- **THEN** every text pairing is at least 4.5:1 and every edge, marker or outline pairing at least 3:1

#### Scenario: No colour-only status

- **GIVEN** an account or listing in each state
- **WHEN** the status is read without colour
- **THEN** each state is distinguishable by its edge style, marker or strike-through and its text

### Requirement: Admin screens are usable at 360 px, by keyboard and with reduced motion

The admin users and admin listings pages SHALL render without document-level
horizontal scrolling and without clipped content at a 360 px viewport in every
state, including long emails, listing titles and city names; the lists show cards
below 640 px instead of a scrolling table. Keyboard focus order MUST follow the
visual order, every action MUST be one tab stop and MUST show the two-layer focus
ring, which MUST NOT be clipped by a panel. The restyle MUST NOT introduce
animation, and colour transitions MUST be neutralised under
`prefers-reduced-motion: reduce`.

#### Scenario: No horizontal overflow at 360 px

- **GIVEN** each admin page at 360 px width
- **WHEN** it is shown loaded with long strings, loading, empty and in error
- **THEN** the document scroll width does not exceed the viewport width

#### Scenario: Keyboard focus ring

- **GIVEN** the admin users page and the admin listings page with rows
- **WHEN** the user tabs through the page
- **THEN** each Disable and Re-enable is reached by exactly one tab stop and shows a 3px ink outline with a paper gap ring

#### Scenario: Reduced motion

- **GIVEN** a user with `prefers-reduced-motion: reduce`
- **WHEN** the admin pages load and are used
- **THEN** no element inside the page content animates and colour transitions complete without delay

### Requirement: Admin restyle changes no behavior

The restyle of the admin screens SHALL NOT change routes, the `RoleGuard`
`admin` condition, API calls, query keys, mutations and their invalidation,
handlers, `disabled` conditions, accessible names, the set of `t()` keys, the text
of any existing string, the API client, `packages/ui` or any shared primitive,
including `Badge`. No data, schema or backend file MUST change. The Disable and
Re-enable mutations MUST keep their current handling of failed requests (none).
The moderation behavior of the `admin` capability is consumed unchanged. The
follow-ups (shared state panel and status tag, the `Badge` pill and the secondary
button override, mutation error handling, per-row accessible names) MUST be
recorded.

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
- **THEN** none is under `apps/api/`, `packages/db/`, `packages/shared/`, `packages/ui/` or `apps/web/src/api/`

#### Scenario: Follow-ups are recorded

- **GIVEN** the change design and the pull request description
- **WHEN** they are read
- **THEN** they list the shared state panel and status tag, the `Badge` pill and `FLAT_SECONDARY` (#138), the missing mutation error handling and the per-row accessible names
