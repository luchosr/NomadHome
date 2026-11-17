# Design: remove-synthetic-landing-content

Ticket NH-121 (#121). Builds on `refresh-visual-identity` D8. No backend,
schema or route change.

## D1. Data source and query for featured stays

Reuse the existing public search endpoint through the existing web client
`searchApi.search` in `apps/web/src/api/search.ts` (`GET /search`).

- Request: `page=1&pageSize=3`, no filters. The client currently sends only
  `page`; add an **optional** `pageSize?: number` to `SearchParams` and send it
  when set. The API already validates `pageSize` (`int`, 1 to 100, default 20)
  in `SearchQuerySchema`, so this is a client-only change. The existing search
  page does not pass it, so its behaviour is unchanged.
- Order: the API's only MVP order, `createdAt` descending then `id` ascending
  (search spec, "Search results have a deterministic default sort order").
  "Featured" therefore means **the three newest published listings**. No sort
  parameter, no curation, no new endpoint (all out of scope).
- Hook: a small `useFeaturedStays` (or inline `useQuery`) in
  `apps/web/src/pages/home/` using TanStack Query, key
  `["home", "featured-stays"]` (separate from the search page's
  `["search", params]` keys so the two never share a cache entry),
  `staleTime` 60 s, `retry: false` so an API outage hides the section quickly
  instead of showing skeletons through three backoff retries.
- Only `data.data` is used; `pagination` is ignored. No pagination UI.
- The section keeps its "See all stays" link to `/search` (the unfiltered
  search page).

## D2. Field mapping (API item to UI)

`SearchResultItem`: `id, title, type, city, country, nightlyRateCents,
currency, totalCents, primaryPhotoUrl, amenities?`.

| UI element (departure-board row)   | Source                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row link target                    | `/listings/${id}` (real listing detail), not `/search`                                                                                                      |
| Code square (was invented `OAX`)   | `Pictogram` by real `type`: `bed` for `PROPERTY`, `desk` for `WORKSPACE`; decorative                                                                        |
| Thumbnail                          | `primaryPhotoUrl`; when `null`, a stone block with the type pictogram (same fallback as `ListingCard`)                                                      |
| City line                          | `city`, plus `country` separated by a comma ("Lisbon, PT"); a blank country is omitted with its comma                                                       |
| Title                              | `title`                                                                                                                                                     |
| Meta line (was invented "6 rooms") | type label (`host.listings.type_property` / `type_workspace`) and up to 3 amenity labels via `AMENITY_OPTIONS` (unknown codes skipped, as in `ListingCard`) |
| Price                              | `nightlyRateCents` and `currency`, see below                                                                                                                |
| State tag Badge                    | **Dropped.** The API has no featured/availability/coming-soon state; mapping anything would invent data                                                     |

Price: the API exposes a **nightly** rate only (`totalCents` equals nightly
times 1 when no dates are given, so it adds nothing). The old "$1,100 / mo"
monthly figure cannot be produced without converting, which is forbidden.
Format with `Intl.NumberFormat("en-US", { style: "currency", currency })` on
`cents / 100`, exactly as `ListingCard.formatRate` does, followed by a
`t("home.featured.price_per_night")` suffix ("/ night"). Extract
`formatRate` from `ListingCard.tsx` into `apps/web/src/lib/money.ts` so the
card and the board share one formatter (behaviour unchanged, `ListingCard`
tests stay green). No rounding, conversion or currency override: a listing
priced in EUR renders in EUR. MVP is USD-only, so production data is USD.

Headline: "Houses we'd recommend right now." is an editorial claim the data does
not support. New copy under the same `home.featured.headline_*` keys:
pre "Newly listed", em "stays", no post (renders "Newly listed stays.").

## D3. Loading, empty and error behaviour

| State                 | Rendering                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading               | Section frame with the heading and 3 skeleton rows (`Skeleton` from `@nomadhome/ui`) sized like real rows; `aria-busy="true"`; no fake text, no invented rows |
| Success, 1 to 3 items | Board with that many rows (no padding up to 3)                                                                                                                |
| Success, 0 items      | Component returns `null`: no heading, no link, no frame                                                                                                       |
| Error                 | Component returns `null`; no error text, no retry button (the section is decorative proof, not a task)                                                        |

Layout shift trade-off (explicit): the skeleton reserves roughly the final
board height so a successful load does not shift content. When the result is
empty or errors, the section collapses and content below moves up. This is
accepted: the section sits below the hero, the collapse happens once, and
showing nothing while loading would shift every successful load instead. The
`Suspense` fallback in `HomePage` for this section keeps a `min-height`
matching the skeleton frame so the lazy chunk to skeleton hand-off does not
jump either.

## D4. Strings (`packages/shared/src/strings/en.ts`) and constants

Removed keys and constants (no consumer remains afterwards):

- `home.stats.*` (4 keys) and `STAT_ITEMS`.
- `home.testimonial.*` (5 keys).
- `home.featured.cards.*` (all three cards) and `FEATURED_CARDS`.
- `home.coliving.price_label`, `price_value`, `price_period`.
- `home.workspace.status_open`, `status_desks`.

Kept: `home.featured.headline_*` (copy changed per D2), `see_all`,
`home.coliving.*` and `home.workspace.*` descriptive copy and `image_alt`,
`home.locations.*`.

Added: `home.featured.price_per_night` ("/ night") and
`home.featured.loading_label` (accessible name for the busy region, for
example "Loading newly listed stays"). Same top-level domain `home`, existing
format rules unchanged. A unit test asserts the dictionary no longer contains
`home.stats`, `home.testimonial`, `home.featured.cards` or the removed
co-living/workspace keys, so they cannot silently return.

## D5. Accessibility of the departure board with real rows

- Each row stays one `<a>` inside a `<ul>/<li>`; its accessible name is its
  text: title, city and country, meta line and price. The code square, the
  thumbnail (`alt=""`, because the title is adjacent text) and the arrow are
  `aria-hidden` / decorative, as today.
- Section `<h2>` and the loading region: `aria-busy="true"` with an
  accessible label while loading; skeletons are `aria-hidden`.
- Hover and focus keep the ink-row to ember inversion and the ink focus ring
  (`--focus: ink`), already contrast-approved; state is never colour only
  (there is no state any more).
- The price keeps contrast: ember on ink at rest and ink on ember on
  hover/focus (the approved pairings in `apps/web/DESIGN.md`). The "/ night"
  suffix inherits the row foreground.
- Rows are real links to real pages, so the departure-board metaphor no longer
  includes dead `/search` links.

## D6. Long titles, long cities, missing price, missing photo

- Title: `min-w-0`, `break-words`, `line-clamp-2`; the row height may grow by
  at most the clamp, never overflow horizontally at 360 px.
- City and country line: `break-words`, no clamp; wraps within its grid area.
- Meta line: wraps; up to 3 amenities.
- Price: rendered only when `nightlyRateCents > 0` and the currency formats
  without throwing (fall back to omitting the price cell, never to "$0" or an
  invented value). The schema makes the field a required integer, so this is
  defensive; the row stays a valid link without it.
- Photo: `loading="lazy"`, fixed `aspect-[4/3]` box so late image loads do not
  shift the row; `null` URL uses the pictogram fallback.
- An item with an empty title is not special-cased (the schema requires a
  string; the API owns validity).

## D7. Co-living and workspace without the invented figures

- **Co-living**: the ink price panel held the bed pictogram plus the example
  rate. Keep the ink panel as a pictogram-only sign (large `bed` pictogram,
  square, fixed `lg` width) beside the checklist, so the sign-board pairing
  of "pictogram + facts" survives with no text hole and no stretched empty
  area. The checklist panel stays. `home.coliving.body` and the three features
  are unchanged.
- **Workspace**: remove the inverse status strip under the photo; the photo
  keeps its 2 px frame and the arrow plus checklist stack follows unchanged.
- The final markup is the implementer's call within one constraint: at 1440 px
  and 360 px, neither section shows an empty block or a one-line panel
  floating in space (checked visually in tasks section 9).
- The remote photos in both sections are untouched (documented remaining item).

## D8. Page rhythm and first viewport after removals

Field sequence today: hero ember, featured paper, how-it-works ink, co-living
sage, workspace paper, locations ember, stats paper, testimonial sage, CTA
ember, footer. Removing stats and testimonial makes **locations (ember) touch
the CTA band (ember)**, which breaks the "one field, one fact" rhythm (two
fields differ only by a 2 px edge).

Decision: move `LocationsSection` from `bg-ember` to the stone inset field
(`bg-surface-inset`). Ink on stone is an approved pairing; the row hover
(`bg-action`, `text-action-fg`) and the "Explore all" button (`bg-surface`)
keep their contrast on stone, verified in tasks. Result: ember hero, paper
featured, ink how-it-works, sage co-living, paper workspace, stone locations,
ember CTA, footer. No two adjacent fields share a background, with or without
the featured section (hero ember to ink how-it-works is fine when featured is
hidden).

The first viewport is the hero only (`HeroSection`), untouched; the featured
section is below it. The existing platform scenario "Landing first viewport at
360 px" is unaffected.

## D9. Empty production database

An empty or small production database makes the section disappear, and the
landing then goes hero, how-it-works, co-living. That is the intended honest
outcome. Mitigations: the page rhythm holds (D8); the launch checklist
should seed or onboard real listings before public launch (note in the PR and
in tasks); the section scales from 1 to 3 rows without placeholders. No
fallback to demo data is allowed, now or later, by the new platform
requirement.

## D10. Locations destination index

Kept per user decision. It is editorial navigation (city name, country,
link to `/search?city=<name>`), makes no inventory, price or availability
claim, and the search page already handles cities with no results. The
`SYNTHETIC` code comments in `constants.ts` and `LocationsSection.tsx` are
replaced with a note that these are editorial links, not inventory claims.
Other `SYNTHETIC (NH-118...)` comments are removed together with the content
they marked.

## D11. Remaining item: placeholder photos (documented, issue stays open)

The co-living and workspace photos remain remote Unsplash URLs (the picsum
placeholder disappears with `FEATURED_CARDS`, because featured thumbnails now
come from real listing photos). They carry no provenance or licence guarantee,
depend on network access, and are not the product's photography. They must be
replaced with real or properly licensed, self-hosted photography before public
launch. This stays tracked in #121; the PR uses "Refs #121" and does not close
it. `apps/web/DESIGN.md` keeps a pared-down "synthetic content" note that lists
only the photos and the editorial Locations index.

## D12. Docs touched

- `apps/web/DESIGN.md`: Sage rule and the "synthetic demo content" paragraph
  (remove stats, testimonial, featured stays, co-living rate; keep photos).
- `apps/web/.impeccable/surfaces/src-pages-homepage-tsx.md`: "Proof" line.
- `apps/web/.impeccable/design.json`: only if it presents the removed sections
  as real patterns; the board-row sample is a design-system showcase and may
  stay if clearly sample content (decide while reviewing, record the choice).
- `openspec/changes/archive/` is not edited.
