# platform — Delta for remove-synthetic-landing-content

## ADDED Requirements

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
