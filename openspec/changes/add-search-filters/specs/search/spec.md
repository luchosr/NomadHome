# search — Delta for add-search-filters

## MODIFIED Requirements

### Requirement: Search page UI

The web app SHALL provide a `/search` page where any visitor can enter a city, date range, and optional filters (type, amenities, minimum price, maximum price, minimum capacity), submit the form, and see a paginated grid of matching published listings.

Filter state SHALL be serialized into URL query parameters so that a filtered search URL is shareable and produces the same results on reload.

#### Scenario: valid search returns listing cards

- **Given** a visitor is on `/search`
- **When** they enter a city, check-in date, check-out date, and submit
- **Then** the page shows a grid of `ListingCard` components with title, type, city, nightly rate, and primary photo

#### Scenario: guest applies type filter

- **Given** a visitor has entered a city and date range on `/search`
- **When** they select listing type "Workspace" and submit
- **Then** the page shows only workspace listings in the results
- **And** the URL includes `type=WORKSPACE`

#### Scenario: guest applies price range filter

- **Given** a visitor has entered a city and date range on `/search`
- **When** they enter a minimum price of 50 and a maximum price of 150 and submit
- **Then** the API is called with `minPrice=5000` and `maxPrice=15000` (cents)
- **And** results are limited to listings within that nightly rate range

#### Scenario: guest applies amenity filter

- **Given** a visitor has entered a city and date range on `/search`
- **When** they select "WiFi" from the amenity options and submit
- **Then** the API is called with `amenities=wifi`
- **And** results only include listings that have the WiFi amenity

#### Scenario: guest applies capacity filter

- **Given** a visitor has entered a city and date range on `/search`
- **When** they set minimum capacity to 2 and submit
- **Then** the API is called with `capacity=2`
- **And** results only include listings that accommodate at least 2 guests

#### Scenario: filtered URL is shareable

- **Given** a visitor performs a search with `type=WORKSPACE` and `minPrice=50`
- **When** they copy the URL and open it in a new tab
- **Then** the same filter state is restored from the URL query params
- **And** the same API call is made automatically on page load

#### Scenario: empty results

- **Given** no listings match the search criteria
- **When** the search completes
- **Then** the page shows a "No listings found" message

#### Scenario: date validation

- **Given** the visitor enters a check-out date before check-in
- **When** they submit
- **Then** the form shows a validation error and does not call the API
