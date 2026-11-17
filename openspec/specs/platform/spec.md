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

