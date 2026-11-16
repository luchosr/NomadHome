# platform — Delta for refresh-visual-identity

## MODIFIED Requirements

### Requirement: Shared design tokens expose the NomadHome brand to Tailwind

The system SHALL expose the NomadHome "Gantry Signage" design tokens through the
shared Tailwind preset (`packages/config/tailwind.preset.js`) so that every
workspace app and the UI package consume one source of brand values. The preset
MUST define, under `theme.extend`, the brand palette (signal yellow `#FFC700`,
black, white, sign green `#00704A`), the semantic color roles (e.g. surface,
fg, border, action, success roles with fixed approved foreground pairings), the
font families (`display`, `sans`, `mono`), a fluid sign-scale type scale, the
spacing scale, the border radii, and the flat (non-blurred) elevations. The
previous `sand`, `ink`, `forest`, and `terracotta` scales MUST NOT remain in
the preset.

#### Scenario: Brand utility classes resolve from the preset

- **GIVEN** an app that extends the shared Tailwind preset
- **WHEN** a component uses `bg-signal`, `text-fg`, `bg-sign-green`, and `font-display`
- **THEN** the build resolves each to the corresponding design-token value
- **AND** no class falls back to an undefined/empty Tailwind value

#### Scenario: Legacy brand scales are gone

- **GIVEN** the shared Tailwind preset and all source under `apps/web/src` and `packages/ui/src`
- **WHEN** the source is searched for `sand-`, `forest-`, `terracotta-` and `ink-` utility classes
- **THEN** no match is found

### Requirement: UI package ships brand base styles and fonts

The system SHALL provide a single shared stylesheet entry point in
`packages/ui` that loads the brand fonts (a self-hosted grotesque display and
text family chosen outside the common default-font list, plus a mono family),
declares the design-token CSS custom properties, and applies base element
styles: the default canvas is the white surface token, headings use the display
family set solid, and interactive elements expose a visible focus ring that
meets WCAG 2.1 AA non-text contrast on both signal and white surfaces. The
stylesheet MUST keep the `@tailwind base/components/utilities` directives.

#### Scenario: Base styles apply the brand canvas and display headings

- **GIVEN** the UI package stylesheet is imported by an app
- **WHEN** the document body and an `h1` are rendered with no extra classes
- **THEN** the body background resolves to the white surface token and the `h1` uses the display font family

#### Scenario: Focus ring is visible on every surface

- **GIVEN** an interactive element focused by keyboard on a signal, white, or green panel
- **WHEN** the focus ring is rendered
- **THEN** it has a contrast ratio of at least 3:1 against its adjacent colors

### Requirement: Shared primitives follow the design system

The system SHALL provide shared React primitives in `packages/ui` that match the
design system: a `Button` supporting `primary`, `secondary`, `tertiary`, and
`destructive` variants, plus `Badge`, `Input`, `Card`, and `Skeleton`
components. The `Button` default variant MUST be the solid black primary on the
signal-themed system, and all primitives MUST be exported from the package
entry point. Existing primitive consumers MUST keep working without prop
changes (the `variant` prop is optional and defaults to `primary`); this change
SHALL NOT alter any primitive's public props or behavior, only its styling.

#### Scenario: Button renders the requested variant

- **GIVEN** the `Button` primitive
- **WHEN** it is rendered with `variant="secondary"`
- **THEN** it renders the secondary (outlined, transparent-fill) treatment
- **AND** rendering with no `variant` prop yields the solid black primary

#### Scenario: Existing primitive APIs are preserved

- **WHEN** `Button`, `Badge`, `Input`, `Card`, and `Skeleton` are imported from the `packages/ui` entry point
- **THEN** each resolves to a renderable React component accepting the same props as before this change

## ADDED Requirements

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
text and non-text UI components at least 3:1, including black on `#FFC700`,
white on `#00704A`, and black on white.

#### Scenario: Token pairings pass computed contrast

- **GIVEN** every approved foreground/background pairing defined in the tokens
- **WHEN** contrast ratios are computed
- **THEN** each meets the applicable WCAG 2.1 AA threshold

### Requirement: Landing and search screens use the Gantry Signage identity

The landing page and the search screen SHALL render the new identity with no
behavior or API change. The landing first viewport MUST present a full-width
signal-yellow panel, the city input as the largest destination line, dates with
a stay-length numeral, Live and Work pictograms sharing one arrow to a solid
black search-action panel, a slim nav, and no hero photo. The search screen MUST
show comparable listing cards (photo, type, nightly price in USD, 2-3
amenities), filters in a side panel on desktop and a sheet on mobile, and no
map. All user-facing strings MUST go through `t()`.

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
