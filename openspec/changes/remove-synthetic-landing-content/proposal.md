# Proposal: remove-synthetic-landing-content

## Why

`refresh-visual-identity` (NH-118, D8) deliberately shipped the landing page
with **synthetic placeholder content**: invented statistics (4 cities, 142
rooms, 92% occupancy, +62 NPS), an invented testimonial with a named author,
three invented featured stays (names, USD monthly prices, state tags), an
example co-living monthly rate (`$1,100`) and an invented workspace status
strip ("Dedicated desk · Wi-Fi"). That decision was explicitly temporary: D8
and task 11.1 require replacing or removing it before public launch, and
`apps/web/PRODUCT.md` already forbids fabricated testimonials or usage
statistics. Presenting invented figures as real is a trust and legal risk for a
booking product whose promise is "believe the listings and prices because they
are real".

Ticket NH-121 (GitHub issue #121) closes the content part of that debt.
This change **references** #121 and does **not** close it: the remote
Unsplash/picsum placeholder photos stay for now (see Out of scope), so the
issue remains open for them.

## What

- Remove the `StatsSection` and `TestimonialSection` entirely (components,
  tests, constants, `t()` keys, lazy imports in `HomePage`).
- `FeaturedStaysSection` reads **real published listings** from the existing
  search endpoint (no backend change) and renders the newest few as
  departure-board rows with the real title, city and country, type,
  photo, and the nightly rate exactly as the API returns it. The whole
  section is hidden when there are no results or the request fails; while
  loading it shows reserved-height skeleton rows. The invented state tags
  (Featured / Available / Coming soon) and the invented three-letter city code
  are dropped.
- Remove the co-living example monthly rate and the workspace status strip;
  keep each section's real descriptive copy and make both layouts hold without
  them (no empty gaps).
- Keep the Locations destination index (editorial links to
  `/search?city=<name>`); it makes no inventory claim.
- Re-balance page rhythm: with Stats and Testimonial gone, two ember fields
  would touch (Locations then the CTA band), so Locations moves to a
  different field colour (design.md D8).
- Update `DESIGN.md` and the surface brief where they still describe the
  removed sections as synthetic or as sage users.

## Impact

- **Capabilities affected**: `platform` (adds two requirements about landing
  content honesty and real featured stays). `search` is consumed read-only
  through its existing endpoint; its spec does not change.
- **Breaking changes**: no. No API, schema or route change. The web search
  client gains an optional `pageSize` argument that the API already accepts
  (`pageSize` default 20, max 100).
- **Migration required**: no. No Prisma change, no data migration.
- **Out of scope**: replacing the remote Unsplash/picsum photos in the
  co-living and workspace sections (documented remaining item, tracked in
  #121, which stays open); curated or editor-picked "featured" selection, a
  sort parameter, or any new endpoint (the search spec makes newest-first the
  only MVP order); a monthly rate (the API exposes only a nightly rate);
  changes to Locations content; i18n; anything on the Post-MVP/Never lists in
  `openspec/project.md` section 3.

## Risks & Mitigations

| Risk                                                                                                 | Likelihood | Mitigation                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production database has few or no published listings, so the featured section vanishes on launch day | High       | Hiding is the specified behaviour (no fake rows); page rhythm holds without it (design.md D8, D9); launch checklist note to seed real listings first |
| Layout shift when the section resolves to empty or error after reserving skeleton space              | Medium     | Skeleton height matches the final board; collapse happens below the first viewport; accepted trade-off recorded in design.md D3                      |
| "Featured" implies curation but the data is newest-first                                             | Medium     | Headline copy changed to a neutral "newly listed" phrasing; no curation claim (design.md D2)                                                         |
| API returns a currency other than USD (the disposable test data uses EUR)                            | Low        | Render the amount with the API's `currency` as returned, never converting; MVP is USD-only so production data is expected to be USD                  |
| Long titles, missing photo or missing price break the board layout                                   | Medium     | Explicit rules and tests (design.md D6)                                                                                                              |
| E2E/landing tests now depend on the search endpoint                                                  | Medium     | All landing e2e mock `/search*`; one optional real-data pass against the disposable test database only                                               |
| Removed `t()` keys still referenced elsewhere                                                        | Low        | Typed `Dictionary` and `pnpm typecheck` fail on stale `LocaleKey` use; `rg` check in tasks                                                           |

## Rollout

Big bang in one PR; no flag. The PR description **references** `#121`
("Refs #121") and MUST NOT use closing keywords (`Closes`, `Fixes`,
`Resolves`), because the photo replacement remains open under that issue.
