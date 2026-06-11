## ADDED Requirements

### Requirement: Guest can search listings by city and date range

The system SHALL allow any visitor (authenticated or not) to search listings by city, check-in date, and check-out date. Results MUST include only `published` listings located in the requested city that have availability for the entire requested range.

Each result item MUST include the listing's primary photo, title, type (`property` or `workspace`), nightly rate, and the computed total for the requested range (nightly rate × number of nights, before fees).

#### Scenario: Visitor searches a city with available listings

- **GIVEN** at least one `published` listing in city `C` with continuous availability across `[check_in, check_out)`
- **WHEN** the visitor submits a search for city `C` and the date range `[check_in, check_out)`
- **THEN** the response includes that listing in the result set
- **AND** each result item exposes primary photo, title, type, nightly rate, and computed total for the requested range

#### Scenario: Listing with partial availability is excluded

- **GIVEN** a published listing in city `C` with availability blocked for at least one date inside `[check_in, check_out)`
- **WHEN** the visitor searches for city `C` and the range `[check_in, check_out)`
- **THEN** the response does not include that listing

#### Scenario: Draft and disabled listings are excluded

- **GIVEN** listings in city `C` that are in `draft` status or that have been disabled by an admin
- **WHEN** the visitor searches for city `C`
- **THEN** the response does not include those listings, regardless of availability

### Requirement: Guest can filter search results

The system SHALL allow guests to narrow a result set by price range, type, amenities, and capacity. Filters MUST be combinable (AND semantics) and MUST only apply to the current result set.

#### Scenario: Guest applies multiple filters

- **GIVEN** an active search result set in city `C` for dates `[check_in, check_out)`
- **WHEN** the guest applies filters `type=workspace`, `amenities includes "wifi"`, and `capacity >= 2`
- **THEN** the response only includes listings that satisfy all three filter clauses
- **AND** listings that satisfy only some clauses are excluded

### Requirement: Search results are paginated

The system SHALL paginate search responses. The response envelope MUST expose both the page of results and pagination metadata sufficient for the client to request subsequent pages.

> **\[OPEN]** Exact pagination strategy (offset vs. cursor), default page size, and maximum page size are not fixed by this baseline. The first search-implementing ticket MUST resolve these before merging. See Finding 11 of `docs/adversarial-review.md`.

#### Scenario: First page of a multi-page result set

- **GIVEN** a search whose total matching listings exceed the page size
- **WHEN** the guest requests the first page
- **THEN** the response includes a page of results
- **AND** the response includes pagination metadata indicating that more results exist and how to request the next page
