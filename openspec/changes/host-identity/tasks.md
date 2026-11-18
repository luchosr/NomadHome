# Tasks: host-identity

Change-id: `host-identity`. Ticket: NH-122 (#122), follow-up of NH-124. Branch:
`feature/NH-122-host-identity` (worktree `../nomadhome-worktrees/NH-122`). Order
follows TDD (red, green, refactor, verify). `openspec/config.yaml` defines no
extra mandatory steps; the mandatory steps from
`docs/openspec-tasks-mandatory-steps.md` apply. This change is frontend only (no
backend, schema, route, API, API-client, `packages/shared` or `packages/ui`
change), so the database and curl steps are recorded as not applicable with a
justification and a check that the justification still holds. Reports live in
`openspec/changes/host-identity/reports/` (same deliberate deviation as earlier UI
changes: a `specs/<change>/` folder without a `spec.md` would break
`openspec validate`). **Copy: no `t()` key or string value changes** (task 1.10
guards it). The PR description says "Refs #122; closes #122".

Isolation rules for every run: never start or reuse a server on port 5173 or on
another worktree's port; pick a free port first; no database is started; the new
e2e spec must not hard-code port 5173 (use relative URLs or the configured
`baseURL`).

## 0. Setup (MANDATORY - FIRST STEP)

- [ ] 0.1 Confirm work is on branch `feature/NH-122-host-identity` (worktree `../nomadhome-worktrees/NH-122`) created from `origin/main`
- [ ] 0.2 `pnpm install` inside the worktree (never reuse another worktree's `node_modules`), then verify a clean baseline: `pnpm lint && pnpm typecheck && pnpm test` green before any change
- [ ] 0.3 Capture the baseline: `rg -n "HostListingsPage|HostUpcomingPage|CreateListingPage|EditListingPage|BecomeHostPage|CreateListingForm|ListingDetailsForm|ListingPhotosCard|ListingAvailabilityCard|AmenityCheckboxGrid|statusTone|statusLabel" apps/web/src apps/web/e2e`, the real routes in `apps/web/src/router.tsx` (`/host/listings`, `/host/listings/new`, `/host/listings/:id/edit`, `/host/upcoming`, `/become-host`) and the current text, role and class queries in the page and component tests and in `apps/web/e2e/{us-1.3-become-host,us-2.1-create-listing,us-2.2-publish-listing,us-2.3-availability,us-7.1-host-dashboard}.spec.ts`; list every other user of `Badge`, `Card`, `EmptyState` and `AmenityCheckboxGrid` and confirm `FormField`, `ServerErrorAlert`, `EmptyState`, `Modal` and `packages/ui` are read but not changed; note how the `us-2.x` specs seed data (through the API) and which of them hard-code `localhost:5173`

## 1. Red tests (unit, Vitest + Testing Library)

- [x] 1.1 Red: `HostListingsPage.test.tsx`: exactly one `h1`; New listing and each Edit are `link`s with the same `href` and accessible name and contain no `button`; rows keep `rounded-card`, carry `border-2` and no `shadow` or `ring`; the no-photo row renders an `aria-hidden` pictogram (bed for a property, desk for a workspace), the photo row the `img` with the title alt; the thumbnail has `border-2` and `rounded-none`; the confirmed-bookings text is intact and `font-bold`
- [x] 1.2 Red: new `ListingStatusTag.test.tsx`: per status the label is a single text node (exactly "Draft", "Published", "Disabled") and the shape class is present (draft `border-dashed`, published solid with an empty `aria-hidden` marker, disabled `line-through` with the muted edge); no `rounded-pill`; `getByText("Published")` and `getByText("Draft")` each match exactly one element on the host listings page and on the edit page
- [x] 1.3 Red: host listings states: empty shows the existing `host.listings.no_listings` text in a `border-dashed` panel with no extra link; error renders exactly one `role="alert"` containing one `h1` with `error.generic.unexpected`, a solid danger edge, tint fill and an `aria-hidden` tile, inside `PageWrapper`; loading has `aria-busy="true"`, no `h1`, no `rounded-pill`, `rounded-md` or `shadow`
- [x] 1.4 Red: `HostUpcomingPage.test.tsx`: one `h1`; head row has `border-b-2` and bold headings; the table sits inside an `overflow-x-auto` wrapper and that wrapper has no `tabindex` (decision recorded in the spec); status tags are shape-coded per status with the existing `booking.dashboard.status_*` text and no `rounded-pill`; amount cell is `tabular-nums`; empty still renders `EmptyState` with the same message and link; error and loading as in 1.3
- [x] 1.5 Red: `CreateListingPage.test.tsx` (and `CreateListingForm` coverage): one `h1`; labels are bold ink; an invalid field keeps `aria-invalid="true"`, shows the error text with the danger left bar, and its control carries `aria-describedby` pointing at the id of that error element (`errorIdFor`, same convention as `LoginPage`); a valid field has no `aria-describedby`; hints render only when the field has no error; submit is `min-h-11` and disabled while invalid and while submitting; the submitted payload is unchanged; a server error renders exactly one `role="alert"` through `ServerErrorAlert`
- [x] 1.6 Red: `EditListingPage.test.tsx` and `ListingDetailsForm` coverage: one `h1`; status row shows `ListingStatusTag` then Publish (primary `button`) or Unpublish (secondary `button`), handlers unchanged; publish, save, upload and block errors each render exactly one `role="alert"` with the same text; not found renders the single-`h1` alert panel; loading is flat with `aria-busy`; `select` and `textarea` have the 2px border class and no `rounded-md`; `ListingDetailsForm` renders `AmenityCheckboxGrid` and no inline amenity markup, Save is `min-h-11` with the same `disabled`; no `aria-describedby` is added on this form
- [x] 1.7 Red: new `AmenityCheckboxGrid.test.tsx`: each amenity is a `getByRole("checkbox")` that toggles by label click and by Space and calls the handler once per interaction with the same value; the input has the square 2px class and `rounded-none`; the check glyph is `aria-hidden`; each label is `min-h-11`; props and amenity list unchanged
- [x] 1.8 Red: `ListingPhotosCard` and `ListingAvailabilityCard` tests: bold `h2`; photos are `aspect-square`, `border-2`, `rounded-none` with the alt text unchanged; Delete stays `variant="destructive"` and `min-h-11`; the hidden file input and its ref are untouched and Upload keeps its `disabled`; `uploadError` renders one `role="alert"` and no `text-red-600`; availability rows are `border-2` and `rounded-none`, date labels bold, Block `min-h-11` with the same `disabled`, `blockError` renders one `role="alert"`
- [x] 1.9 Red: `BecomeHostPage.test.tsx`: one `h1`, no ember class; the terms checkbox keeps `role="checkbox"`, is the square 2px class with an `aria-hidden` glyph and a 44px row; submitting without accepting renders the existing terms error with the danger left bar and no added `role`, and sends no request; server error and submit button unchanged
- [x] 1.10 Red: dictionary-unchanged test: snapshot as literals the values of `host.listings.*`, `host.bookings.*`, `host.photos.*`, `host.availability.*`, `identity.become_host.*`, `booking.dashboard.status_*` and `error.generic.unexpected` at baseline and assert they equal `t()` output and that every key these screens read exists
- [x] 1.11 Run the new and extended tests and record that they fail for the right reason (missing structure, classes and roles, not a typo)

## 2. Red tests (e2e, Playwright, mocked API)

- [ ] 2.1 Red: add `apps/web/e2e/host-identity.spec.ts` patterned on `booking-payment-identity.spec.ts` and the `us-2.x` specs: relative URLs or the configured `baseURL` only (no hard-coded `5173`, no `localhost:5173` mock URL), data seeded or mocked through the API the way `us-2.1`, `us-2.2` and `us-7.1` do, routes taken from `apps/web/src/router.tsx` (`/host/listings`, `/host/listings/new`, `/host/listings/:id/edit`, `/host/upcoming`, `/become-host`); helpers for no-overflow and screenshot attach; at 1440x900 and 360x800: row and thumbnail border 2px `rgb(30, 30, 30)`, thumbnail radius 0, no row box shadow; no element with a box shadow or gradient in any state
- [ ] 2.2 Red: listing tag `border-style` is dashed for draft and solid for published and disabled; disabled has `text-decoration-line: line-through`; no tag has a 9999px radius; strict `getByText("Published")` and `getByText("Draft")` still match one element each on the edit page
- [ ] 2.3 Red: host bookings: table head rule 2px ink; booking tag shapes per status; the table scrolls inside its own wrapper at 360 and the document does not
- [ ] 2.4 Red: forms: checkbox 2px ink edge and a label box of at least 44px; invalid field border `rgb(155, 28, 46)` with the error text left bar; Create submit at least 44px; photo frames 2px with radius 0; availability rows 2px
- [ ] 2.5 Red: error panels (listings failure, bookings failure, edit not found) have a danger border `rgb(155, 28, 46)`, solid style, tint background `rgb(248, 225, 224)` and exactly one `role="alert"`; the empty listings panel is `border-style: dashed`
- [ ] 2.6 Red: 360 px no-overflow (`scrollWidth <= innerWidth`) for host listings (long title and city, many rows), loading, empty, error, host bookings (long guest email), create, edit (long title, photos, blocks), edit not found and become host; the header New listing is full width and inside the viewport
- [ ] 2.7 Red: keyboard: Tab reaches New listing, each Edit and the submit buttons once each and the focused element shows the 3px ink outline; the global ring also shows on a select, a textarea and a checkbox
- [ ] 2.8 Run the new e2e spec against an isolated server (see 7.1) and record that it fails before implementation

## 3. Implementation (green)

- [ ] 3.1 Add `components/ListingStatusTag.tsx` (owns `statusLabel`, shape per status, label as the only text node, empty `aria-hidden` marker) and `components/listingFormStyles.ts` (`LABEL_CLASS`, `CONTROL_CLASS`, `HINT_CLASS`, `ERROR_BAR_CLASS`, `CHECKBOX_CLASS`); remove both `statusTone()` functions and the duplicated `statusLabel()`
- [ ] 3.2 `HostListingsPage.tsx`: local CTA constants (D1), black `h1`, single-link New listing and Edit, flat rows, framed thumbnail with the bed or desk pictogram tile, `ListingStatusTag`, flat `aria-busy` skeleton, dashed empty panel, local danger `StatePanel` inside `PageWrapper`; no query, handler or `t()` change
- [ ] 3.3 `HostUpcomingPage.tsx`: black `h1`, flat table in the `overflow-x-auto` wrapper (non-focusable, no new copy), local booking `StatusTag`, flat skeleton, danger `StatePanel`; `EmptyState` props unchanged; `formatDate` and `formatAmount` untouched
- [ ] 3.4 `AmenityCheckboxGrid.tsx`: native checkbox with `CHECKBOX_CLASS`, `aria-hidden` check glyph, 44px label; props unchanged
- [ ] 3.5 `CreateListingForm.tsx` and `CreateListingPage.tsx`: `FormField` per field with the shared classes, `HINT_CLASS` hint only when valid, `aria-describedby={errors.x ? errorIdFor(id) : undefined}` on controls that show a `FormField` error (login and register convention; hints and `GroupedSelect` internals untouched), `ServerErrorAlert`, 44px submit; registration, `noValidate`, `valueAsNumber`, `isValid` gate and payload unchanged
- [ ] 3.6 `ListingDetailsForm.tsx`, `ListingPhotosCard.tsx`, `ListingAvailabilityCard.tsx`, `EditListingPage.tsx`: shared field classes, `AmenityCheckboxGrid`, bold `h2` cards, square framed photos, flat availability rows, `ListingStatusTag`, Publish or Unpublish real buttons with `FLAT_SECONDARY` on secondary ones, every error through `ServerErrorAlert` (the `text-red-600` paragraph removed), flat skeleton, not-found panel; the hidden file input and its ref untouched; no handler, condition or `t()` change
- [ ] 3.7 `BecomeHostPage.tsx`: black `h1`, left-aligned header, square 44px terms checkbox with the check glyph, terms error with `ERROR_BAR_CLASS` and no added role; fields, `ServerErrorAlert` and submit unchanged
- [ ] 3.8 Run tasks 1.1 to 1.10 green and re-run the 2.x e2e green against the isolated server

## 4. Review and update existing unit tests (MANDATORY)

- [ ] 4.1 Review every test and e2e spec that renders or navigates to the changed pieces: the page and component tests, `apps/web/e2e/us-1.3-become-host.spec.ts` (redirect), `us-2.1-create-listing.spec.ts` (create flow and redirect to the edit page), `us-2.2-publish-listing.spec.ts` (strict `getByText("Draft")` and `getByText("Published")` must each match exactly one element), `us-2.3-availability.spec.ts`, `us-7.1-host-dashboard.spec.ts`, `focus-hover.spec.ts` and `layout.spec.ts`, and `rg -n "host|listing" apps/web/e2e apps/web/src --glob "*.test.*"`; do not edit a spec that hard-codes `localhost:5173` and record it as known and unchanged; update stale class or text assumptions without weakening any assertion
- [ ] 4.2 Confirm every other user of `Badge`, `Card`, `EmptyState` and `AmenityCheckboxGrid` (found in 0.3, for example `AdminListingsPage` and `HostUpcomingPage`) still passes and renders correctly; confirm nothing shared in `packages/ui` changed
- [ ] 4.3 Verify: `pnpm --filter @nomadhome/web test && pnpm lint && pnpm typecheck` green

## 5. Run unit tests and verify database state (MANDATORY - AGENT MUST EXECUTE)

- [ ] 5.1 Run targeted tests for the changed files, then `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; run the diff-cover check on the changed lines and record totals and coverage
- [ ] 5.2 Database state: **not applicable.** The change is frontend only. Justification check: `git diff origin/main --stat` shows no path under `apps/api/`, `packages/db/`, `packages/shared/` or `packages/ui/`, and no database is started by any step. If any such path appears, stop and reopen this task
- [ ] 5.3 Write report `openspec/changes/host-identity/reports/YYYY-MM-DD-step-5-unit-test-verification.md` with commands, results, coverage and the not-applicable justification for the database step

## 6. Manual endpoint testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [ ] 6.1 **Not applicable.** No endpoint, request shape, response shape or status code changes; the pages call the same listing, photo, availability, host bookings and become-host endpoints through the unchanged API client and hooks. Justification check: `git diff origin/main --stat -- apps/web/src/api apps/api packages/shared packages/db packages/ui` is empty. Record the check and the result in the step 7 report instead of a curl report

## 7. E2E and visual checks (MANDATORY - AGENT MUST EXECUTE)

- [ ] 7.1 Isolated run setup: pick a free port (`node -e "require('net').createServer().listen(0,function(){console.log(this.address().port);this.close()})"`), start the web dev server only with `pnpm --filter @nomadhome/web exec vite --port <port> --strictPort`, and run Playwright with a throw-away config kept outside the repo (scratchpad) that spreads the repo config, sets `baseURL` to that port, uses an absolute `testDir` and `reuseExistingServer: false`; never use 5173; run `pnpm install` in this worktree first so the toolchain is local; API calls are mocked so no API or database runs
- [ ] 7.2 Run `apps/web/e2e/host-identity.spec.ts`, `us-1.3-become-host.spec.ts`, `us-2.1-create-listing.spec.ts`, `us-2.2-publish-listing.spec.ts`, `us-2.3-availability.spec.ts`, `us-7.1-host-dashboard.spec.ts`, `focus-hover.spec.ts` and `layout.spec.ts` on the isolated port and confirm green, except any failure caused by a pre-existing hard-coded `localhost:5173` URL (record it as pre-existing and unchanged)
- [ ] 7.3 Run the whole `pnpm test:e2e` suite on the isolated port (throw-away config) and confirm green; record any failure that is a hard-coded port 5173 URL in an unrelated or untouched spec as unchanged by this change
- [ ] 7.4 Visual check with Playwright at 1440x900 and 360x800: host listings (one row per status, with and without photo, property and workspace, long title and city), host listings loading, empty and error, host bookings (one row per status, long guest email), its loading, empty and error, create (empty, invalid fields with hints and errors, server error), edit (draft and published, photos, blocks, each error, loading, not found), become host (terms error); save PNGs to `openspec/changes/host-identity/reports/screenshots/`; confirm tag shapes are distinguishable, no ember anywhere, no overflow, and capture a grayscale pass for the status tags, the error panels and the invalid fields
- [ ] 7.5 Confirm keyboard use through Playwright key presses (Tab order on each page, Enter on each link action, Space on amenity and terms checkboxes, focus ring visible on selects, textareas and checkboxes) and that no console error is logged in any state
- [ ] 7.6 Write report `openspec/changes/host-identity/reports/YYYY-MM-DD-step-7-e2e-and-visual-verification.md` with the port used, commands, results, screenshot list, the no-backend-change check from 6.1 and any finding

## 8. Documentation (MANDATORY)

- [ ] 8.1 Write the surface brief `apps/web/.impeccable/surfaces/src-pages-hostlistingspage-tsx.md` (frontmatter `version: 1`, `slug: "src-pages-hostlistingspage-tsx"`, `primary_target: "src/pages/HostListingsPage.tsx"`, `related_targets` listing HostUpcomingPage, CreateListingPage, EditListingPage, BecomeHostPage and the listing form components) in the format of `src-pages-bookingformpage-tsx.md`: scope and mode (Operate), audience, job, action, proof (real listing and booking data only, nothing invented), constraints, direction contract, palette note, unresolved decisions (D1 to D17 summarised, plus the follow-ups)
- [ ] 8.2 Update `apps/web/DESIGN.md`: add a "Host dashboard and listing forms" subsection under Components (listing rows, thumbnail and pictogram tile, listing status tag, host bookings table, field grammar, amenity checkbox, edit cards, state panels), extend the Overview sentence that lists the screens, add the Do and Don't lines (listing status is a shape plus text; no ember on host screens; no `text-red-600`), no token or palette change; run `rg -n -i "host|listing form|amenity" apps/web/DESIGN.md apps/web/PRODUCT.md` and fix any stale description
- [ ] 8.3 `rg -n -i "host dashboard|host listings|my listings|create listing|become host" README.md docs apps/web/*.md apps/web/.impeccable openspec/project.md` and update remaining non-archive mentions that contradict the shipped look; do not edit `openspec/changes/archive/` or `openspec/specs/`
- [ ] 8.4 Record in the PR description the follow-ups from design.md Open points: shared `StatePanel`, shared booking `StatusTag`, the `Badge` pill in `packages/ui` (#123), `Link > Button` in `EmptyState` and the `FLAT_SECONDARY` override (#138), listing photos (#121), the hard-coded `Photo N` alt, the focusable labelled scroll region for the bookings table, and `aria-describedby` for hints

## 9. Memory notes

- [ ] 9.1 Save engram notes (`mem_save`) for the decisions: shape-coded `ListingStatusTag` with single text node, shared `listingFormStyles` constants, single-link CTAs with local constants, thumbnail pictogram tile, `aria-describedby` only on Create field errors, non-focusable bookings table wrapper, `ServerErrorAlert` for every form error; then `mem_session_summary` before reporting done

## 10. Final verification

- [ ] 10.1 `node scripts/check-mvp-scope.mjs` and `openspec validate host-identity --strict` pass
- [ ] 10.2 Final `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` green (e2e on the isolated port; caveat as in 7.2 and 7.3)
- [ ] 10.3 `rg -n "rounded-xl|rounded-lg|rounded-md|rounded-full|rounded-pill|shadow-sm|shadow-md|text-red-600|bg-ember|statusTone|accent-action" apps/web/src/pages/{HostListingsPage,HostUpcomingPage,CreateListingPage,EditListingPage,BecomeHostPage}.tsx apps/web/src/components/{CreateListingForm,ListingDetailsForm,ListingPhotosCard,ListingAvailabilityCard,AmenityCheckboxGrid,ListingStatusTag}.tsx` returns only intended hits
- [ ] 10.4 Confirm no unrelated file changed: `git diff origin/main --stat` lists only the files in design.md "Files in scope" and no path under `apps/api/`, `packages/db/`, `packages/shared/`, `packages/ui/` or `apps/web/src/api/`
- [ ] 10.5 PR title states the user story (for example: "Let a host manage listings, bookings and listing forms on screens that look like the rest of NomadHome"), the description links the change-id and says "Refs #122; closes #122", attaches the 1440 and 360 screenshots and lists the follow-ups from 8.4; commits are Conventional with the (NH-122) suffix, one per reviewable change, no AI attribution
