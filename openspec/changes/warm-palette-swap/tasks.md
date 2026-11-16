# Tasks: warm-palette-swap

Change-id: `warm-palette-swap`. Ticket: NH-129. Branch: `feature/NH-129-warm-palette`.
Order follows TDD (red, green, refactor, verify). Each task fits one sub-agent invocation.
`openspec/config.yaml` defines no extra mandatory steps; the mandatory steps from
`docs/openspec-tasks-mandatory-steps.md` apply. This change touches no backend,
API, schema or data (design.md D14), so the database-state and curl endpoint
steps are explicitly N/A (sections 8 and 9) and no database is touched. Reports
live in `openspec/changes/warm-palette-swap/reports/` (same deliberate deviation
as NH-118: a `specs/<change>/` folder without `spec.md` would break validation).

## 0. Setup (MANDATORY - FIRST STEP)

- [x] 0.1 Confirm work is on branch `feature/NH-129-warm-palette` (worktree `../nomadhome-worktrees/NH-129`) created from `origin/main`
- [x] 0.2 Verify clean baseline: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test` green before changes
- [x] 0.3 Confirm the NH-118 archive is on `origin/main` or note the dependency (design.md D12)

## 1. Red tests: tokens and contrast

- [x] 1.1 Red: rewrite `packages/ui/src/tokens.test.ts` for the new palette (`ember` `#E65F35`, `sage`, `paper`, `stone`, `ink` exact hex) and add a source scan that fails on `signal`, `sign-green`, `surface-green`, `-black`, `-white` colour utilities and stray hex literals outside the preset and the CSS variable block in `apps/web/src` and `packages/ui/src`
- [x] 1.2 Red: rewrite `packages/ui/src/contrast.test.ts` with the approved-pairing table and the disallowed-pairing assertions from design.md D2 (paper on ember 3.19, ember on paper, ember on stone, ember on sage, fg-muted/fg-subtle on ember, danger on ember, sage on paper/stone all asserted below 4.5), role-token pairings, and the focus table from D7 (all five fields, outline and gap layers)

## 2. Token swap

- [x] 2.1 Replace palette, `surface`, `fg`, `border`, `action` and role values in `packages/config/tailwind.preset.js` per design.md D2/D3/D6; update the elevation shadows to `#1E1E1E`
- [x] 2.2 Update `packages/ui/src/styles/globals.css`: CSS variables (`--ember`, `--sage`, `--paper`, `--stone`, `--ink`, neutrals), paper canvas, `::selection` (ink on ember), focus variables (ink/paper default) and the ink-field override (paper outline, ink gap) per design.md D7; keep `@tailwind` directives
- [x] 2.3 Verify the red tests from 1.1 and 1.2 now fail only on leftover usages (expected list of files from design.md D5/D10)

## 3. Primitives, logos, favicon, stray colours

- [x] 3.1 Re-point `Button`, `Badge` (accent to ember with ink text), `Input`, `Card`, `Skeleton`, `Pictogram`, `Arrow` in `packages/ui/src/components/` (no prop or behavior change); update their tests that assert colour classes
- [x] 3.2 Re-colour `packages/ui/src/assets/{favicon,logo-mark,logo-wordmark,logo-wordmark-light}.svg`, `apps/web/public/favicon.svg` (keep it in sync with the UI asset) and the inline SVG in `apps/web/src/components/Logo.tsx` per design.md D10 (ember square, ink arch and base, ink wordmark, paper in the light variant; paths unchanged)
- [x] 3.3 Replace the hard-coded `--rdp-*` accent colours in `apps/web/src/components/DateRangePicker.tsx` with the ember and stone values and make the selected-day text ink (paper on ember is 3.19); re-point `Modal.tsx` (`bg-ink/40`) and `ErrorPage.tsx` (`text-fg-inverse`)
- [x] 3.4 Update `Layout.tsx` (nav, `signalButton` renamed), `HomeFooter.tsx` and every other `apps/web/src` site listed in design.md D5, applying the panel text rules (ink on ember and sage, paper on ink, ember text on ink only at 18 px bold or larger); no fg-muted/fg-subtle on orange or sage; controls on orange keep a paper fill with ink text and an ink edge
- [x] 3.5 Fix the hero city input: paper-filled field or `placeholder:text-fg` (ink on ember 4.81), never `placeholder:text-fg-subtle` on orange (2.20); verify with a computed-style check that placeholder and typed text reach 4.5:1
- [x] 3.6 Re-point hover states: departure-board and destination-index rows fill ember with ink text (price text switches ember to ink); listing-card hover fill stone (open question Q2)

## 4. Landing and search verification

- [x] 4.1 Update `apps/web` landing and search unit tests whose assertions name old colour classes; keep behavior assertions intact
- [x] 4.2 Verify landing at 360 px and desktop: every former yellow panel (now orange) shows ink text, every former green panel (now sage) shows ink text, and the hero placeholder is legible, no clipped text, no horizontal scroll; capture screenshots
- [x] 4.3 Verify search at 360 px and desktop (query band, filter panel and sheet, cards, hover and focus states, empty/loading/error states); capture screenshots
- [x] 4.4 Keyboard-focus pass on an orange field, a sage field, an ink field and a paper field; confirm the ring is visible on each

## 5. Contrast test update (green)

- [x] 5.1 Run `pnpm --filter @nomadhome/ui test`; fix tokens, not thresholds, until the tests from 1.1 and 1.2 pass
- [x] 5.2 Update `apps/web/e2e/layout.spec.ts`: `SIGNAL_RGB` to `rgb(230, 95, 53)` (renamed), `section.bg-signal` locator to `section.bg-ember`, test titles to "orange"; keep layout and overlap assertions unchanged

## 6. Review and update existing unit tests (MANDATORY)

- [x] 6.1 Review all existing tests affected by the token renames across `packages/ui` and `apps/web`; update stale assertions without weakening them

## 7. Docs (MANDATORY)

- [x] 7.1 Regenerate `apps/web/DESIGN.md` with Impeccable `document` from the shipped build (new palette names, contrast rules, "Four Materials" and "Ink-On-Field" rules rewritten for the warm palette, including that orange is never text on light surfaces)
- [x] 7.2 Update `apps/web/.impeccable/surfaces/src-pages-homepage-tsx.md` and any hit from `rg -i "FFC700|signal yellow|sign green|00704A" README.md docs openspec/project.md apps/web` (excluding archived changes)

## 8. Run unit tests and verify database state (MANDATORY - AGENT MUST EXECUTE)

- [ ] 8.1 Run targeted tests (`pnpm --filter @nomadhome/ui test`, `pnpm --filter @nomadhome/web test`), then `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
- [ ] 8.2 Database state: N/A. No backend, API, Prisma schema or data change; the web and UI packages do not touch a database. State this in the report; do not connect to any database
- [ ] 8.3 Create report `openspec/changes/warm-palette-swap/reports/YYYY-MM-DD-step-8-unit-test-verification.md` with commands, results and the DB N/A justification

## 9. Manual endpoint testing with curl (MANDATORY - N/A)

- [ ] 9.1 N/A. No endpoint is added or changed; `apps/api` and `packages/shared` are untouched. Record the justification in the step-8 report and run `git diff --stat origin/main -- apps/api packages/db packages/shared` to prove the paths are unchanged

## 10. E2E and visual checks (MANDATORY - AGENT MUST EXECUTE)

- [ ] 10.1 Inspect existing Playwright specs touching landing and search; update only colour-dependent selectors and assertions
- [ ] 10.2 Execute `pnpm test:e2e` (agent runs it)
- [ ] 10.3 Walk landing and search with Playwright MCP at desktop and 360 px; store screenshots and outcomes in `reports/YYYY-MM-DD-step-10-e2e-and-visual-verification.md`

## 11. Final verification

- [x] 11.1 `rg -i "#FFC700|#00704A|#0A0A0A|signal|sign-green" apps/web/src packages/ui/src packages/config apps/web/public apps/web/e2e` returns nothing outside design notes
- [ ] 11.2 `node scripts/check-mvp-scope.mjs` and `openspec validate warm-palette-swap --strict` pass
- [ ] 11.3 Final `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` green
- [x] 11.4 Resolve or record answers to open questions Q2-Q6 (Q1 is settled) in `design.md` before Gate 3
