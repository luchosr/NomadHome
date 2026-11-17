# Tasks: listing-detail-identity

Change-id: `listing-detail-identity`. Ticket: NH-126 (#126), follow-up of NH-125.
Branch: `feature/NH-126-listing-detail-identity` (worktree
`../nomadhome-worktrees/NH-126`). Order follows TDD (red, green, refactor,
verify). `openspec/config.yaml` defines no extra mandatory steps; the mandatory
steps from `docs/openspec-tasks-mandatory-steps.md` apply. This change is
frontend only (no backend, schema, route, API or API-client change), so the
database and curl steps are recorded as not applicable with a justification and
a check that the justification still holds. Reports live in
`openspec/changes/listing-detail-identity/reports/` (same deliberate deviation
as earlier UI changes: a `specs/<change>/` folder without a `spec.md` would
break `openspec validate`). **Copy: no `t()` key or string value changes** (task
1.9 guards it). The PR description says "Refs #126; closes #126".

Isolation rules for every run: never start or reuse a server on port 5173 or on
another worktree's port; pick a free port first; no database is started.

## 0. Setup (MANDATORY - FIRST STEP)

- [x] 0.1 Confirm work is on branch `feature/NH-126-listing-detail-identity` (worktree `../nomadhome-worktrees/NH-126`) created from `origin/main`
- [x] 0.2 `pnpm install` inside the worktree, then verify a clean baseline: `pnpm lint && pnpm typecheck && pnpm test` green before any change
- [x] 0.3 Capture the baseline: `rg -n "ListingDetailPage|listing-detail-skeleton|listings.detail" apps/web/src apps/web/e2e` and the current text and role queries in `ListingDetailPage.test.tsx` and in `apps/web/e2e/us-4.1-booking.spec.ts`; confirm the page is the only user of the code to be restyled (nothing shared is changed)

## 1. Red tests (unit, Vitest + Testing Library)

- [x] 1.1 Red: extend `apps/web/src/pages/ListingDetailPage.test.tsx` (add `getBlockedDates` to the `listingsApi` mock): the loaded state has exactly one `h1` (the title) and the amenities and rating `h2`s; the type text, `city, country` text and address text render; the type tag carries a 2px border class and no pill radius
- [x] 1.2 Red: gallery: the primary photo carries the 2px ink edge and no radius classes; thumbnails render with the same classes, are not links or buttons, and none has an `onClick`-driven role or `tabindex`; with no photos the dashed stone placeholder renders (dashed 2px edge, stone fill, no text) and `bg-slate-100` and `rounded-xl` are gone
- [x] 1.3 Red: amenities render as a `list` with one `listitem` per amenity, each tagged with the 2px border class and no `rounded-full`; the existing label assertions (`WIFI`, `KITCHEN`) still resolve to one node each
- [x] 1.4 Red: rating: the text `4.5 / 5 (3 reviews)` is present, the ⭐ character is absent from the document, and one `svg` marked `aria-hidden="true"` precedes the text; with `avgRating: null` the no-reviews string renders and no star is drawn
- [x] 1.5 Red: booking panel: the price band contains the price and the per-night unit and carries the ember background and ink text classes (no `text-fg-muted`, `text-fg-subtle` or `text-fg-inverse` inside it); the panel has the 2px ink edge, no `shadow`, and `md:sticky`; the guest (with and without dates), host and visitor branches render exactly as before (existing assertions kept, plus: disabled Book now when dates are missing)
- [x] 1.6 Red: loading: the container keeps `data-testid="listing-detail-skeleton"`, has `aria-busy="true"`, contains no `h1`, and no block uses `rounded-xl` or `rounded-pill`
- [x] 1.7 Red: not-found (404): exactly one `h1` with `t("listings.detail.not_found")`, paper panel classes, an `aria-hidden` ink tile, and no `role="alert"`
- [x] 1.8 Red: error (non-404): exactly one `role="alert"` containing exactly one `h1` with `t("error.generic.unexpected")`, solid danger edge, danger tint fill and an `aria-hidden` filled tile
- [x] 1.9 Red: dictionary-unchanged test: snapshot as literals the values of `listings.detail.*`, `host.listings.type_property`, `host.listings.type_workspace`, `search.per_night` and `error.generic.unexpected` at baseline and assert they equal `t()` output and that every key the page reads exists
- [x] 1.10 Run the new and extended tests and record that they fail for the right reason (missing structure, classes and roles, not a typo)

## 2. Red tests (e2e, Playwright, mocked API)

- [x] 2.1 Red: add `apps/web/e2e/listing-detail-identity.spec.ts` patterned on `layout.spec.ts` (mock `http://localhost:3000/listings/:id` and `/listings/:id/blocked-dates`; helpers for no-overflow, inside-viewport and screenshot attach) at 1440x900 and 360x800: primary photo border 2px and radius 0; `h1` font family contains Overpass and weight 900; type tag border 2px; amenity tags border 2px and radius not 9999px; no element with a box shadow or gradient
- [x] 2.2 Red: price band background `rgb(230, 95, 53)` and the computed colour of every text node inside it equals ink `rgb(30, 30, 30)`; the booking panel has a 2px ink border, a paper background and `box-shadow: none`; no input or button is a descendant of the band
- [x] 2.3 Red: sticky: at 1440 the panel `position` is `sticky`, and after scrolling the page its top stays at or below the nav height and inside the viewport; at 360 it is `static` and its top is below the bottom of the amenities and rating content
- [x] 2.4 Red: no-photo listing: placeholder `border-style: dashed`, stone background `rgb(229, 226, 221)`, radius 0; layout checks still pass
- [x] 2.5 Red: states: a 404 shows one `h1` and no `role="alert"`; a 500 shows one `role="alert"` with one `h1`, danger border colour `rgb(155, 28, 46)`, solid style and tint background `rgb(248, 225, 224)`; the loaded state has exactly one `h1`
- [x] 2.6 Red: 360 px no-overflow for loaded (very long title, city, address, description and amenity label), no-photo, not-found and error; document `scrollWidth <= innerWidth` and booking actions inside the viewport
- [x] 2.7 Red: keyboard: a guest with valid dates tabs to Book now and a visitor to Log in to book; the focused action shows the 3px ink outline
- [x] 2.8 Run the new e2e spec against an isolated server (see 9.1) and record that it fails before implementation

## 3. Page implementation (green)

- [x] 3.1 `ListingDetailPage.tsx`: add the local pieces per design.md D2 to D5 and D7 (a `TypeTag`, an `AmenityTag` list, a `StarGlyph` authored on a 24 grid with `aria-hidden`, a `StatePanel` with an authored tile glyph for not-found and error); no new shared component, no `packages/ui` change, no `t()` call outside the ones already used
- [x] 3.2 Gallery (D2): framed primary photo, flat wrapping non-interactive thumbnails, dashed stone placeholder; keep `alt`, `maxHeight` and the photo sort and slice logic exactly
- [x] 3.3 Header and content (D3, D4): type tag, solid Overpass 900 `h1`, departure-board row (`{city}, {country}` kept as one text node), `max-w-prose` description, ink 2px amenity tags in a list, star glyph rating, capacity line
- [x] 3.4 Booking panel (D5): paper panel with ember price band (price and unit in ink, tabular, 900), body with the unchanged picker and CTAs, `md:sticky md:top-24`, no shadow and no `overflow-hidden`; keep every condition, handler, URL and `setSearchParams` call untouched
- [x] 3.5 Skeleton (D6): flat blocks, 2px ink-edged booking placeholder, `aria-busy="true"`, same test id and heights
- [x] 3.6 Not-found and error (D7): paper sign panel with ink tile and one `h1`; `role="alert"` danger panel with filled tile and one `h1`; same strings and same trigger conditions
- [x] 3.7 Run tasks 1.1 to 1.9 green and re-run 2.x e2e green against the isolated server

## 4. Review and update existing unit tests (MANDATORY)

- [x] 4.1 Review every test and e2e spec that renders or navigates to the page: `ListingDetailPage.test.tsx`, `apps/web/e2e/us-4.1-booking.spec.ts`, `apps/web/e2e/focus-hover.spec.ts`, `apps/web/e2e/layout.spec.ts` (and `rg -n "listings/" apps/web/e2e apps/web/src --glob "*.test.*"`); update stale class or text assumptions without weakening any assertion; confirm text queries still resolve to one node (the not-found text is now an `h1`; the price query `/90/` still matches once)
- [x] 4.2 Confirm `ListingCard`, `SearchResults` and the home board tests are untouched (nothing shared changed)
- [x] 4.3 Verify: `pnpm --filter @nomadhome/web test && pnpm lint && pnpm typecheck` green

## 5. Run unit tests and verify database state (MANDATORY - AGENT MUST EXECUTE)

- [x] 5.1 Run targeted tests for the changed files, then `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; record totals
- [x] 5.2 Database state: **not applicable.** The change is frontend only. Justification check: `git diff origin/main --stat` shows no path under `apps/api/`, `packages/db/` or `packages/shared/`, and no database is started by any step. If any such path appears, stop and reopen this task
- [x] 5.3 Write report `openspec/changes/listing-detail-identity/reports/YYYY-MM-DD-step-5-unit-test-verification.md` with commands, results and the not-applicable justification for the database step

## 6. Manual endpoint testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [x] 6.1 **Not applicable.** No endpoint, request shape, response shape, status code or API client changes; the page calls the same `GET /listings/:id` and `GET /listings/:id/blocked-dates` through the unchanged `listingsApi`. Justification check: `git diff origin/main --stat -- apps/web/src/api apps/api` is empty. Record the check and the result in the step 7 report instead of a curl report

## 7. E2E and visual checks (MANDATORY - AGENT MUST EXECUTE)

- [x] 7.1 Isolated run setup: pick a free port (`node -e "require('net').createServer().listen(0,function(){console.log(this.address().port);this.close()})"`), start the web dev server only with `pnpm --filter @nomadhome/web exec vite --port <port> --strictPort`, and run Playwright with a throw-away config kept outside the repo (scratchpad) that spreads the repo config, sets `baseURL` to that port, uses an absolute `testDir` and `reuseExistingServer: false`; never use 5173; API calls are mocked so no API or database runs
- [x] 7.2 Run `apps/web/e2e/listing-detail-identity.spec.ts`, `us-4.1-booking.spec.ts`, `focus-hover.spec.ts` and `layout.spec.ts` on the isolated port and confirm green
- [x] 7.3 Run the whole `pnpm test:e2e` suite on the isolated port (throw-away config) and confirm green; record any failure that is a hard-coded port 5173 URL in an unrelated spec as unchanged by this change
- [x] 7.4 Visual check with Playwright at 1440x900 and 360x800: loaded as guest with dates, loaded as visitor, loaded as host, no-photo, three-photo gallery, no reviews, very long strings, loading skeleton, not-found, error, and the date picker open; save PNGs to `openspec/changes/listing-detail-identity/reports/screenshots/`; confirm frame and tag alignment, board row stacking, sticky panel clearance under the nav, no overflow, star and tile glyphs read on the 24 grid, price band is ink on ember, and the not-found and error panels are distinguishable in grayscale (also capture one grayscale pass); note how `DateRangePicker` sits in the new panel (follow-up)
- [x] 7.5 Confirm keyboard use through Playwright key presses (Tab order, Enter on Book now, focus ring visible on paper and stone, picker keyboard use unchanged) and that no console error is logged in any state
- [x] 7.6 Write report `openspec/changes/listing-detail-identity/reports/YYYY-MM-DD-step-7-e2e-and-visual-verification.md` with the port used, commands, results, screenshot list, the no-backend-change check from 6.1 and any finding

## 8. Documentation (MANDATORY)

- [x] 8.1 Write the surface brief `apps/web/.impeccable/surfaces/src-pages-listingdetailpage-tsx.md` (frontmatter `version: 1`, `slug: "src-pages-listingdetailpage-tsx"`, `primary_target: "src/pages/ListingDetailPage.tsx"`, `related_targets: []`) in the format of `src-pages-homepage-tsx.md` and `src-pages-loginpage-tsx.md`: scope and mode (Operate, inheriting the landing world), audience, job, action, proof (real listing data only, nothing invented), constraints, direction contract (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM, FINISH), palette note, unresolved decisions (D1 to D12 summarised, plus the follow-ups)
- [x] 8.2 Update `apps/web/DESIGN.md`: add a "Listing detail" subsection under Components (gallery frame and dashed placeholder, type tag, departure-board row, amenity tags, star glyph, booking panel with ember price band and sticky rule, not-found and error sign panels with the tile rule), add the matching Do and Don't lines (price on ember is ink; stone dashed panel for absent media), and fix the Overview sentence that lists the screens so it mentions the listing detail; no token or palette change; run `rg -n -i "listing detail|ListingDetail|/listings/" apps/web/DESIGN.md apps/web/PRODUCT.md` and fix any stale description
- [x] 8.3 `rg -n -i "listing detail|listing page|detail page" README.md docs apps/web/*.md apps/web/.impeccable openspec/project.md` and update remaining non-archive mentions that contradict the shipped look; do not edit `openspec/changes/archive/` or `openspec/specs/`
- [x] 8.4 Record in the PR description the follow-ups from design.md: gallery interaction (thumbnail selection, lightbox, distinct alt text), `DateRangePicker` visual pass, `Button` nested in `Link` for Book now and Log in to book, guest reviews not rendered; also `DateRangePicker` default blue for today, chevrons and range (scope `--rdp-*` to `.rdp-root`, ember and ink tokens) plus a selected-range capture, centre the picker (`mx-auto`), a `Button` variant replacing the `border-2 ![box-shadow:none]` override, distinct gallery alt text (needs copy), the pre-existing `Link > Button` double tab stop, optional heavier stroke for the error "!" glyph

## 9. Memory notes

- [ ] 9.1 Save engram notes (`mem_save`) for the decisions: frame kept (no band), non-interactive wrapping thumbnails, dashed stone placeholder, ink-only ember price band, sticky `md:top-24`, local pieces instead of shared components, not-found paper vs error danger-tint panels with one `h1` each; then `mem_session_summary` before reporting done

## 10. Final verification

- [x] 10.1 `node scripts/check-mvp-scope.mjs` and `openspec validate listing-detail-identity --strict` pass
- [x] 10.2 Final `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` green (e2e on the isolated port; caveat as in 7.3)
- [x] 10.3 `rg -n "rounded-xl|rounded-lg|rounded-full|rounded-pill|shadow-sm|bg-slate|⭐|text-fg-subtle|text-fg-muted" apps/web/src/pages/ListingDetailPage.tsx` returns only intended hits (`fg-muted` and `fg-subtle` only on paper; none inside the price band; no emoji, pill, shadow or slate)
- [x] 10.4 Confirm no unrelated file changed: `git diff origin/main --stat` lists only the files in design.md "Files in scope"
- [ ] 10.5 PR title states the user story (for example: "Let a visitor judge a stay and its price on a listing page that looks like the rest of NomadHome"), the description links the change-id and says "Refs #126; closes #126", and attaches the 1440 and 360 screenshots; commits are Conventional with the (NH-126) suffix, one per reviewable change, no AI attribution
