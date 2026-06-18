# search — Delta for add-search-ui

## ADDED Requirements

### Requirement: Search page UI

The web app SHALL provide a `/search` page where any visitor can enter a city and date range, submit the form, and see a paginated grid of matching published listings.

#### Scenario: valid search returns listing cards

- **Given** a visitor is on `/search`
- **When** they enter a city, check-in date, check-out date, and submit
- **Then** the page shows a grid of `ListingCard` components with title, type, city, nightly rate, and primary photo

#### Scenario: empty results

- **Given** no listings match the search criteria
- **When** the search completes
- **Then** the page shows an "No listings found" message

#### Scenario: date validation

- **Given** the visitor enters a check-out date before check-in
- **When** they submit
- **Then** the form shows a validation error and does not call the API

### Requirement: Public listing detail API

The API SHALL expose `GET /listings/:id` as a public (no auth required) endpoint that returns the full detail of a PUBLISHED listing, including photos sorted by position and aggregate review data.

#### Scenario: published listing detail

- **Given** a published listing with photos and reviews exists
- **When** `GET /listings/:id` is called without auth
- **Then** the API returns 200 with title, type, city, description, amenities, photos, nightlyRateCents, avgRating, reviewCount

#### Scenario: non-published or missing listing

- **Given** a listing ID that does not exist or is not PUBLISHED
- **When** `GET /listings/:id` is called
- **Then** the API returns 404
