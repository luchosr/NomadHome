# Proposal: add-search-ui

## Why

Guests need a way to discover listings. This ticket adds the search page (city + date form with listing card grid) and the listing detail page (photos, amenities, reviews, book CTA). Together they form the discovery leg of the booking loop — without them, guests cannot find anything to book (NH-019).

## What

- `GET /listings/:id` — new public API endpoint returning a published listing's full detail (photos, amenities, average rating). Mounted on the existing public router before the host-only router.
- `/search` page — city input + check-in/check-out date pickers, results grid of `ListingCard` components, pagination.
- `/listings/:id` page — full listing detail: photo gallery, amenities list, star rating, reviews section, and a "Book now" CTA (visible only to authenticated guests).
- Router updated with the two new public routes.

## Impact

- **Capabilities affected**: `search`, `listings` (public view layer only)
- **Breaking changes**: no
- **Migration required**: no
- **Out of scope**: booking flow (NH-020), host management of listings (NH-022)

## Risks & Mitigations

| Risk                                                                 | Likelihood | Mitigation                                                                                                                                           |
| -------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public `GET /listings/:id` shadows existing host `GET /listings/:id` | Low        | Verified — no existing tests or frontend code uses the host GET-by-ID route; host dashboard (NH-022) will use `GET /listings/mine` + PATCH endpoints |
| Search form UX complexity                                            | Low        | Minimal form: city text + two date inputs; no autocomplete                                                                                           |

## Rollout

Big bang — no feature flag needed, no existing search UI to replace.
