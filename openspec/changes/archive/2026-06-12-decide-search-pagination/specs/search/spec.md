## MODIFIED Requirements

### Requirement: Search results are paginated

The system SHALL paginate search responses using **offset / limit pagination**. The response envelope MUST expose both the page of results and pagination metadata sufficient for the client to request subsequent pages and to render a "showing X–Y of N" summary.

Query parameters:

- `page` — integer, `≥ 1`, default `1`. Selects the 1-indexed page.
- `pageSize` — integer, `∈ [1, 100]`, default `20`. Caps the number of items returned in the page.

Response envelope:

```json
{
  "data": [ /* page of result items */ ],
  "pagination": {
    "total": <integer ≥ 0>,
    "page": <integer ≥ 1>,
    "pageSize": <integer in [1, 100]>,
    "hasMore": <boolean>
  }
}
```

- `total` SHALL be the total number of matching items across all pages (not just the returned page).
- `page` and `pageSize` SHALL echo the resolved values used to compute the response (after defaults are applied).
- `hasMore` SHALL be `true` iff `page * pageSize < total`. It is redundant with `total` but exposed for client convenience.

Out-of-range parameters (`page < 1`, `pageSize < 1`, `pageSize > 100`, or non-integer values) SHALL fail Zod validation at the platform-spec REST boundary and return HTTP `400` with a structured error identifying the offending field. The controller handler SHALL NOT be invoked for invalid pagination input.

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
