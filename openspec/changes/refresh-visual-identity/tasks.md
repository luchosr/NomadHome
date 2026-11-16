# Tasks: refresh-visual-identity

Change-id: `refresh-visual-identity`. Ticket: NH-118. Branch: `feature/NH-118-refresh-visual-identity`.
Order follows TDD (red, green, refactor, verify). Each task fits one sub-agent invocation.
`openspec/config.yaml` defines no extra mandatory steps; mandatory steps from
`docs/openspec-tasks-mandatory-steps.md` apply. One small additive backend
change (search results return `amenities`, design.md D10) makes the curl and
DB-state steps real (sections 8 and 9). Reports live in
`openspec/changes/refresh-visual-identity/reports/` (a deliberate deviation
from `specs/<change-name>/reports/`: a spec folder without `spec.md` would
break `openspec validate`).

## 0. Setup (MANDATORY - FIRST STEP)

- [ ] 0.1 Confirm work is on branch `feature/NH-118-refresh-visual-identity` (worktree `../nomadhome-worktrees/NH-118`) created from `origin/main`
- [ ] 0.2 Verify current branch and clean baseline: `pnpm lint && pnpm typecheck && pnpm test` green before changes

## 1. Tokens and fonts

- [ ] 1.1 Red: add Vitest/static checks (token resolution, legacy scale absence per spec scenarios) in `packages/ui` or `packages/config` that fail against the current preset
- [x] 1.2 Replace `sand`/`ink`/`forest`/`terracotta` with Gantry tokens (signal, black, white, sign-green, semantic roles, `display`/`sans`/`mono`, fluid sign-scale type, radii, flat elevations) in `packages/config/tailwind.preset.js`; re-point leftover old-scale class usages across `apps/web/src` and `packages/ui/src` to semantic roles
- [x] 1.3 Choose the display/text typeface per design.md D4, self-host it, and record the choice and licence in `design.md`
- [x] 1.4 Rewrite `packages/ui/src/styles/globals.css`: font loading, token CSS variables, white canvas, display headings set solid, AA-compliant focus ring; keep `@tailwind` directives; refresh logo SVGs in `packages/ui/src/assets/` for the new identity

## 2. UI primitives (same APIs)

- [ ] 2.1 Red: update `button`, `badge`, `input`, `card`, `skeleton` tests to assert the new variants and unchanged prop surfaces; add failing tests for `Pictogram` and `Arrow`
- [ ] 2.2 Restyle `Button`, `Input` in `packages/ui/src/components/` (no prop changes)
- [ ] 2.3 Restyle `Badge` (solid/dashed/struck states), `Card`, `Skeleton`
- [ ] 2.4 Add `Pictogram` (bed, desk) and `Arrow` SVG primitives and export all from `packages/ui/src/index.ts`
- [ ] 2.5 Verify: `pnpm --filter @nomadhome/ui test && pnpm lint && pnpm typecheck` green

## 3. Landing migration

- [ ] 3.1 Red: update `apps/web` landing tests/selectors for the new structure (first-viewport elements, search submit unchanged); add `t()` keys under existing top-level domains only
- [ ] 3.2 Rebuild `HeroSection.tsx` and `useHomeSearch.ts` presentation: yellow panel, city input as largest line, dates plus stay-length numeral, Live/Work pictograms with shared arrow to the black search panel; slim nav styling in `Layout.tsx`; no hero photo
- [ ] 3.3 Migrate remaining sections in `apps/web/src/pages/home/` (`HowItWorksSection`, `CoLivingSection`, `WorkspaceSection`, `FeaturedStaysSection`, `LocationsSection`, `CtaBandSection`, `SectionHeading`, `FeatureList`, `CheckIcon`, `HomeFooter`) to one-panel-one-fact composition
- [ ] 3.4 Mark `StatsSection` and `TestimonialSection` as synthetic placeholders (code comment per design.md D8), restyled only
- [ ] 3.5 Verify at 360 px and desktop: no horizontal scroll, no clipping; `pnpm test` green

## 4. Search API: amenities in results (backend, additive)

- [x] 4.1 Red: in `apps/api/src/search.test.ts` add failing tests for the `search` delta scenarios (result items include `amenities` codes sorted by code; listing without amenities returns `[]`); add one more failing test, for `SearchResultItemSchema`, in `packages/shared/src/schemas/` for the optional `amenities: string[]`
- [x] 4.2 Green (shared): add `amenities: z.array(z.string()).optional()` to `SearchResultItemSchema` in `packages/shared/src/schemas/search.ts`
- [x] 4.3 Green (api): in `apps/api/src/repositories/search.repository.ts` extend the existing `include` with `amenities: { select: { amenityCode: true }, orderBy: { amenityCode: "asc" } }` and map `amenities: l.amenities.map((a) => a.amenityCode)`; no change to `where`, count, sort or pagination (no N+1, design.md D10)
- [x] 4.4 Refactor and verify: `pnpm --filter @nomadhome/api test && pnpm --filter @nomadhome/shared test && pnpm lint && pnpm typecheck` green; existing `search.test.ts` and `search-ui.test.ts` still pass unchanged

## 5. Search migration

- [ ] 5.1 Red: update `SearchPage.test.tsx` and `ListingCard.test.tsx` for the new card anatomy and filter container behavior
- [ ] 5.2 Restyle `ListingCard.tsx`: photo, type, nightly price (USD), 2-3 amenities in fixed positions; shape-coded availability
- [ ] 5.3 Restyle `SearchFilterPanel.tsx`: side panel on desktop, sheet on mobile, behavior unchanged
- [ ] 5.4 Restyle `SearchPage.tsx` and `SearchResults.tsx` (Operate mode, no map); empty/loading/error states keep existing behavior
- [ ] 5.5 Verify: `pnpm test` green for `apps/web`

## 6. Accessibility and contrast

- [ ] 6.1 Compute and record contrast ratios for every token pairing (black on `#FFC700`, white on `#00704A`, black on white, focus ring) and add an automated test asserting AA thresholds
- [ ] 6.2 Keyboard/focus, `prefers-reduced-motion` and 360 px pass on landing and search; fix findings

## 7. Review and update existing unit tests (MANDATORY)

- [ ] 7.1 Review all existing tests affected by class/markup changes across `packages/ui` and `apps/web`; update stale assertions without weakening them

## 8. Run unit tests and verify database state (MANDATORY - AGENT MUST EXECUTE)

- [ ] 8.1 Run targeted tests for changed modules, then `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
- [ ] 8.2 Database state: before and after the test run, capture `Listing`, `ListingAmenity` and `Amenity` row counts via Prisma/psql; confirm unchanged (search is read-only; restore any test data if not)
- [ ] 8.3 Create report `openspec/changes/refresh-visual-identity/reports/YYYY-MM-DD-step-8-unit-test-and-db-verification.md` with commands, results, and the DB pre/post comparison

## 9. Manual endpoint testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [ ] 9.1 Start the API against the dev database; run `curl -s "http://localhost:<api-port>/api/search?city=<seeded-city>"` (confirm route prefix in `apps/api/src/routes/search.ts`) and verify HTTP 200, the `{ data, pagination }` envelope, and `amenities` (sorted codes) on each item
- [ ] 9.2 curl a listing without amenities (or seed one temporarily) and verify `amenities: []`; curl with an invalid `page=0` and verify HTTP 400 is unchanged
- [ ] 9.3 Restore database state (remove any temporary listing/amenity rows) and re-check row counts match the 8.2 baseline
- [ ] 9.4 Append all curl commands, responses and cleanup actions to `openspec/changes/refresh-visual-identity/reports/YYYY-MM-DD-step-9-curl-verification.md`

## 10. E2E and visual checks (MANDATORY - AGENT MUST EXECUTE)

- [ ] 10.1 Inspect existing Playwright specs (`apps/web/e2e/search.spec.ts` and others touching landing/search); update selectors broken by the redesign, keep behavior assertions intact
- [ ] 10.2 Execute `pnpm test:e2e` (agent runs it; restore test data afterwards)
- [ ] 10.3 Add one desktop and one 360 px screenshot assertion each for landing and search (no baseline exists today; see design.md D6)
- [ ] 10.4 Walk landing and search with Playwright MCP at desktop and 360 px; record outcomes in the report

## 11. Pre-launch follow-ups

- [ ] 11.1 Replace or remove synthetic `StatsSection` and `TestimonialSection` content with real data before public launch (design.md D8); track as a pre-launch ticket
- [ ] 11.2 Create follow-up tickets for host, admin, booking, auth and listing-detail screens

## 12. Docs

- [ ] 12.1 Run Impeccable `document` to generate `DESIGN.md` from the shipped build
- [ ] 12.2 Update documentation referencing old tokens/fonts (README, `openspec/project.md` design notes, `docs/` where relevant) (MANDATORY)

## 13. Final verification

- [ ] 13.1 Run the Impeccable detector over landing and search; fix or document findings
- [ ] 13.2 `node scripts/check-mvp-scope.mjs` and `openspec validate refresh-visual-identity --strict` pass
- [ ] 13.3 Final `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` green
