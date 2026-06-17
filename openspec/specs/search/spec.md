# search Specification

## Purpose

Guest-facing discovery of published listings by city, date range, and filters (price, type, amenities, capacity). Returns a paginated offset/limit envelope with `{ data, pagination: { total, page, pageSize, hasMore } }` per `decide-search-pagination`. Read-only over the `Listing` and `AvailabilityBlock` aggregates owned by the `listings` capability.

## Requirements

### Requirement: Guest can search listings by city and date range

The system SHALL allow any visitor (authenticated or not) to search listings by
city, check-in date, and check-out date. Results MUST include only `published`
listings located in the requested city that have availability for the entire
requested range.

Each result item MUST include the listing's primary photo, title, type
(`property` or `workspace`), nightly rate, and the computed total for the
requested range (nightly rate × number of nights, before fees).

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

The system SHALL allow guests to narrow a result set by price range, type,
amenities, and capacity. Filters MUST be combinable (AND semantics) and MUST
only apply to the current result set.

#### Scenario: Guest applies multiple filters

- **GIVEN** an active search result set in city `C` for dates `[check_in, check_out)`
- **WHEN** the guest applies filters `type=workspace`, `amenities includes "wifi"`, and `capacity >= 2`
- **THEN** the response only includes listings that satisfy all three filter clauses
- **AND** listings that satisfy only some clauses are excluded

### Requirement: Search results are paginated

The system SHALL paginate search responses using **offset / limit pagination**.
The response envelope MUST expose both the page of results and pagination
metadata sufficient for the client to request subsequent pages and to render a
"showing X–Y of N" summary.

Query parameters:

- `page` — integer, `≥ 1`, default `1`. Selects the 1-indexed page.
- `pageSize` — integer, `∈ [1, 100]`, default `20`. Caps the number of items returned in the page.

Response envelope:

```json
{
  "data": [
    /* page of result items */
  ],
  "pagination": {
    "total": "<integer ≥ 0>",
    "page": "<integer ≥ 1>",
    "pageSize": "<integer in [1, 100]>",
    "hasMore": "<boolean>"
  }
}
```

- `total` SHALL be the total number of matching items across all pages (not just the returned page).
- `page` and `pageSize` SHALL echo the resolved values used to compute the response (after defaults are applied).
- `hasMore` SHALL be `true` iff `page * pageSize < total`. It is redundant with `total` but exposed for client convenience.

Out-of-range parameters (`page < 1`, `pageSize < 1`, `pageSize > 100`, or
non-integer values) SHALL fail Zod validation at the platform-spec REST
boundary and return HTTP `400` with a structured error identifying the offending
field. The controller handler SHALL NOT be invoked for invalid pagination input.

#### Scenario: First page of a multi-page result set

- **GIVEN** a search whose total matching listings exceed the page size
- **WHEN** the guest requests the first page
- **THEN** the response includes a page of results
- **AND** the response envelope is `{ data, pagination: { total, page, pageSize, hasMore } }`
- **AND** `pagination.page` equals the requested page (or `1` if omitted)
- **AND** `pagination.pageSize` equals the requested page size (or `20` if omitted)
- **AND** `pagination.hasMore` is `true`

#### Scenario: Default pagination parameters are applied when omitted

- **GIVEN** a search request with no `page` or `pageSize` query parameters
- **WHEN** the guest submits the search
- **THEN** the system returns up to 20 result items
- **AND** the response envelope reports `pagination.page = 1` and `pagination.pageSize = 20`
- **AND** `pagination.total` reflects the total number of matching items across the full result set

#### Scenario: Last page reports hasMore false

- **GIVEN** a search whose total matching listings is `N`
- **AND** the requested page is `ceil(N / pageSize)` (the final page)
- **WHEN** the guest requests that page
- **THEN** the response includes the remaining items (possibly fewer than `pageSize`)
- **AND** `pagination.hasMore` is `false`

#### Scenario: Out-of-range page parameter is rejected

- **GIVEN** a search request with `page=0` (or any value `< 1`, or non-integer)
- **WHEN** the request is submitted
- **THEN** the system returns HTTP `400`
- **AND** the response body identifies `page` as the offending field
- **AND** the controller handler is not invoked

#### Scenario: Out-of-range pageSize parameter is rejected

- **GIVEN** a search request with `pageSize=200` (or any value `< 1` or `> 100`, or non-integer)
- **WHEN** the request is submitted
- **THEN** the system returns HTTP `400`
- **AND** the response body identifies `pageSize` as the offending field
- **AND** the controller handler is not invoked

### Requirement: Search results have a deterministic default sort order

The system SHALL return search results ordered by `Listing.createdAt`
descending (newest published listings first), with `Listing.id` ascending as a
tiebreaker when two listings share the same `createdAt`. This default order is
required for pagination to be deterministic — under offset pagination, an
undefined order can cause consecutive pages to repeat or skip items as the
underlying row ordering shifts.

This is the only sort order supported in MVP. A client-provided `?sort` query
parameter is OUT of scope for MVP; any such parameter SHALL be ignored (no
error, no behavior change).

#### Scenario: Default sort is applied when no sort parameter is provided

- **GIVEN** a search request with city and date range but no `sort` query parameter
- **AND** at least three published listings matching the search with distinct `createdAt` values
- **WHEN** the guest submits the search
- **THEN** the returned listings appear in `createdAt` descending order
- **AND** the listing with the most recent `createdAt` appears first

#### Scenario: Two consecutive pages do not overlap or skip listings

- **GIVEN** a search whose total matching listings is exactly `N` where `N > pageSize`
- **AND** no new listings are inserted, deleted, or updated between requests
- **WHEN** the guest requests page 1 then page 2 with the same `pageSize`
- **THEN** the union of the two pages contains exactly `min(2 × pageSize, N)` distinct listings
- **AND** no listing appears in both pages
- **AND** the ordering across the two pages remains `createdAt` descending, `id` ascending

#### Scenario: Tiebreaker applied when two listings share createdAt

- **GIVEN** two published listings A and B matching the search, with identical `createdAt` values
- **AND** `A.id < B.id` (UUID comparison, lexicographic)
- **WHEN** the guest submits the search
- **THEN** listing A appears before listing B in the returned page
- **AND** the relative order of A and B is stable across repeated requests

#### Scenario: Client-provided sort parameter is ignored in MVP

- **GIVEN** a search request that includes a `sort` query parameter (e.g. `?sort=nightlyRate`)
- **WHEN** the request is submitted
- **THEN** the response is unchanged from a request without the parameter
- **AND** no error is returned
