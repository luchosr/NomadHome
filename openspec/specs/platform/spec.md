# platform Specification

## Purpose

Cross-cutting web UI and API contract. Covers the English-only mobile-responsive web app (down to 360 px viewport), the i18n-ready `t(key)` helper (snake_case dot-joined keys, reserved domains, `<key-not-found: KEY>` fallback, backend direct dict reuse — per `decide-i18n-key-format`), and the Zod-validated REST contract that is the single source of truth for request/response shapes across `apps/api` and `apps/web` via `packages/shared`. Owns no persistent state — invariants are about the application boundary.

## Requirements

### Requirement: Web application is English-only and mobile-responsive

The system SHALL deliver a web UI in English only for the MVP. The UI MUST render usably across desktop and mobile viewport widths down to 360 px. All user-facing strings MUST be routed through a `t(key)` helper backed by an English-only lookup table so that future internationalization can be added without locating untranslated literals across the codebase.

**Key format.** Keys SHALL match the regular expression `^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$` — lower-case `snake_case` segments joined by dots, with at least two segments. The convention is `<domain>.<context>.<specific>` (e.g., `auth.form.email_label`, `booking.success.confirmation_title`, `email.booking_confirmation.subject`).

**Reserved top-level domains.** The dictionary MUST always contain `common`, `error`, and `validation` as top-level domains so error and validation messages have stable lookup paths from day one. Beyond those three, every top-level domain MUST correspond to a capability folder under `openspec/specs/<capability>/`. Adding a new capability adds a new top-level domain in the same PR.

**Missing-key behavior.** When the `t()` helper is invoked with a key that does not resolve in the dictionary, the helper SHALL log a warning (to `console.warn` on the frontend or the structured logger on the backend) and SHALL return the literal string `<key-not-found: KEY>` where `KEY` is the exact key requested. The angle brackets are part of the returned string so the gap is visible in rendered UI / email body. The helper SHALL NOT throw.

**Backend reuse.** The backend SHALL import the same `en` dictionary directly (typed) from the shared package and SHALL NOT use the React-bound `t()` helper. Email templates and other server-rendered strings SHALL access keys via `en.<domain>.<context>.<specific>` and SHALL apply a simple `{{var}}` interpolation pass for variable substitution.

#### Scenario: All UI text is sourced through the `t()` helper

- **GIVEN** any rendered page of the web UI
- **WHEN** a static analysis check scans for hardcoded user-facing string literals in JSX text and attributes (excluding test files, ARIA labels generated dynamically, and developer-only logs)
- **THEN** the check finds no hardcoded user-facing string outside the `t()` helper

#### Scenario: UI renders usably on a 360 px viewport

- **GIVEN** any primary user-flow page (search, listing detail, booking, host dashboard, admin pages)
- **WHEN** the page is rendered at a viewport width of 360 px
- **THEN** all primary actions are reachable without horizontal scrolling
- **AND** no content is visually clipped or unreadable due to overflow

#### Scenario: Every `t()` key conforms to the snake_case-dot format

- **GIVEN** every `t('...')` literal call site in `apps/web/` source
- **WHEN** the keys are extracted and matched against the regex `^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$`
- **THEN** every key matches
- **AND** any key with uppercase letters, hyphens, or fewer than two segments is reported as a violation

#### Scenario: Reserved top-level domains are present in the dictionary

- **GIVEN** the English dictionary `en` shipped in `packages/shared/src/strings/en.ts`
- **WHEN** its top-level keys are inspected
- **THEN** `common`, `error`, and `validation` are all present
- **AND** every other top-level key corresponds to a folder under `openspec/specs/<capability>/`

#### Scenario: Missing key returns the marker string and logs a warning

- **GIVEN** a `t(key)` call where `key` is `booking.does_not_exist`
- **AND** the dictionary `en` does NOT contain that path
- **WHEN** the call executes
- **THEN** the return value is the literal string `<key-not-found: booking.does_not_exist>`
- **AND** a warning is logged identifying the missing key
- **AND** no exception is thrown

#### Scenario: Backend imports the dictionary directly without the React-bound helper

- **GIVEN** the API codebase under `apps/api/`
- **WHEN** server-rendered strings are needed (e.g. transactional email templates)
- **THEN** the code imports `en` from the shared package and accesses keys via `en.<domain>.<context>.<specific>`
- **AND** the React-bound `t()` helper is NOT imported in `apps/api/` source
- **AND** variable substitution uses a simple `{{var}}` interpolation pass on the resolved string

### Requirement: REST API contract with Zod-validated request/response shapes

The system SHALL expose a REST API. All request and response payloads MUST be validated against Zod schemas defined in the shared package, and those schemas MUST be the single source of truth used by both the backend (runtime validation) and the frontend (type inference and client-side validation).

#### Scenario: Invalid request body is rejected at the API boundary

- **GIVEN** any API endpoint with a Zod-validated request body
- **WHEN** the client submits a body that fails the Zod schema
- **THEN** the system returns HTTP 400 with a machine-readable validation error describing which field(s) failed
- **AND** the controller handler is not invoked

#### Scenario: Response shape matches the declared schema

- **GIVEN** any successful API response
- **WHEN** the response is generated
- **THEN** the response body conforms to the declared Zod response schema for that endpoint

### Requirement: Shared design tokens expose the NomadHome brand to Tailwind

The system SHALL expose the NomadHome "Gantry Signage" design tokens, in the
warm palette, through the shared Tailwind preset
(`packages/config/tailwind.preset.js`) so that every workspace app and the UI
package consume one source of brand values. The preset MUST define, under
`theme.extend`, the brand palette (orange panel `ember` `#E65F35`, sage
panel `sage` `#96A8A6`, canvas `paper` `#F7F5F2`, inset `stone` `#E5E2DD`, and
`ink` `#1E1E1E`), the semantic
color roles (e.g. surface, fg, border, action, success, warning, danger, info
roles with fixed approved foreground pairings), the font families (`display`,
`sans`, `mono`), a fluid sign-scale type scale, the spacing scale, the border
radii, and the flat (non-blurred) elevations. The previous `sand`, `ink-<n>`,
`forest`, and `terracotta-<n>` scales and the Gantry yellow/green names
(`signal`, `sign-green`, `black`, `white`, `surface-signal`, `surface-green`)
MUST NOT remain in the preset or be used in application source.

#### Scenario: Brand utility classes resolve from the preset

- **GIVEN** an app that extends the shared Tailwind preset
- **WHEN** a component uses `bg-ember`, `text-fg`, `bg-sage`, `bg-paper` and `font-display`
- **THEN** the build resolves each to the corresponding design-token value
- **AND** no class falls back to an undefined/empty Tailwind value

#### Scenario: Legacy brand scales and Gantry yellow/green names are gone

- **GIVEN** the shared Tailwind preset and all source under `apps/web/src` and `packages/ui/src`
- **WHEN** the source is searched for `sand-`, `forest-`, `terracotta-` and `ink-` numeric utility classes and for `signal`, `sign-green`, `surface-green`, `-black` and `-white` colour utilities
- **THEN** no match is found

### Requirement: UI package ships brand base styles and fonts

The system SHALL provide a single shared stylesheet entry point in
`packages/ui` that loads the brand fonts (a self-hosted grotesque display and
text family chosen outside the common default-font list, plus a mono family),
declares the design-token CSS custom properties, and applies base element
styles: the default canvas is the paper surface token, headings use the display
family set solid, and interactive elements expose a visible two-layer focus
ring that meets WCAG 2.1 AA non-text contrast on paper, stone, sage, orange
and ink surfaces. The stylesheet MUST keep the `@tailwind
base/components/utilities` directives.

#### Scenario: Base styles apply the brand canvas and display headings

- **GIVEN** the UI package stylesheet is imported by an app
- **WHEN** the document body and an `h1` are rendered with no extra classes
- **THEN** the body background resolves to the paper surface token and the `h1` uses the display font family

#### Scenario: Focus ring is visible on every surface

- **GIVEN** an interactive element focused by keyboard on a paper, stone, sage, orange, or ink panel
- **WHEN** the focus ring is rendered
- **THEN** it has a contrast ratio of at least 3:1 against its adjacent colors

### Requirement: Shared primitives follow the design system

The system SHALL provide shared React primitives in `packages/ui` that match the
design system: a `Button` supporting `primary`, `secondary`, `tertiary`, and
`destructive` variants, plus `Badge`, `Input`, `Card`, and `Skeleton`
components. The `Button` default variant MUST be the solid ink primary on the
warm panel system, and all primitives MUST be exported from the package entry
point. Existing primitive consumers MUST keep working without prop changes (the
`variant` prop is optional and defaults to `primary`); this change SHALL NOT
alter any primitive's public props or behavior, only its styling.

#### Scenario: Button renders the requested variant

- **GIVEN** the `Button` primitive
- **WHEN** it is rendered with `variant="secondary"`
- **THEN** it renders the secondary (outlined, transparent-fill) treatment
- **AND** rendering with no `variant` prop yields the solid ink primary

#### Scenario: Existing primitive APIs are preserved

- **WHEN** `Button`, `Badge`, `Input`, `Card`, and `Skeleton` are imported from the `packages/ui` entry point
- **THEN** each resolves to a renderable React component accepting the same props as before this change

### Requirement: Wayfinding pictograms and arrows ship as shared primitives

The system SHALL provide custom SVG `Pictogram` (at least `bed` and `desk`) and
`Arrow` primitives in `packages/ui`, exported from the package entry point. They
MUST NOT depend on an icon font or CDN, MUST be decorative (`aria-hidden`) unless
an accessible label is supplied, and MUST inherit color from the surrounding
text color.

#### Scenario: Pictogram is decorative by default

- **GIVEN** a `Pictogram` rendered with `name="bed"` and no label
- **WHEN** the DOM is inspected
- **THEN** the SVG has `aria-hidden="true"` and no accessible name

#### Scenario: Pictogram exposes a label when provided

- **GIVEN** a `Pictogram` rendered with a label
- **WHEN** the DOM is inspected
- **THEN** the SVG has `role="img"` and the label as its accessible name

### Requirement: State is conveyed by shape as well as colour

The system SHALL convey availability and selection state in shared primitives
and migrated screens through shape (solid, dashed, struck) in addition to
colour, so that no state depends on colour alone (WCAG 2.1 SC 1.4.1).

#### Scenario: Unavailable state is distinguishable without colour

- **GIVEN** a listing card or badge in an unavailable state
- **WHEN** it is rendered in grayscale
- **THEN** it remains distinguishable from the available state via a dashed or struck treatment

### Requirement: Brand colour pairings meet WCAG 2.1 AA

The system SHALL use only approved foreground/background pairings from the
design tokens. Normal text MUST meet a contrast ratio of at least 4.5:1, large
text and non-text UI components at least 3:1, including ink on `#E65F35`
(4.81:1), ink on `#96A8A6`, ink on paper, and ink on stone. Orange panels MUST
carry ink text only, never paper text (3.19:1). Orange MUST NOT be used as text
or as a line colour on paper, stone or sage. Sage MUST be used only as a
background carrying ink text, never as text or as a line colour. Placeholder and
secondary text on orange MUST be ink, or sit in a paper-filled field. The role tokens
(success, warning, danger, info) and their tints MUST each meet 4.5:1 for text
on their own tint and on paper.

#### Scenario: Token pairings pass computed contrast

- **GIVEN** every approved foreground/background pairing defined in the tokens
- **WHEN** contrast ratios are computed
- **THEN** each meets the applicable WCAG 2.1 AA threshold

#### Scenario: Disallowed pairings are not approved

- **GIVEN** the pairings paper on orange, orange on paper, orange on stone, orange on sage, sage on paper and sage on stone
- **WHEN** contrast ratios are computed
- **THEN** each is below 4.5:1 and none appears among the approved token pairings

### Requirement: Landing and search screens use the Gantry Signage identity

The landing page and the search screen SHALL render the Gantry Signage
identity in the warm palette with no behavior or API change. The landing first
viewport MUST present a full-width orange panel with ink text, the city
input as the largest destination line, dates with a stay-length numeral, Live
and Work pictograms sharing one arrow to a solid ink search-action panel, a slim
nav, and no hero photo. The search screen MUST show comparable listing cards
(photo, type, nightly price in USD, 2-3 amenities), filters in a side panel on
desktop and a sheet on mobile, and no map. All user-facing strings MUST go
through `t()`.

#### Scenario: Landing first viewport at 360 px

- **GIVEN** the landing page rendered at a 360 px viewport
- **WHEN** the first viewport is inspected
- **THEN** the city input, dates, stay-length numeral, and search action are all reachable without horizontal scrolling
- **AND** no text is clipped

#### Scenario: Landing search submits as before

- **GIVEN** the landing page with a city and dates entered
- **WHEN** the user activates the search action
- **THEN** the user is taken to the search results with the same query parameters as before this change

#### Scenario: Search filters adapt by viewport

- **GIVEN** the search screen
- **WHEN** it is rendered on desktop and on a 360 px viewport
- **THEN** filters appear in a side panel on desktop and in a sheet on mobile
- **AND** the set of filters and their behavior are unchanged

#### Scenario: Listing cards are comparable

- **GIVEN** search results with multiple listings
- **WHEN** the cards are rendered
- **THEN** each shows the photo, listing type, nightly price in USD, and 2-3 amenities in the same positions

#### Scenario: Orange panels render the approved colour with ink text

- **GIVEN** the landing hero and the search query band
- **WHEN** they are rendered
- **THEN** their background resolves to `#E65F35` and their text resolves to the ink token

### Requirement: Landing page shows no invented statistics, testimonials or prices

The landing page SHALL NOT present invented content as fact. It MUST NOT
render statistics or counts (cities, rooms, occupancy, NPS), testimonials or
attributed quotes, example or placeholder prices, state tags (featured,
available, coming soon) or availability or amenity claims for listings that do
not exist in the product's data. Every price, count or listing detail shown on
the landing page MUST come from the product's own API data and MUST be
displayed exactly as returned, without conversion or rounding to another
currency. Descriptive copy that states what the product does, and editorial
navigation links that make no inventory claim (such as city links to
`/search?city=<name>`), remain allowed. All user-facing strings MUST go
through `t()`.

#### Scenario: Landing has no statistics or testimonial section

- **GIVEN** the landing page rendered with any search result data, including none
- **WHEN** its content is inspected
- **THEN** no statistics strip (cities, rooms, occupancy, NPS) is present
- **AND** no testimonial quote or author attribution is present

#### Scenario: Landing shows no example price outside real listings

- **GIVEN** the landing page rendered with an empty search result
- **WHEN** its content is inspected
- **THEN** no price value appears anywhere on the page
- **AND** the co-living and workspace sections show their descriptive copy and checklist without an example rate or a workspace status strip

#### Scenario: Removed content cannot return through the dictionary

- **GIVEN** the English dictionary
- **WHEN** its `home` domain is inspected
- **THEN** it contains no `stats` or `testimonial` group, no `featured.cards` group, no co-living example-rate keys and no workspace status-strip keys

#### Scenario: Landing sections keep a distinct field rhythm

- **GIVEN** the landing page with and without the featured section
- **WHEN** consecutive sections are compared
- **THEN** no two adjacent full-width sections share the same background field

### Requirement: Landing featured stays come from real listings and hide when none exist

The landing page SHALL render its featured stays section from real published
listings returned by the existing search endpoint (`GET /search`, first page,
a small page size, default order), without any backend change. Each row MUST
show the listing's real title, city and country, listing type and nightly
price in the currency returned by the API, and MUST link to that listing's
detail page. The section MUST show a photo only from the listing's primary
photo and a neutral pictogram otherwise. When the request succeeds with no
listings, or fails, the entire section (heading, link and rows) MUST be hidden.
While the request is pending the section MUST show only skeleton placeholders
of the final row height and MUST NOT show invented rows or text. Long titles
and cities MUST wrap or clamp without horizontal overflow down to a 360 px
viewport, and a listing whose price is missing or not positive MUST render its
row without a price rather than an invented value.

#### Scenario: Real listings render as departure-board rows

- **GIVEN** the search endpoint returns two published listings with titles, cities, countries, types, nightly rates and currencies
- **WHEN** the landing page is rendered
- **THEN** the featured section shows exactly two rows
- **AND** each row shows that listing's title, city, country, type and nightly price formatted from `nightlyRateCents` in its `currency`
- **AND** each row links to `/listings/<id>`
- **AND** no state tag is shown

#### Scenario: Request uses a small page of the existing endpoint

- **GIVEN** the landing page is rendered
- **WHEN** the featured section requests its data
- **THEN** it calls the search endpoint with `page=1` and a `pageSize` of 3 and no filters
- **AND** it does not call any new endpoint

#### Scenario: Section is hidden when there are no listings

- **GIVEN** the search endpoint returns an empty `data` array
- **WHEN** the landing page is rendered and the request resolves
- **THEN** the featured section heading, its "see all" link and its rows are absent from the page
- **AND** the rest of the landing page renders normally

#### Scenario: Section is hidden when the request fails

- **GIVEN** the search endpoint responds with a server error or the network fails
- **WHEN** the landing page is rendered and the request settles
- **THEN** the featured section is absent
- **AND** no error message or retry control is shown for it

#### Scenario: Loading shows skeletons only

- **GIVEN** the search request has not yet resolved
- **WHEN** the landing page is rendered
- **THEN** the featured area shows skeleton placeholders marked busy and hidden from assistive technology as content
- **AND** no listing title, city or price text is shown

#### Scenario: Long title and missing photo or price stay usable

- **GIVEN** a listing with a very long title, a long city name, `primaryPhotoUrl` of `null` and a non-positive nightly rate
- **WHEN** its row is rendered at a 360 px viewport
- **THEN** the title wraps or clamps within the row with no horizontal page scroll
- **AND** a type pictogram replaces the photo
- **AND** the row renders without a price and remains a working link

### Requirement: Auth screens use the Gantry Signage identity

The login, registration and email-verification screens SHALL render the Gantry
Signage identity in the warm palette with no behavior, route or API change.
The login and registration screens MUST present the page title as an `h1` in a
full-width ember title band (ink text, 2px ink bottom rule, display font set
solid) directly above a single paper form panel with a 2px ink edge, with no
hero photo, illustration or second column. All form controls, labels and error
messages MUST sit inside the paper panel and MUST NOT sit on an ember or sage
surface. The route link ("Sign up" on login, "Log in" on registration) MUST sit
in a stone footer row of the panel and MUST be underlined, not distinguished
by colour or weight alone. All user-facing strings MUST go through `t()`.

#### Scenario: Title band and form panel render the approved colours

- **GIVEN** the login page rendered at a 1440 px viewport
- **WHEN** the title band and the form panel are inspected
- **THEN** the band background resolves to `#E65F35` and its text resolves to the ink token
- **AND** the page title is the only `h1`
- **AND** the form panel background resolves to the paper token and its border width is 2px in the ink token

#### Scenario: Registration uses the same composition

- **GIVEN** the registration page rendered at a 1440 px viewport
- **WHEN** its structure is inspected
- **THEN** it shows the ember title band above one paper form panel containing the email, password and confirm password fields and the submit action
- **AND** the footer row of the panel is on the stone surface and holds an underlined link to `/login`

#### Scenario: Controls and messages never sit on orange

- **GIVEN** the login or registration page in any state, including field errors and a server error
- **WHEN** the nearest opaque background of every input, label and error message is resolved
- **THEN** none resolves to ember or sage

#### Scenario: Primary action keeps the ink panel look

- **GIVEN** the login page with a valid form
- **WHEN** the submit action is inspected
- **THEN** its background resolves to the ink token, its label to the paper token and its border to 2px ink

### Requirement: Auth form fields are labelled, linked to their errors and shape-coded

Every auth form field SHALL have a visible label connected to its input, and
SHALL keep its existing `autocomplete` value (`email`, `current-password`,
`new-password`). A field error MUST render inside the paper panel as a message
with a 4px solid danger rule on its left and 14px bold danger text, MUST carry
an id, and the input MUST reference it through `aria-describedby` only while the
error is shown, alongside `aria-invalid`. Field errors SHALL NOT use
`role="alert"`. A form-level (server) error MUST render as a single panel with
`role="alert"`, a 2px solid danger edge, the danger tint fill and a filled
danger marker tile, directly above the submit action. State MUST NOT depend on
colour alone. Danger text and danger fills MUST NOT sit on an ember or sage
surface. Error text MUST meet 4.5:1 against the surface it sits on.

#### Scenario: Labels and autocomplete are present

- **GIVEN** the login and registration pages
- **WHEN** their fields are inspected
- **THEN** each input has an accessible name from a visible label
- **AND** the email input has `autocomplete="email"`, the login password `current-password`, and the registration password and confirm password `new-password`

#### Scenario: Field error is linked to its input and shaped

- **GIVEN** the login page with the email left empty
- **WHEN** the form is submitted
- **THEN** the email input has `aria-invalid="true"` and an `aria-describedby` that references the visible error message
- **AND** the message has a 4px solid left border in the danger token and 14px bold text in the danger token on the paper surface
- **AND** the message is not a `role="alert"` element

#### Scenario: Error link is removed when the error clears

- **GIVEN** an email field showing a validation error
- **WHEN** the user corrects the value and the error clears
- **THEN** the input no longer has an `aria-describedby` that references the removed message
- **AND** `aria-invalid` is no longer `true`

#### Scenario: Server error is one alert panel with a shape cue

- **GIVEN** the login page where the API rejects the credentials with a message
- **WHEN** the rejection is displayed
- **THEN** exactly one element with `role="alert"` is present and it contains the message exactly as returned or the generic fallback
- **AND** the alert has a 2px solid danger border, a danger-tint background and a filled marker tile
- **AND** it sits inside the paper panel directly above the submit action

#### Scenario: Error pairings pass computed contrast

- **GIVEN** the field error text on paper, the form-level error text on the danger tint, the danger edge on paper and the paper mark on the danger tile
- **WHEN** their contrast ratios are computed with the WCAG 2.1 formula
- **THEN** the text pairings are at least 4.5:1 and the edge pairing at least 3:1

#### Scenario: No invented content or deferred features

- **GIVEN** the login, registration and verification pages
- **WHEN** their content is inspected
- **THEN** no testimonial, statistic, claim of user count, trust badge, price, password-visibility toggle, password-recovery link or alternative sign-in provider is present

### Requirement: Email verification result is shown as one of three distinct sign panels

The email verification screen SHALL render exactly one of three sign panels, each
with exactly one `h1` and each distinguishable by shape without colour. The
pending panel MUST have a stone fill, a dashed 2px ink edge, a dashed-edge tile
with three solid squares and no animation, and MUST be exposed as a polite
busy status. The success panel MUST have an ember fill, a solid 2px ink edge, an
ink-filled tile with a paper check, ink text and an ink primary link to
`/login`. The error panel MUST have a paper fill, a solid 2px ink edge, an
outlined tile with a 2px solid danger edge and a danger cross, ink text and an
ink primary link to `/register`, and MUST be exposed with `role="alert"`.
Danger MUST NOT appear on the ember success panel. The verification request, its
single invocation per token and the missing-token handling MUST NOT change.

#### Scenario: Pending state

- **GIVEN** the verification request has not resolved
- **WHEN** the screen is rendered
- **THEN** one `h1` shows the pending text
- **AND** the panel is stone with a dashed 2px ink border and is exposed as a status with `aria-busy="true"`
- **AND** the tile has a dashed border and no element inside the panel animates

#### Scenario: Success state

- **GIVEN** the verification request resolves successfully
- **WHEN** the screen settles
- **THEN** one `h1` shows the success title and the success body is visible
- **AND** the panel background resolves to `#E65F35` with a solid 2px ink border and ink text
- **AND** the tile fill resolves to the ink token and the link to `/login` is an ink-filled primary action

#### Scenario: Error state

- **GIVEN** the verification request rejects, or the URL has no token
- **WHEN** the screen settles
- **THEN** one `h1` shows the error title and the error body is visible
- **AND** the panel is paper with a solid 2px ink border and is exposed with `role="alert"`
- **AND** the tile has a 2px solid danger border and a danger cross on a paper fill
- **AND** the link to `/register` is an ink-filled primary action

#### Scenario: States are distinguishable in grayscale

- **GIVEN** the three states rendered in grayscale
- **WHEN** their panel border styles, tile fills and glyphs are compared
- **THEN** pending is dashed, success is solid with a filled tile and a check, and error is solid with an outlined tile and a cross
- **AND** no two states share the same combination

#### Scenario: Verification behaviour is unchanged

- **GIVEN** the verification page opened with a token
- **WHEN** the screen renders and re-renders
- **THEN** the verification request is made once with that token
- **AND** with no token the request is not made and the error state is shown

### Requirement: Auth screens are usable at 360 px, by keyboard and with reduced motion

The login, registration and verification screens SHALL render without
horizontal scrolling and without clipped content at a 360 px viewport in every
state, including long typed values, long server messages and the three
verification states. Keyboard focus order MUST follow the visual order (email,
password, confirm password where present, submit, route link) with a visible
two-layer focus ring on every interactive element. The route link and the
verification actions MUST have a target at least 44px tall. The screens MUST
NOT introduce animation, and colour transitions MUST be neutralised under
`prefers-reduced-motion: reduce`.

#### Scenario: No horizontal overflow at 360 px

- **GIVEN** the login, registration and verification screens rendered at 360 px width
- **WHEN** each is shown with field errors, with a long server error message and in each verification state
- **THEN** the document scroll width does not exceed the viewport width
- **AND** the title, every field, the submit action and the route link are inside the viewport

#### Scenario: First viewport at 360 px

- **GIVEN** the login page at 360 by 800 px
- **WHEN** the first viewport is inspected
- **THEN** the title, both fields and the submit action are visible without scrolling

#### Scenario: Keyboard order and focus ring

- **GIVEN** the registration page focused at the document start
- **WHEN** the user presses Tab repeatedly
- **THEN** focus visits the email, password, confirm password, submit action and the log-in link in that order
- **AND** each focused element shows a 3px outline in the ink token with a paper gap ring

#### Scenario: Reduced motion

- **GIVEN** a user with `prefers-reduced-motion: reduce`
- **WHEN** any auth screen is used
- **THEN** no element inside the screen content animates and colour transitions complete without delay

### Requirement: Auth screen restyle changes no behavior

The restyle of the login, registration and verification screens SHALL NOT change
routes, request payloads, validation rules and messages, redirect targets, the
set of `t()` keys, or the text of any existing string. Login success MUST still
redirect by role or to the explicit `from` target; registration MUST still send
the same request and navigate as before; the registration submit MUST remain
disabled until the form is valid.

#### Scenario: Login redirect and error behavior are unchanged

- **GIVEN** the login page with credentials that the API accepts or rejects
- **WHEN** the form is submitted
- **THEN** an accepted login redirects exactly as before (explicit `from`, or by role)
- **AND** a rejected login shows the server message or the generic fallback in the single alert

#### Scenario: Registration request and validation are unchanged

- **GIVEN** the registration page
- **WHEN** a valid form is submitted and when passwords differ or are too short
- **THEN** the same register call is made with the email and password only on a valid form
- **AND** the same validation messages appear and the submit stays disabled while the form is invalid

#### Scenario: Dictionary is unchanged

- **GIVEN** the English dictionary before and after this change
- **WHEN** the `auth` and `identity.verify_email` groups are compared
- **THEN** their keys and values are identical

### Requirement: Listing detail page uses the Gantry Signage identity

The listing detail page (`/listings/:id`) SHALL render the Gantry Signage
identity in the warm palette with no behavior, route or API change. The primary
photo MUST have a 2px ink edge and no radius; thumbnails MUST be flat (no
radius), 2px-edged and non-interactive (no link, button, handler or focus
state). When the listing has no photo, the page MUST show a stone panel with a
dashed 2px ink edge and no radius. The listing type MUST render as a square
tag with a 2px ink edge (not a pill). The listing title MUST be the page's only
`h1`, set in the display font at weight 900 with solid leading. City and
country, and the address, MUST render as a departure-board row ruled by 2px ink
lines. Amenities MUST render as a list of flat tags with a 2px ink edge and no
pill radius. The rating MUST use a drawn star glyph that is decorative
(`aria-hidden`) in place of the emoji, with the same visible text. The page
MUST NOT use shadows, gradients or radii above 4px, and MUST NOT use a colour
outside the palette.

#### Scenario: Gallery is framed and non-interactive

- **GIVEN** a listing with a primary photo and two further photos at a 1440 px viewport
- **WHEN** the gallery is inspected
- **THEN** the primary photo has a 2px ink border and a 0 radius
- **AND** each thumbnail has a 2px ink border and a 0 radius
- **AND** no thumbnail is a link or a button and none is focusable

#### Scenario: No-photo placeholder is a dashed stone panel

- **GIVEN** a listing with no photos
- **WHEN** the gallery area is inspected
- **THEN** it is a stone panel with a 2px dashed ink border and a 0 radius
- **AND** it contains no text

#### Scenario: Header presents type, title and location as signs

- **GIVEN** a loaded listing
- **WHEN** the header is inspected
- **THEN** the type text sits in a tag with a 2px ink border and a radius of at most 4px
- **AND** the title is the only `h1` and its font family contains Overpass at weight 900
- **AND** the city and country text and the address text sit in a row with 2px ink rules above and below

#### Scenario: Amenities are flat tags

- **GIVEN** a listing with amenities
- **WHEN** the amenities section is inspected
- **THEN** each amenity is a list item with a 2px ink border and a radius of at most 4px
- **AND** none has a pill radius or a bare canvas-coloured fill without an edge

#### Scenario: Rating uses a drawn glyph

- **GIVEN** a listing with an average rating of 4.5 and three reviews
- **WHEN** the rating section is inspected
- **THEN** the text shows "4.5 / 5 (3 reviews)" with the same words as before
- **AND** the star glyph is an SVG marked `aria-hidden` and the emoji character is absent

#### Scenario: Surfaces stay inside the system

- **GIVEN** the loaded, no-photo and loading states
- **WHEN** every element's computed box-shadow, background image and border radius are resolved
- **THEN** none has a box shadow or a gradient
- **AND** none has a radius above 4px

### Requirement: Listing detail text pairings meet WCAG AA

Every text and surface pairing used on the listing detail page SHALL meet WCAG
2.1 AA, computed with the WCAG 2.1 formula: normal text 4.5:1, large text and
non-text edges and glyphs 3:1. Ink MUST be the only text colour on the ember
surface; paper, `fg-muted`, `fg-subtle` and danger MUST NOT be used as text on
ember. Danger text MUST sit only on paper or the danger tint.

#### Scenario: Pairings pass computed contrast

- **GIVEN** the pairings ink on ember, ink on paper, muted ink on paper, subtle ink on paper, subtle ink on stone, paper on ink, danger on the danger tint and the danger and ink edges against their surfaces
- **WHEN** their contrast ratios are computed with the WCAG 2.1 formula
- **THEN** every text pairing is at least 4.5:1 and every edge or glyph pairing at least 3:1

#### Scenario: Only ink text sits on ember

- **GIVEN** the booking panel at any viewport
- **WHEN** the computed colour of every text node inside the ember price band is resolved
- **THEN** each equals the ink token

### Requirement: Booking panel is a paper sign panel with an ember price band

The booking panel SHALL be a paper panel with a 2px ink edge, no shadow and a
radius of at most 4px, whose first element is an ember price band closed by a
2px ink rule and carrying the nightly price and the per-night unit in ink. The
price MUST use tabular numerals and weight 900. No control or input MUST sit on
the ember band. From the `md` breakpoint the panel MUST be sticky and MUST stay
clear of the navigation; below `md` it MUST be static and placed after the
listing content. The panel MUST NOT clip its focus ring or the date picker.
The `DateRangePicker`, the Book now action and the Log in to book action MUST
keep their existing behavior, conditions and look.

#### Scenario: Price band renders the approved colours

- **GIVEN** a loaded listing at a 1440 px viewport
- **WHEN** the booking panel is inspected
- **THEN** the panel has a 2px ink border, a paper background and no box shadow
- **AND** the band background resolves to `#E65F35` and has a 2px ink bottom border
- **AND** the price and the per-night unit resolve to the ink token

#### Scenario: Panel is sticky on desktop and last on mobile

- **GIVEN** a loaded listing
- **WHEN** viewed at 1440 px and scrolled, and at 360 px
- **THEN** at 1440 px the panel position is sticky and stays below the navigation while the content scrolls
- **AND** at 360 px the panel is static, sits below the description and amenities, and is inside the viewport

#### Scenario: Controls and role branches are unchanged

- **GIVEN** a guest with valid dates, a guest without dates, a host and a visitor
- **WHEN** the booking panel is rendered for each
- **THEN** the guest with valid dates sees Book now as a link to the booking URL with the dates
- **AND** the guest without dates sees a disabled Book now and the date picker
- **AND** the host sees neither Book now nor Log in to book
- **AND** the visitor sees Log in to book as a link to `/login`

### Requirement: Loading, not-found and error states are sign panels

The loading state SHALL render a flat skeleton with no radius above 2px, no
pill block and no shadow, marked busy. The not-found state SHALL render a solid
paper panel with a 2px ink edge and a solid ink tile, and the generic error
state SHALL render a panel with `role="alert"`, a 2px solid danger edge, the
danger tint fill and a filled danger tile. Each of the not-found and error
states MUST contain exactly one `h1` that uses the existing string for that
state, and MUST NOT introduce new copy. The loading state MUST have no `h1`.
The loaded state MUST have exactly one `h1`. The two panels MUST be
distinguishable by shape without colour. Danger MUST NOT sit on an ember
surface.

#### Scenario: Loading skeleton is flat

- **GIVEN** the listing request has not resolved
- **WHEN** the page is rendered
- **THEN** the skeleton container is present with its existing test id and `aria-busy="true"`
- **AND** no skeleton block has a pill radius or a radius above 2px and the booking placeholder has no shadow
- **AND** the page has no `h1`

#### Scenario: Not-found is a paper sign panel

- **GIVEN** the listing request fails with a 404
- **WHEN** the page settles
- **THEN** one `h1` shows the existing not-found text
- **AND** the panel is paper with a solid 2px ink border and an ink-filled tile
- **AND** the page has no `role="alert"` element

#### Scenario: Generic error is one alert panel with a shape cue

- **GIVEN** the listing request fails with a non-404 error
- **WHEN** the page settles
- **THEN** exactly one element has `role="alert"` and it contains one `h1` with the existing generic error text
- **AND** the panel has a 2px solid danger border, the danger tint background and a filled danger tile marked `aria-hidden`

#### Scenario: States are distinguishable in grayscale

- **GIVEN** the not-found and error panels rendered in grayscale
- **WHEN** their tile fills and glyphs are compared
- **THEN** not-found has a dark tile with an empty-frame glyph and error has a mid-tone tile with an exclamation glyph on a tinted panel
- **AND** the two do not share the same combination

### Requirement: Listing detail is usable at 360 px, by keyboard and with reduced motion

The listing detail page SHALL render without horizontal scrolling and without
clipped content at a 360 px viewport in every state, including long titles,
city, address, description and amenity labels, the no-photo state, the not-found
state and the error state. Keyboard focus order MUST follow the visual order
with a visible two-layer focus ring on every interactive element. The page MUST
NOT introduce animation, and colour transitions MUST be neutralised under
`prefers-reduced-motion: reduce`.

#### Scenario: No horizontal overflow at 360 px

- **GIVEN** the page at 360 px width
- **WHEN** it is shown loaded with long strings, with no photo, as not-found and as an error
- **THEN** the document scroll width does not exceed the viewport width
- **AND** the title, the booking panel and its actions are inside the viewport

#### Scenario: Single column at 360 px

- **GIVEN** a loaded listing at 360 px
- **WHEN** the layout is inspected
- **THEN** the gallery, header, description, amenities, rating, capacity and booking panel stack in that order in one column

#### Scenario: Keyboard focus ring

- **GIVEN** a guest with valid dates, and separately a visitor
- **WHEN** the user tabs to Book now, and to Log in to book
- **THEN** each focused action shows a 3px ink outline with a paper gap ring

#### Scenario: Reduced motion

- **GIVEN** a user with `prefers-reduced-motion: reduce`
- **WHEN** the page loads and is used
- **THEN** no element inside the page content animates and colour transitions complete without delay

### Requirement: Listing detail restyle changes no behavior

The restyle of the listing detail page SHALL NOT change routes, API calls,
query keys, retry behaviour, request payloads, role-based rendering, URL
parameter handling, the set of `t()` keys, the text of any existing string, the
API client or any shared primitive. No data, schema or backend file MUST change.

#### Scenario: Data and URL behavior are unchanged

- **GIVEN** the page opened with `checkIn` and `checkOut` query parameters
- **WHEN** it loads and the user changes the dates
- **THEN** the detail and blocked-dates requests are made as before
- **AND** the query parameters are kept in sync as before

#### Scenario: Dictionary is unchanged

- **GIVEN** the English dictionary before and after this change
- **WHEN** the `listings.detail`, `host.listings.type_*`, `search.per_night` and `error.generic.unexpected` keys are compared
- **THEN** their keys and values are identical

#### Scenario: No backend or client change

- **GIVEN** the change diff against `origin/main`
- **WHEN** the changed paths are listed
- **THEN** none is under `apps/api/`, `packages/db/`, `packages/shared/` or `apps/web/src/api/`

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

### Requirement: Host bookings page is a flat table from sm up and flat cards below it, with shape-coded booking status

The host bookings page (`/host/upcoming`) SHALL render exactly one `h1` in black
ink and the same bookings in one of two layouts chosen by viewport width. From
640px (`sm`) up it MUST render a flat table whose head row has a 2px ink bottom
rule and bold ink headings, whose body rows keep a 1px muted rule, and whose
amount cells use tabular figures. Below 640px it MUST render each booking as a
flat card instead: a `rounded-card` block with a 2px ink edge, no shadow and no
ring, holding the listing title (`break-words`, in a `min-w-0` column), the
shape-coded status tag, the check-in and check-out dates, the guest email
(`break-all`) and the amount, each labelled with the existing
`host.bookings.*_col` strings so no new copy is added. The status MUST therefore
be visible at 360px without any horizontal scrolling, and the document MUST NOT
scroll horizontally in either layout. Only one layout MUST be exposed at a time:
the table container uses `hidden sm:block` and the card list `sm:hidden`, so the
inactive layout is `display: none` and out of the accessibility tree and its text
is never announced twice. Date and amount formatting MUST NOT change. The booking
status MUST render in the one local status tag, used by both layouts, that
carries the status by shape and text with the unchanged
`booking.dashboard.status_*` strings: pending dashed ink edge, confirmed solid
ink edge, cancelled solid muted edge with struck-through text, completed solid
ink edge with a filled marker. The tag MUST NOT be a pill. With no bookings the
page MUST render the unchanged `EmptyState` with the same props.

#### Scenario: Cards below sm show every field

- **GIVEN** a host with bookings, one with a very long guest email, at a 360 px viewport
- **WHEN** the page is inspected
- **THEN** each booking is a visible card with a 2px ink border showing the listing title, the status tag, both dates, the guest email and the amount
- **AND** the table is not displayed and the document scroll width does not exceed the viewport width

#### Scenario: Table from sm up

- **GIVEN** a host with bookings at a 1440 px viewport
- **WHEN** the page is inspected
- **THEN** the table is visible with a 2px ink bottom border on the head row and bold ink headings, and the cards are not displayed

#### Scenario: Only one layout is exposed

- **GIVEN** the host bookings page with bookings
- **WHEN** its markup is inspected
- **THEN** the table container has the classes `hidden` and `sm:block` and the card list has the class `sm:hidden`, so at any width exactly one of them is displayed and the other is out of the accessibility tree

#### Scenario: Booking status is carried by shape

- **GIVEN** one booking in each status
- **WHEN** the status tags of the visible layout are inspected
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
the host bookings page shows cards below 640 px instead of a scrolling table. The header New
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
secondary button override, listing photo treatment and the hard-coded photo alt) MUST be recorded.

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
- **THEN** they list the shared state panel, the shared booking status tag, the `Badge` pill, the nested link and button issue (#138), listing photos (#121) and the hard-coded photo alt

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

#### Scenario: Long unbroken strings keep every column inside the table

- **GIVEN** an admin viewing users with a very long unbroken email (about 120 characters) and listings with a very long unbroken title (about 100 characters), at a 1440 px viewport
- **WHEN** each table is inspected
- **THEN** every column, including Status and Actions, stays inside the table container with no horizontal scroll inside it
- **AND** the action button stays on one line
- **AND** the 3px focus ring of the last-column action is not clipped at the container's right edge

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
