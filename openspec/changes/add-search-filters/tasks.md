# Tasks: add-search-filters

## 1. Frontend API client

- [ ] 1.1 Extend `SearchParams` in `apps/web/src/api/search.ts` with optional fields: `type`, `amenities` (string[]), `minPrice` (number, cents), `maxPrice` (number, cents), `capacity` (number)
- [ ] 1.2 Serialize filter fields into the `URLSearchParams` in `searchApi.search()`: `type` as-is, `amenities` as comma-joined string, `minPrice`/`maxPrice`/`capacity` as strings

## 2. Strings

- [ ] 2.1 Add filter string keys under `search` in `packages/shared/src/strings/en.ts`:
  - `filter_title`, `filter_type_label`, `filter_type_all`, `filter_type_property`, `filter_type_workspace`
  - `filter_amenities_label`, `filter_min_price_label`, `filter_max_price_label`, `filter_capacity_label`
  - `filter_apply`, `filter_reset`, `filter_toggle`

## 3. SearchPage UI

- [ ] 3.1 Extend `SearchFormSchema` in `apps/web/src/pages/SearchPage.tsx` with filter fields: `type` (enum | ""), `amenities` (string[]), `minPrice` (string), `maxPrice` (string), `capacity` (string)
- [ ] 3.2 Read filter values from `useSearchParams` on page load (restore state from URL)
- [ ] 3.3 Add collapsible filter panel below the main search bar (collapsed on mobile by default, expanded on `sm+`):
  - Type: `<select>` with options All / Property / Workspace
  - Amenities: checkbox list using the `AMENITIES` constant from `@nomadhome/shared` (or inline the common set if no constant exists)
  - Min price / Max price: number inputs (display in whole dollars; multiply by 100 before passing to API)
  - Min capacity: number input (min=1)
- [ ] 3.4 In `onSubmit`, convert form values to `SearchParams` (price × 100, amenities array, type omitted when empty), update URL query params, set `activeSearch`
- [ ] 3.5 Include filter values in `queryKey` so TanStack Query refetches when filters change

## 4. Tests

- [ ] 4.1 Update `apps/web/src/pages/SearchPage.test.tsx` (or create it if it doesn't exist) with:
  - Renders filter panel
  - Selecting a type filter passes `type` to the API mock
  - Entering min/max price converts to cents in the API call
  - Selecting amenity passes comma-joined value
  - Resetting filters clears all filter fields and refetches without filter params
