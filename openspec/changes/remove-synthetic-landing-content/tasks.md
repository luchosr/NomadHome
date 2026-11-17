# Tasks: remove-synthetic-landing-content

Change-id: `remove-synthetic-landing-content`. Ticket: NH-121 (#121). Branch:
`feature/NH-121-remove-synthetic-landing-content` (worktree
`../nomadhome-worktrees/NH-121`). Order follows TDD (red, green, refactor,
verify). `openspec/config.yaml` defines no extra mandatory steps; the mandatory
steps from `docs/openspec-tasks-mandatory-steps.md` apply. This change reads
the existing search endpoint (no backend change), so the curl step is a
read-only check against the **disposable test database only** (never the
development database). Reports live in
`openspec/changes/remove-synthetic-landing-content/reports/` (same deliberate
deviation as `refresh-visual-identity`: a `specs/<change>/` folder without a
`spec.md` would break `openspec validate`). The PR references `#121` and MUST
NOT close it (photos remain, design.md D11).

## 0. Setup (MANDATORY - FIRST STEP)

- [ ] 0.1 Confirm work is on branch `feature/NH-121-remove-synthetic-landing-content` (worktree `../nomadhome-worktrees/NH-121`) created from `origin/main`
- [ ] 0.2 Verify clean baseline in the worktree after `pnpm install`: `pnpm lint && pnpm typecheck && pnpm test` green before changes; do not start or reuse a dev server on a port shared with another worktree
- [ ] 0.3 Capture the baseline reference list: `rg -n "StatsSection|TestimonialSection|STAT_ITEMS|FEATURED_CARDS|home\.(stats|testimonial|featured\.cards)|price_value|status_desks" apps packages --glob '!node_modules'`

## 1. Red tests

- [ ] 1.1 Red: add `apps/web/src/pages/home/FeaturedStaysSection.test.tsx` (QueryClientProvider with `retry: false`, mocked `searchApi.search`) for the platform scenarios: renders N real rows with title, city, country, type, price from `nightlyRateCents` and `currency`, link `/listings/<id>`, no state tag; requests `page=1`, `pageSize=3`; empty result renders nothing; rejected request renders nothing and no error text; pending state shows busy skeletons and no listing text; long title, `primaryPhotoUrl: null` and non-positive rate render a usable row; missing amenities and unknown amenity codes
- [ ] 1.2 Red: add a `searchApi` test (`apps/web/src/api/search.test.ts` or the existing one) that `pageSize` is sent only when provided and the current URL shape is otherwise unchanged
- [ ] 1.3 Red: add a dictionary test in `packages/shared` asserting `en.home` has no `stats`, `testimonial`, `featured.cards`, `coliving.price_*`, `workspace.status_*` keys, and has `featured.price_per_night` and `featured.loading_label`
- [ ] 1.4 Red: update `apps/web/src/pages/HomePage.test.tsx` to wrap in `QueryClientProvider` with a mocked search; drop the stats/testimonial, co-living price and workspace status assertions; add assertions that no `$1,100`, "NPS" or testimonial text renders and that the featured section is absent for an empty result; add a test that no two adjacent landing sections share a background class
- [ ] 1.5 Red: add a `formatRate` unit test for the extracted `apps/web/src/lib/money.ts` (USD and EUR examples, no conversion)

## 2. Strings and constants removal

- [ ] 2.1 Remove `home.stats.*`, `home.testimonial.*`, `home.featured.cards.*`, `home.coliving.price_label|price_value|price_period` and `home.workspace.status_open|status_desks` from `packages/shared/src/strings/en.ts`; change `home.featured.headline_*` to "Newly listed" / "stays" (no post); add `home.featured.price_per_night` ("/ night") and `home.featured.loading_label`
- [ ] 2.2 Remove `STAT_ITEMS` and `FEATURED_CARDS` and the `SYNTHETIC (NH-118 ...)` comments on content that remains-or-goes from `apps/web/src/pages/home/constants.ts`; replace the `LOCATION_CARDS` note with the editorial-links note (design.md D10)
- [ ] 2.3 Delete `StatsSection.tsx` and `TestimonialSection.tsx` (and any test or story files for them)

## 3. Featured stays data wiring (green)

- [ ] 3.1 Add optional `pageSize` to `SearchParams` and `searchApi.search` in `apps/web/src/api/search.ts` (no other change)
- [ ] 3.2 Extract `formatRate` from `apps/web/src/components/ListingCard.tsx` to `apps/web/src/lib/money.ts` and import it in both places; `ListingCard` tests stay green unchanged
- [ ] 3.3 Rewrite `FeaturedStaysSection.tsx` per design.md D1 to D3, D5, D6: `useQuery` (`["home","featured-stays"]`, `staleTime` 60 s, `retry: false`), skeleton rows with `aria-busy`, `null` for empty and error, rows linking to `/listings/<id>`, type pictogram in the code square, photo or pictogram fallback, city and country, meta line with type and up to 3 amenity labels, price via `formatRate` plus `home.featured.price_per_night`, no Badge, `alt=""` thumbnails; keep the ink row, ember hover and ink focus ring styling

## 4. Co-living and workspace cleanup

- [ ] 4.1 `CoLivingSection.tsx`: remove the example rate block and the `SYNTHETIC` comment; keep the ink panel as a pictogram-only sign beside the checklist (design.md D7); keep body copy, features and image
- [ ] 4.2 `WorkspaceSection.tsx`: remove the inverse status strip and the `SYNTHETIC` comment; keep photo frame, arrow and checklist stack
- [ ] 4.3 Verify no empty block or floating one-line panel at 1440 px and 360 px (finalised in section 9)

## 5. HomePage composition and rhythm

- [ ] 5.1 `HomePage.tsx`: remove the `StatsSection` and `TestimonialSection` lazy imports and `Suspense` blocks; set the featured `Suspense` fallback `minHeight` to match the loading skeleton frame
- [ ] 5.2 `LocationsSection.tsx`: change the field to `bg-surface-inset` (stone) so it no longer touches the ember CTA band (design.md D8); confirm "Explore all" and row hover contrast on stone against the approved pairings
- [ ] 5.3 Refactor: run the section-list rhythm test from 1.4 and confirm green with the featured section present and hidden

## 6. Review and update existing unit tests (MANDATORY)

- [ ] 6.1 Review every test touching the landing, `ListingCard`, `searchApi`, `en.ts` keys and shared dictionary snapshots; update stale assertions without weakening them (`rg` for the removed names must return no source hits)
- [ ] 6.2 Verify: `pnpm --filter @nomadhome/web test && pnpm --filter @nomadhome/shared test && pnpm lint && pnpm typecheck` green

## 7. Run unit tests and verify database state (MANDATORY - AGENT MUST EXECUTE)

- [ ] 7.1 Run targeted tests for changed modules, then `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
- [ ] 7.2 Database state: the change is read-only. Use only the disposable `nomadhome_test` database (confirm with `select current_database()`). Before and after the test run capture `Listing`, `ListingPhoto`, `ListingAmenity` and `Amenity` row counts; confirm unchanged and restore any test data if not
- [ ] 7.3 Write report `openspec/changes/remove-synthetic-landing-content/reports/YYYY-MM-DD-step-7-unit-test-and-db-verification.md` with commands, results and the DB pre/post comparison

## 8. Manual endpoint testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [ ] 8.1 Start the API with explicit env overrides against the **disposable test database only** (not the `.env`-loading dev script), on a free non-5173 port; the route is `GET /search` (no `/api` prefix)
- [ ] 8.2 Seed temporary published listings in `nomadhome_test` (with and without a photo and amenities); run `curl -s -w "\nHTTP %{http_code}\n" "http://localhost:<port>/search?page=1&pageSize=3"` and verify HTTP 200, the `{ data, pagination }` envelope, at most 3 items, newest-first order, and the fields the board uses (`id, title, type, city, country, nightlyRateCents, currency, primaryPhotoUrl, amenities`)
- [ ] 8.3 curl the empty case (no published listings) and verify `data: []`, `total: 0`; curl `pageSize=0` and `page=0` and verify HTTP 400 is unchanged; record the currency actually returned
- [ ] 8.4 Remove all temporary rows and re-check counts match the 7.2 baseline
- [ ] 8.5 Write report `openspec/changes/remove-synthetic-landing-content/reports/YYYY-MM-DD-step-8-curl-verification.md` with every command, response and cleanup action

## 9. E2E and visual checks (MANDATORY - AGENT MUST EXECUTE)

- [ ] 9.1 Update `apps/web/e2e/layout.spec.ts` and any spec touching the landing: `/search*` is mocked for every landing visit; keep existing hero assertions
- [ ] 9.2 Add e2e (mocked) for: two real rows render with title, city, price, link to `/listings/<id>`; empty result hides the whole section; HTTP 500 hides the section; no `NPS`, testimonial or `$1,100` text; no horizontal overflow at 1440 px and 360 px with a long-title mock
- [ ] 9.3 If the harness can run against the disposable test database with seeded listings and an isolated port, add one real-data pass and record it; otherwise record in the report why it was not feasible
- [ ] 9.4 Execute `pnpm test:e2e` on an isolated port (never another worktree's server or port 5173 if it is in use); restore test data afterwards
- [ ] 9.5 Visual check at 1440 px and 360 px with Playwright (featured present, featured hidden, loading): confirm no empty gaps in co-living and workspace, board rows wrap correctly, Locations on stone reads as intended and no two adjacent fields match; attach screenshots to the report
- [ ] 9.6 Write report `openspec/changes/remove-synthetic-landing-content/reports/YYYY-MM-DD-step-9-e2e-and-visual-verification.md`

## 10. Documentation (MANDATORY)

- [ ] 10.1 `apps/web/DESIGN.md`: remove the testimonial from the Sage rules (co-living field and hero facts list only) and trim the "synthetic demo content" paragraph to the remaining items (placeholder photos; the editorial Locations index is not synthetic data); note the board now renders real listings
- [ ] 10.2 `apps/web/.impeccable/surfaces/src-pages-homepage-tsx.md`: update the "Proof" line (no stats or testimonial; featured stays are real listings); review `apps/web/.impeccable/design.json` for sample rows presented as real and decide (design.md D12)
- [ ] 10.3 `rg -n -i "stats section|testimonial|synthetic|\$1,100" README.md docs apps/web/*.md apps/web/.impeccable openspec/project.md` and update remaining non-archive mentions; do not edit `openspec/changes/archive/` or `openspec/specs/`
- [ ] 10.4 Record a launch note in the PR: seed or onboard real listings before public launch, otherwise the featured section is hidden by design (design.md D9)

## 11. Memory notes

- [ ] 11.1 Save engram notes (`mem_save`) for the decisions: featured stays = newest three via existing search endpoint, state tags and monthly rate dropped, Locations moved to stone, photos remain open under #121; then `mem_session_summary` before reporting done

## 12. Final verification

- [ ] 12.1 `node scripts/check-mvp-scope.mjs` and `openspec validate remove-synthetic-landing-content --strict` pass
- [ ] 12.2 Final `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` green
- [ ] 12.3 `rg -n "SYNTHETIC \(NH-118" apps` returns only items intentionally kept (none expected); `rg` for the removed constants and keys returns no source hits
- [ ] 12.4 PR title states the user story, the description links the change-id and says "Refs #121" (no closing keyword); remaining item recorded: replace the remote Unsplash photos (co-living, workspace) with real or licensed self-hosted photography
