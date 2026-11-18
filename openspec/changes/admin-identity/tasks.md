# Tasks: admin-identity

Change-id: `admin-identity`. Ticket: NH-123 (#123), follow-up of NH-122. Branch:
`feature/NH-123-admin-identity` (worktree `../nomadhome-worktrees/NH-123`). Order
follows TDD (red, green, refactor, verify). `openspec/config.yaml` defines no
extra mandatory steps; the mandatory steps from
`docs/openspec-tasks-mandatory-steps.md` apply. This change is frontend only (no
backend, schema, route, API, API-client, `packages/shared` or `packages/ui`
change), so the database and curl steps are recorded as not applicable with a
justification and a check that the justification still holds. Reports live in
`openspec/changes/admin-identity/reports/` (same deliberate deviation as earlier
UI changes: a `specs/<change>/` folder without a `spec.md` would break
`openspec validate`). **Copy: no `t()` key or string value changes** (task 1.6
guards it). The existing `admin` capability (`openspec/specs/admin`) is consumed
unchanged. The PR description says "Refs #123; closes #123".

Isolation rules for every run: never start or reuse a server on port 5173 or on
another worktree's port; pick a free port first; no database is started; the new
e2e spec must not hard-code port 5173 (use relative URLs or the configured
`baseURL`).

Duplicate-DOM rule (applies to every task below): jsdom ignores media queries, so
the table and the cards are both in the DOM. Every existing single-match query
(`getByText("Active")`, `getByText("Disabled")`, `getByRole("button", { name:
/disable/i })`, and in e2e the strict `getByText("Disabled")` and `getByRole("button", { name: /re-enable/i })`)
MUST be scoped deliberately: `within(table)` / `within(list)`, `getAllBy` with a
length assert, or Playwright `.filter({ visible: true })`. These edits are
declared tasks (1.1, 1.2, 4.1), and no assertion is weakened.

## 0. Setup (MANDATORY - FIRST STEP)

- [ ] 0.1 Confirm work is on branch `feature/NH-123-admin-identity` (worktree `../nomadhome-worktrees/NH-123`) created from `origin/main`
- [ ] 0.2 `pnpm install` inside the worktree (never reuse another worktree's `node_modules`), then verify a clean baseline: `pnpm lint && pnpm typecheck && pnpm test` green before any change
- [ ] 0.3 Capture the baseline: `rg -n "AdminUsersPage|AdminListingsPage|ListingStatusTag|userStatusTone|listingStatusTone|statusLabel|Badge" apps/web/src apps/web/e2e`, the real routes in `apps/web/src/router.tsx` (`/admin/users` and `/admin/listings` under `RoleGuard role="admin"`) and the current text, role and class queries in `AdminUsersPage.test.tsx`, `AdminListingsPage.test.tsx` and `apps/web/e2e/{us-8.1-admin-users,us-8.2-admin-listings}.spec.ts`; list every other user of `Badge`, `Button` and `ListingStatusTag` and confirm `packages/ui`, `ListingStatusTag.tsx`, `ListingCard.tsx`, `PageWrapper.tsx`, `HostUpcomingPage.tsx` (pattern source), the admin hooks and mutations and `apps/web/src/api/*` are read but not changed; note how the `us-8.x` specs mock data and which of them hard-code `localhost:5173`

## 1. Red tests (unit, Vitest + Testing Library)

- [ ] 1.1 Red: `AdminUsersPage.test.tsx` (extend): exactly one `h1`; no `rounded-pill` and no `Badge`; tag shape per state with the existing `admin.users.*` text as the only text node (active solid ink edge plus an empty `aria-hidden` marker, disabled `line-through` with the muted edge); roles shown as plain muted `roles.join(", ")`; head row `border-b-2` and bold headings; table container `hidden sm:block` and card list `sm:hidden`; each card is `rounded-card border-2` with email (`break-all`), tag, a `dl` with the existing `*_col` labels and the action; Disable and Re-enable are real `button`s, `min-h-11`, Re-enable carries the `FLAT_SECONDARY` classes (`border-2`, `![box-shadow:none]`), cards use full-width actions; mutations still fire with the same arguments and invalidate the same query keys; **scope the existing single-match queries** (`getByText("Active")`, `getByText("Disabled")`, `getByRole("button", { name: /disable/i })`) with `within(table)` / `within(list)` or `getAllBy` plus a length assert, no assertion weakened
- [ ] 1.2 Red: `AdminListingsPage.test.tsx` (extend): same structure as 1.1; `ListingStatusTag` is reused (draft `border-dashed`, published solid with marker, disabled `line-through`), the exact labels "Draft", "Published", "Disabled" are unchanged, no `Badge` and no local `statusLabel`; type and city line from `listingTypeLabel()`; card holds title (`break-words`, `min-w-0` column), tag, type and city, host email (`break-all`) and the action; scope the existing single-match queries as in 1.1
- [ ] 1.3 Red: admin users states: empty shows the existing text in a `border-dashed` `border-2` panel; error renders exactly one `role="alert"` containing one `h1` with `error.generic.unexpected`, a solid danger edge, tint fill and an `aria-hidden` tile, inside `PageWrapper`; loading has `aria-busy="true"`, no `h1`, no `rounded-pill`, `rounded-md` or `shadow`
- [ ] 1.4 Red: admin listings states: same assertions as 1.3
- [ ] 1.5 Red: no `Badge` import: assert the admin pages render no element with the `Badge` classes and that no admin page source imports `Badge` (a unit assertion on the rendered DOM plus the 10.3 search)
- [ ] 1.6 Red: new `apps/web/src/pages/AdminCopy.test.ts`, modelled on `HostCopy.test.ts`: snapshot as literals the values of `admin.users.*`, `admin.listings.*`, `host.listings.status_*` and `error.generic.unexpected` at baseline and assert they equal `t()` output and that every key these screens read exists
- [ ] 1.7 Red: both pages keep their data flow: same hook calls, same row key, same `disabled` while a mutation is pending, same accessible names (no per-row name added)
- [ ] 1.8 Run the new and extended tests and record that they fail for the right reason (missing structure, classes and roles, not a typo)

## 2. Red tests (e2e, Playwright, mocked API)

- [ ] 2.1 Red: add `apps/web/e2e/admin-identity.spec.ts` patterned on `host-identity.spec.ts` and the `us-8.x` specs: relative URLs or the configured `baseURL` only (no hard-coded `5173`, no `localhost:5173` mock URL), the API mocked the way `host-identity.spec.ts` and `us-8.1` do, an admin session, routes taken from `apps/web/src/router.tsx` (`/admin/users`, `/admin/listings`); helpers for no-overflow and screenshot attach; at 1440x900: table head rule 2px ink `rgb(30, 30, 30)`, tag border styles per state and `line-through` on disabled and on the disabled listing tag, Re-enable computed border 2px, action min height 44px, no element with a box shadow or gradient in any state; at 360x800: cards visible with the 2px ink edge, radius at most 4px, status tag and action visible, table hidden
- [ ] 2.2 Red: listing tag `border-style` is dashed for draft and solid for published and disabled; no tag has a 9999px radius; users tag solid for active (with marker) and solid muted for disabled
- [ ] 2.3 Red: error panels (users failure, listings failure) have a danger border `rgb(155, 28, 46)`, solid style, tint background `rgb(248, 225, 224)` and exactly one `role="alert"`; the empty panels are `border-style: dashed`
- [ ] 2.4 Red: 360 px no-overflow (`scrollWidth <= innerWidth`) for users (very long email, many rows), listings (long title and city), and for loading, empty and error on each page
- [ ] 2.5 Red: keyboard: Tab reaches each Disable and Re-enable once and the focused element shows the 3px ink outline
- [ ] 2.6 Run the new e2e spec against an isolated server (see 7.1) and record that it fails before implementation

## 3. Implementation (green)

- [ ] 3.1 `AdminUsersPage.tsx`: local constants `FLAT_SECONDARY` and `StatePanel` (D1), black heavy `h1` (D6), local `AccountStatusTag` (D2), roles plain text (D3), `hidden sm:block` table plus `sm:hidden` cards (D5), 44px Disable and Re-enable with the same handlers and `FLAT_SECONDARY` on Re-enable, flat `aria-busy` skeleton, dashed empty panel, danger `StatePanel` inside `PageWrapper`; remove the `Badge` import and `userStatusTone`; no query, mutation, handler, `disabled` condition or `t()` change
- [ ] 3.2 `AdminListingsPage.tsx`: same as 3.1 with `ListingStatusTag` (D4) in place of the account tag; delete `statusLabel()` and `listingStatusTone`, keep `listingTypeLabel()`; remove the `Badge` import; listing card layout from D5
- [ ] 3.3 Run tasks 1.1 to 1.7 green and re-run the 2.x e2e green against the isolated server

## 4. Review and update existing unit tests (MANDATORY)

- [ ] 4.1 Review and update every test and e2e spec that renders or navigates to the changed pages: `AdminUsersPage.test.tsx`, `AdminListingsPage.test.tsx`, `apps/web/e2e/us-8.1-admin-users.spec.ts` and `us-8.2-admin-listings.spec.ts` (strict `getByText("Disabled")` and `getByRole("button", { name: /re-enable/i })` now match both layouts: scope to the visible match with `.filter({ visible: true })`; this edit is intended and no assertion is weakened), `focus-hover.spec.ts`, `layout.spec.ts` and `rg -n "admin" apps/web/e2e apps/web/src --glob "*.test.*"`; do not edit a spec that hard-codes `localhost:5173` and record it as known and unchanged
- [ ] 4.2 Confirm every other user of `Badge`, `Button` and `ListingStatusTag` (found in 0.3, for example `ListingCard` and the host pages) still passes and renders correctly; confirm nothing shared in `packages/ui` changed and that `Badge` is no longer imported by any admin page
- [ ] 4.3 Verify: `pnpm --filter @nomadhome/web test && pnpm lint && pnpm typecheck` green

## 5. Run unit tests and verify database state (MANDATORY - AGENT MUST EXECUTE)

- [ ] 5.1 Run targeted tests for the changed files, then `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; run the diff-cover check on the changed lines and record totals and coverage
- [ ] 5.2 Database state: **not applicable.** The change is frontend only. Justification check: `git diff origin/main --stat` shows no path under `apps/api/`, `packages/db/`, `packages/shared/` or `packages/ui/`, and no database is started by any step. If any such path appears, stop and reopen this task
- [ ] 5.3 Write report `openspec/changes/admin-identity/reports/YYYY-MM-DD-step-5-unit-test-verification.md` with commands, results, coverage and the not-applicable justification for the database step

## 6. Manual endpoint testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [ ] 6.1 **Not applicable.** No endpoint, request shape, response shape or status code changes; the pages call the same admin users and admin listings endpoints and the same disable and re-enable mutations through the unchanged API client and hooks. Justification check: `git diff origin/main -- packages apps/api apps/web/src/api` is empty. Record the check and the result in the step 7 report instead of a curl report

## 7. E2E and visual checks (MANDATORY - AGENT MUST EXECUTE)

- [ ] 7.1 Isolated run setup: pick a free port (`node -e "require('net').createServer().listen(0,function(){console.log(this.address().port);this.close()})"`), start the web dev server only with `pnpm --filter @nomadhome/web exec vite --port <port> --strictPort`, and run Playwright with a throw-away config kept outside the repo (scratchpad) that spreads the repo config, sets `baseURL` to that port, uses an absolute `testDir` and `reuseExistingServer: false`; never use 5173; run `pnpm install` in this worktree first so the toolchain is local; API calls are mocked so no API or database runs
- [ ] 7.2 Run `apps/web/e2e/admin-identity.spec.ts`, `us-8.1-admin-users.spec.ts`, `us-8.2-admin-listings.spec.ts`, `focus-hover.spec.ts` and `layout.spec.ts` on the isolated port and confirm green, except any failure caused by a pre-existing hard-coded `localhost:5173` URL (record it as pre-existing and unchanged)
- [ ] 7.3 Run the whole `pnpm test:e2e` suite on the isolated port (throw-away config) and confirm green; record any failure that is a hard-coded port 5173 URL in an unrelated or untouched spec as unchanged by this change
- [ ] 7.4 Visual check with Playwright at 1440x900 and 360x800: admin users (active and disabled accounts, long email, several roles), loading, empty and error; admin listings (one row per status, long title and city), loading, empty and error; save PNGs to `openspec/changes/admin-identity/reports/screenshots/`; confirm tag shapes are distinguishable, no ember anywhere, no overflow, and capture a grayscale pass for the status tags and the error panels
- [ ] 7.5 Confirm keyboard use through Playwright key presses (Tab order on each page, Enter on each action, focus ring visible) and that no console error is logged in any state
- [ ] 7.6 Write report `openspec/changes/admin-identity/reports/YYYY-MM-DD-step-7-e2e-and-visual-verification.md` with the port used, commands, results, screenshot list, the no-backend-change check from 6.1 and any finding

## 8. Documentation (MANDATORY)

- [ ] 8.1 Write the surface brief `apps/web/.impeccable/surfaces/src-pages-adminuserspage-tsx.md` (frontmatter `version: 1`, `slug: "src-pages-adminuserspage-tsx"`, `primary_target: "src/pages/AdminUsersPage.tsx"`, `related_targets: ["src/pages/AdminListingsPage.tsx"]`) in the format of `src-pages-hostlistingspage-tsx.md`: scope and mode (Operate), audience, job, action, proof (real account and listing data only, nothing invented), constraints, direction contract, palette note, unresolved decisions (D1 to D13 summarised, plus the follow-ups)
- [ ] 8.2 Update `apps/web/DESIGN.md`: add an "Admin screens" subsection under Components (list layouts, account state tag, reuse of the listing status tag, moderation actions, state panels, no ember), extend the Overview sentence that lists the screens to mention admin, add the Do and Don't lines (account and listing state is a shape plus text; no ember on admin screens), no token or palette change; update the `DESIGN.md` sidecar `design.json` with the admin entry; run `rg -n -i "admin" apps/web/DESIGN.md apps/web/PRODUCT.md` and fix any stale description
- [ ] 8.3 `rg -n -i "admin users|admin listings|moderation" README.md docs apps/web/*.md apps/web/.impeccable openspec/project.md` and update remaining non-archive mentions that contradict the shipped look; do not edit `openspec/changes/archive/` or `openspec/specs/`
- [ ] 8.4 Record in the PR description the follow-ups from design.md Open points: shared `StatePanel` and `StatusTag` extraction, the `Badge` pill in `packages/ui` and the `FLAT_SECONDARY` override (#138), mutation error handling for Disable and Re-enable, per-row accessible names, disabled tag legibility

## 9. Memory notes

- [ ] 9.1 Save engram notes (`mem_save`) for the decisions: local `AccountStatusTag` with a single text node, roles as plain text, reuse of `ListingStatusTag` with `Badge` dropped from admin pages, table plus cards with scoped test queries, local `FLAT_SECONDARY` and `StatePanel`, mutations left without error handling; then `mem_session_summary` before reporting done

## 10. Final verification

- [ ] 10.1 `node scripts/check-mvp-scope.mjs` and `openspec validate admin-identity --strict` pass
- [ ] 10.2 Final `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` green (e2e on the isolated port; caveat as in 7.2 and 7.3)
- [ ] 10.3 `rg -n "rounded-xl|rounded-lg|rounded-md|rounded-full|rounded-pill|shadow-sm|shadow-md|text-red-600|bg-ember|accent-action|Badge|statusLabel|userStatusTone|listingStatusTone" apps/web/src/pages/{AdminUsersPage,AdminListingsPage}.tsx` returns only intended hits (no `Badge` import in either file)
- [ ] 10.4 Confirm no unrelated file changed: `git diff origin/main --stat` lists only the files in design.md "Files in scope" and `git diff origin/main -- packages apps/api apps/web/src/api` is empty
- [ ] 10.5 PR title states the user story (for example: "Let an admin moderate accounts and listings on screens that look like the rest of NomadHome"), the description links the change-id and says "Refs #123; closes #123", attaches the 1440 and 360 screenshots and lists the follow-ups from 8.4; commits are Conventional with the (NH-123) suffix, one per reviewable change, no AI attribution
