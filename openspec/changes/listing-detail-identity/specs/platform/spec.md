# platform — Delta for listing-detail-identity

## ADDED Requirements

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
