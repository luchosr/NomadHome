# Tasks: button-link-variants

Change-id: `button-link-variants`. Ticket: NH-138 (#138), follow-up of NH-126 with
scope from NH-124 and NH-122. Branch: `feature/NH-138-button-link` (worktree
`../nomadhome-worktrees/NH-138`). Order follows TDD (red, green, refactor,
verify). `openspec/config.yaml` defines no extra mandatory steps; the mandatory
steps from `docs/openspec-tasks-mandatory-steps.md` apply. Scope is `packages/ui`
and `apps/web` only (no `apps/api`, schema, route, API, API-client or
`packages/shared` change), so the database and curl steps are recorded as not
applicable with a justification and a check that the justification still holds.
Reports live in `openspec/changes/button-link-variants/reports/` (same deliberate
deviation as earlier UI changes). **Copy: no `t()` key or string value changes**
(task 1.9 guards it). The PR description says "Refs #138; closes #138".

Isolation rules for every run:

- **Build `packages/ui` first.** `apps/web` resolves `@nomadhome/ui` and
  `@nomadhome/shared` through `dist/`. Run `pnpm --filter @nomadhome/ui build` and
  `pnpm --filter @nomadhome/shared build` before any web typecheck, unit test or
  e2e run, and again after every `packages/ui` edit.
- Never start or reuse a server on port 5173 or on another worktree's port. Use an
  e2e port at or above 5330 (pick a free one) with `--strictPort`; specs must not
  hard-code 5173 (use relative URLs or the configured `baseURL`).
- Database: only `nomadhome_test`, and only if a step needs one (none expected;
  API calls are mocked). Never touch another database.

## 0. Setup (MANDATORY - FIRST STEP)

- [ ] 0.1 Confirm work is on branch `feature/NH-138-button-link` (worktree `../nomadhome-worktrees/NH-138`) created from `origin/main`
- [ ] 0.2 `pnpm install --frozen-lockfile` inside the worktree (never reuse another worktree's `node_modules`), build `packages/shared` and `packages/ui` (`pnpm --filter @nomadhome/shared build && pnpm --filter @nomadhome/ui build`), then verify a clean baseline: `pnpm lint && pnpm typecheck && pnpm test` green before any change
- [ ] 0.3 Capture the baseline: `rg -n "FLAT_|box-shadow:none|ring-1|CTA_BASE|PRIMARY_CTA|SECONDARY_CTA|TERTIARY_CTA|PRIMARY_LINK" apps packages openspec/specs`, the current `buttonVariants`-less `button.tsx` and `card.tsx`, the `Link`/`Button` nesting in `EmptyState.tsx`, the class assertions in `button.test.tsx`, `card.test.tsx`, `Admin*Page.test.tsx`, the focus assertions in `apps/web/e2e/admin-identity.spec.ts` (~l.665 to 690) and `focus-hover.spec.ts` (~l.47), and the root scripts and CI order (confirm `packages/ui` builds before web checks)
- [ ] 0.4 Confirm which spec files hard-code `localhost:5173` and record them as known and unchanged

## 1. Red tests (unit, Vitest + Testing Library)

- [ ] 1.1 Red, `packages/ui` `button.test.tsx`: for every variant the class list has no `ring` and no `shadow` utility; the secondary has `border-2` and `border-border` (replace the `toHaveClass("border", "bg-transparent")` assertion with the `border-2` form); the disabled secondary keeps `border-dashed` and `border-border-muted`; every class of `buttonVariants({ variant })` is present on `<Button variant>`; `buttonVariants` carries `min-h-11` and `no-underline`; the tertiary keeps `hover:underline`; `buttonVariants()` defaults to primary
- [ ] 1.2 Red, `packages/ui` `card.test.tsx`: `Card` has `border-2` and `border-border` and no `ring-` class; add an entry-point test that `buttonVariants` and `ButtonVariantProps` are exported from `@nomadhome/ui` and that the package gains no `react-router` import or dependency
- [ ] 1.3 Red, `EmptyState.test.tsx`: exactly one `link` with the same name and `href`, no `button`, `container.querySelector("a button")` is null; the dashed 2px panel is unchanged
- [ ] 1.4 Red, migrated screens (`ListingDetailPage`, `HostListingsPage`, `BookingFormPage`, `BookingCancelPage`, `BookingSuccessPage`, `VerifyEmailPage` tests): each CTA is one `link` with the same accessible name and `href`, contains no `button`, and carries the `buttonVariants` classes; `BookingFormPage` back link has the tertiary classes plus `px-2 underline hover:no-underline`; `BookingCancelPage` secondaries have `hover:bg-surface-inset` and no `hover:bg-surface-raised`; width extensions (`w-full sm:w-auto`, `block`) are present
- [ ] 1.5 Red, override removal: a source-level test or assertion per touched component that no class list contains `![box-shadow:none]` (`CancelBookingModal`, `ReviewModal`, `MyBookingsPage`, `AdminUsersPage`, `AdminListingsPage`, `EditListingPage`, `ListingPhotosCard`, `ListingAvailabilityCard`); replace the `toHaveClass("border-2", "![box-shadow:none]")` assertions in `Admin*Page.test.tsx` with the plain secondary variant and a `not.toHaveClass("![box-shadow:none]")` check
- [ ] 1.6 Red, constants gone: a repo audit test or documented command asserting `rg -n "FLAT_|box-shadow:none|ring-1" openspec/specs apps packages` returns no code hit (archived changes excepted) and `FLAT_CARD_CLASS` is no longer exported from `listingFormStyles.ts` while `LABEL_CLASS` stays
- [ ] 1.7 Red, behaviour: routes, hrefs, accessible names, handlers, tab order and `disabled` conditions on real `<button>`s are asserted unchanged on every touched screen (existing tests must keep passing; add the missing ones)
- [ ] 1.8 Red, Link-only consumers: any other `Link` or `<a>` that wraps a `Button` found in 0.3 is listed and covered by a single-anchor assertion
- [ ] 1.9 Red, dictionary-unchanged test: snapshot as literals the `t()` keys read by every migrated screen at baseline and assert they equal `t()` output and that no key was added or removed
- [ ] 1.10 Run the new and extended unit tests after a `packages/ui` build and record that they fail for the right reason (missing export, missing classes, nested button; not a typo)

## 2. Red tests (e2e helper, Playwright, mocked API)

- [ ] 2.1 Red: add a shared e2e helper (for example `apps/web/e2e/helpers/button-link.ts`) that, for a page, asserts zero `a button` and zero `button a` matches, exactly one tab stop per link CTA (Tab until focused, then Tab once more moves away), computed `box-shadow: none` at rest on secondary buttons and cards, and, when focused, a 3px outline plus a 2px `--focus-gap` box shadow
- [ ] 2.2 Red: apply the helper on every migrated screen: empty states (search, my bookings, host upcoming), listing detail, host listings, booking form, booking cancel, booking success, verify email, plus the secondary buttons and cards on my bookings, admin users, admin listings and edit listing; relative URLs or the configured `baseURL` only, mocked API, no hard-coded `5173`
- [ ] 2.3 Red: update `admin-identity.spec.ts` (comment ~l.674 and the outline-only assertion ~l.665 to 690 become the two-layer assertion) and `focus-hover.spec.ts` (~l.47): no assertion is weakened; Cancel page secondary hover resolves to the `surface-inset` colour
- [ ] 2.4 Red: 1440x900 and 360x800 screenshots attached to the report (never pixel-compared); no horizontal overflow on the migrated screens at 360 (`scrollWidth <= innerWidth`)
- [ ] 2.5 Run the new e2e on an isolated port at or above 5330 and record that it fails before implementation

## 3. Implementation (green)

- [x] 3.1 `packages/ui/src/components/button.tsx`: export `buttonVariants` (cva) and `ButtonVariantProps`; add `min-h-11` and `no-underline` to the base; every variant uses `border-2`; secondary becomes `border-border bg-transparent text-fg hover:bg-surface-inset` (drop `border`, `ring-1 ring-inset ring-border`, `disabled:ring-0`); disabled keeps `disabled:border-dashed disabled:border-border-muted`; tertiary keeps `hover:underline underline-offset-4`; `Button` renders `cn(buttonVariants({ variant }), className)`; props and behaviour unchanged
- [x] 3.2 `packages/ui/src/components/card.tsx`: `rounded-card border-2 border-border bg-surface-raised p-5` with no ring; `packages/ui/src/index.ts`: export `buttonVariants` and `ButtonVariantProps`; no new dependency, no `globals.css` change
- [x] 3.3 Build ui: `pnpm --filter @nomadhome/ui build` (and `@nomadhome/shared`), then confirm `apps/web` resolves the new export
- [x] 3.4 `EmptyState.tsx`: a single `<Link className={buttonVariants(...)}>`, no nested `Button`, no `FLAT_SECONDARY`
- [x] 3.5 `ListingDetailPage.tsx`, `HostListingsPage.tsx`, `BookingFormPage.tsx`, `BookingCancelPage.tsx`, `BookingSuccessPage.tsx`, `VerifyEmailPage.tsx`: replace every local CTA constant with `buttonVariants`, widths as `className` extensions; `BookingFormPage` back link is `buttonVariants({ variant: "tertiary" })` plus `px-2 underline hover:no-underline`; `BookingCancelPage` hover unified; no route, href, name or `t()` change
- [x] 3.6 Delete `FLAT_SECONDARY` and its usages from `CancelBookingModal`, `ReviewModal`, `MyBookingsPage`, `AdminUsersPage`, `AdminListingsPage`, `EditListingPage`, `ListingPhotosCard`; delete `FLAT_CARD_CLASS` from `listingFormStyles.ts` and its usages in `EditListingPage`, `ListingPhotosCard`, `ListingAvailabilityCard` (keep `LABEL_CLASS`); drop `min-h-11` extensions that the primitive now makes redundant
- [x] 3.7 Run tasks 1.1 to 1.9 green and re-run the 2.x e2e green on the isolated port

## 4. Review and update existing unit tests (MANDATORY)

- [ ] 4.1 Review every test and e2e spec that renders or navigates to the changed pieces (`rg -n "FLAT_|box-shadow|ring|Button|Link" apps/web/src apps/web/e2e --glob "*.test.*" --glob "*.spec.ts"`) and update stale class or text assumptions without weakening any assertion; do not edit a spec that hard-codes `localhost:5173` and record it as known and unchanged
- [ ] 4.2 Confirm every other consumer of `Button`, `Card` and `Badge` found in 0.3 still renders and passes; confirm `Badge`, `globals.css` and the token tests in `packages/ui` are untouched and green
- [x] 4.3 Verify, ui built first: `pnpm --filter @nomadhome/ui build && pnpm --filter @nomadhome/ui test && pnpm --filter @nomadhome/web test && pnpm lint && pnpm typecheck` green

## 5. Run unit tests and verify database state (MANDATORY - AGENT MUST EXECUTE)

- [x] 5.1 Run targeted tests for the changed files, then `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build` (ui and shared built before web); run the diff-cover check on the changed lines and record totals and coverage
- [x] 5.2 Database state: **not applicable.** Scope is `packages/ui` and `apps/web`. Justification check: `git diff origin/main --stat` shows no path under `apps/api/`, `packages/db/`, `packages/shared/` or `apps/web/src/api/`, and no database is started by any step; if one ever is, it MUST be `nomadhome_test` only. If any such path appears, stop and reopen this task
- [x] 5.3 Write report `openspec/changes/button-link-variants/reports/YYYY-MM-DD-step-5-unit-test-verification.md` with commands, results, coverage and the not-applicable justification

## 6. Manual endpoint testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [x] 6.1 **Not applicable.** No endpoint, request shape, response shape or status code changes. Justification check: `git diff origin/main --stat -- apps/web/src/api apps/api packages/shared packages/db` is empty. Record the check and the result in the step 7 report instead of a curl report

## 7. E2E and visual checks (MANDATORY - AGENT MUST EXECUTE)

- [ ] 7.1 Isolated run setup: build `packages/shared` and `packages/ui` first; pick a free port at or above 5330, start the web dev server only with `pnpm --filter @nomadhome/web exec vite --port <port> --strictPort`, and run Playwright with a throw-away config kept outside the repo (scratchpad) that spreads the repo config, sets `baseURL` to that port, uses an absolute `testDir` and `reuseExistingServer: false`; never use 5173; API calls are mocked so no API runs and any database is `nomadhome_test` only
- [ ] 7.2 Run the shared helper specs, `admin-identity.spec.ts`, `focus-hover.spec.ts` and every per-screen spec for the migrated screens on the isolated port and confirm green, except any failure caused by a pre-existing hard-coded `localhost:5173` URL (record it as pre-existing and unchanged)
- [x] 7.3 Run the whole `pnpm test:e2e` suite on the isolated port (throw-away config) and confirm green; record any failure that is a hard-coded port 5173 URL in an unrelated spec as unchanged by this change
- [ ] 7.4 Visual check at 1440x900 and 360x800: empty state link, listing detail actions, host listings (New listing, Edit), booking form (primary, secondary, back link), booking cancel, booking success, verify email, my bookings, admin users and listings (Re-enable), edit listing (Upload, photos and availability cards); each focused to show the outline plus paper gap; save PNGs to `openspec/changes/button-link-variants/reports/screenshots/`; confirm no overflow, no shadow at rest and the two intentional visual changes only (focus gap on secondary buttons and cards, Cancel page hover)
- [ ] 7.5 Confirm keyboard use through Playwright key presses (one tab stop per link CTA, Enter follows the link, focus ring visible on every button, link and card) and that no console error is logged in any state
- [x] 7.6 Write report `openspec/changes/button-link-variants/reports/YYYY-MM-DD-step-7-e2e-and-visual-verification.md` with the port used, commands, results, screenshot list, the no-backend-change check from 6.1 and any finding

## 8. Documentation (MANDATORY)

- [x] 8.1 Update `apps/web/DESIGN.md`: remove the `FLAT_SECONDARY` and `FLAT_CARD_CLASS` sentences (Link actions ~l.294, Edit cards ~l.301, Moderation actions ~l.311) and the "no gap ring" wording (~l.324); describe link-style actions as `buttonVariants` and the edge as `border-2` for `Button` and `Card`; no token or palette change
- [x] 8.2 Update the surface briefs under `apps/web/.impeccable/surfaces/` and the sidecar `design.json` only where they mention the override or the missing gap ring; run `rg -n "FLAT_|box-shadow:none|ring-1|no gap ring|replaces the gap" apps/web README.md docs openspec/project.md` and fix non-archive hits; do not edit `openspec/changes/archive/` or `openspec/specs/` (the specs update through the archive sync)
- [ ] 8.3 Record in the PR description the follow-ups from design.md Open points: disabled link-style actions, shared `StatePanel` and `StatusTag` extraction, the `Badge` pill, and a `link` variant only if a second caller appears; name the two intentional visual changes

## 9. Memory notes

- [ ] 9.1 Save engram notes (`mem_save`) for the decisions: exported `buttonVariants` instead of `asChild` or a `LinkButton`, `Button` consuming the same cva, secondary edge as `border-2 border-border` with no ring, focus gap restored by deleting overrides, tertiary back link extension, build `packages/ui` before web checks; then `mem_session_summary` before reporting done

## 10. Final verification

- [x] 10.1 `node scripts/check-mvp-scope.mjs` and `openspec validate button-link-variants --strict` pass
- [x] 10.2 Final `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` green (ui and shared built first; e2e on the isolated port; caveat as in 7.2 and 7.3)
- [x] 10.3 `rg -n "FLAT_|box-shadow:none|ring-1" openspec/specs apps packages` returns no code hit (archived changes excepted)
- [x] 10.4 Confirm no unrelated file changed: `git diff origin/main --stat` lists only the files in design.md "Files in scope" and no path under `apps/api/`, `packages/db/`, `packages/shared/` or `apps/web/src/api/`
- [ ] 10.5 PR title states the user story (for example: "Render link-style buttons as a single link and show the full focus ring on every button and card"), the description links the change-id and says "Refs #138; closes #138", attaches the 1440 and 360 screenshots and lists the follow-ups from 8.3; commits are Conventional with the (NH-138) suffix, one per reviewable change, no AI attribution

## 11. Checkpoint D (Gate 3)

- [ ] 11.1 Present Checkpoint D: "Implementation complete on branch `feature/NH-138-button-link`. Quality gates: lint, typecheck, tests (coverage X%), build. PR draft is ready. Open PR for review? (yes / iterate / cancel)" and do not open the PR until the user answers yes
