## ADDED Requirements

### Requirement: Search results have a deterministic default sort order

The system SHALL return search results ordered by `Listing.createdAt` descending (newest published listings first), with `Listing.id` ascending as a tiebreaker when two listings share the same `createdAt`. This default order is required for pagination to be deterministic — under offset pagination, an undefined order can cause consecutive pages to repeat or skip items as the underlying row ordering shifts.

This is the only sort order supported in MVP. A client-provided `?sort` query parameter is OUT of scope for MVP; any such parameter SHALL be ignored (no error, no behavior change).

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
