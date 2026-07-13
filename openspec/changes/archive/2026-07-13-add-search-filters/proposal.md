# Proposal: add-search-filters

## Why

The backend search endpoint already accepts filter parameters (`type`, `amenities`, `minPrice`, `maxPrice`, `capacity`) and the spec already documents "Guest can filter search results" as a requirement. However, the frontend `SearchPage` only exposes city and date range — the filter parameters are never sent to the API. This gap means US-3.2 is unshippable: guests cannot narrow results even though the backend supports it.

## What

- Add a filter panel to `SearchPage` with: listing type (Property / Workspace), amenity chips (multi-select), minimum price, maximum price, and minimum capacity.
- Extend `SearchParams` in `apps/web/src/api/search.ts` to include the missing filter fields.
- Serialize filter state into URL query params so search results are shareable/bookmarkable.
- Wire the filter values through to the `searchApi.search()` call.

## Impact

- **Capabilities affected**: `search`
- **Breaking changes**: no
- **Migration required**: no
- **Out of scope**: custom sort order (post-MVP per spec), saved/pinned filters, map view

## Risks & Mitigations

| Risk                                          | Likelihood | Mitigation                                                                    |
| --------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Filter panel clutters the mobile layout       | Medium     | Collapsible "Filters" section on mobile, expanded by default on desktop       |
| Amenity list grows unbounded                  | Low        | Use the same `AMENITIES` constant already defined in `@nomadhome/shared`      |
| Price inputs accept cents vs display currency | Low        | UI fields accept whole-currency values; multiply by 100 before sending to API |

## Rollout

Big bang — no feature flag needed. Backend is already live and tested.
