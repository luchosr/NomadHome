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
