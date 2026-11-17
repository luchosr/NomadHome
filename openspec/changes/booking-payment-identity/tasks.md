# Tasks: booking-payment-identity

Change-id: `booking-payment-identity`. Ticket: NH-124 (#124), follow-up of
NH-126. Branch: `feature/NH-124-booking-payment-identity` (worktree
`../nomadhome-worktrees/NH-124`). Order follows TDD (red, green, refactor,
verify). `openspec/config.yaml` defines no extra mandatory steps; the mandatory
steps from `docs/openspec-tasks-mandatory-steps.md` apply. This change is
frontend only (no backend, schema, route, API, API-client, `packages/shared` or
`packages/ui` change), so the database and curl steps are recorded as not
applicable with a justification and a check that the justification still holds.
Reports live in `openspec/changes/booking-payment-identity/reports/` (same
deliberate deviation as earlier UI changes: a `specs/<change>/` folder without a
`spec.md` would break `openspec validate`). **Copy: no `t()` key or string value
changes** (task 1.12 guards it). The PR description says "Refs #124; closes #124".

Isolation rules for every run: never start or reuse a server on port 5173 or on
another worktree's port; pick a free port first; no database is started.

## 0. Setup (MANDATORY - FIRST STEP)

- [x] 0.1 Confirm work is on branch `feature/NH-124-booking-payment-identity` (worktree `../nomadhome-worktrees/NH-124`) created from `origin/main`
- [x] 0.2 `pnpm install` inside the worktree, then verify a clean baseline: `pnpm lint && pnpm typecheck && pnpm test` green before any change
- [x] 0.3 Capture the baseline: `rg -n "BookingFormPage|BookingSuccessPage|BookingCancelPage|MyBookingsPage|CancelBookingModal|ReviewModal|EmptyState|Modal\b" apps/web/src apps/web/e2e` and the current text, role and class queries in the six page and modal tests and in `apps/web/e2e/{us-4.1-booking,us-4.2-cancel-booking,us-6.1-review}.spec.ts`; list every other user of `Modal` and `EmptyState` (the shared pieces being restyled) and confirm `Badge`, `Card`, `FormField` and `ServerErrorAlert` are read but not changed

## 1. Red tests (unit, Vitest + Testing Library)

- [x] 1.1 Red: `BookingFormPage.test.tsx`: exactly one `h1` (`booking.ui.form_title`); the summary panel has the 2px border class, `rounded-card` and no `shadow`; the photo has the 2px border class and no radius class; dates render as the raw strings `2026-08-01` and `2026-08-04` and `/service fee/` is present; `getByText(/^total$/i).closest("div")` contains the total amount
- [x] 1.2 Red: total band: carries `bg-ember` and `text-fg` and contains no `text-fg-muted`, `text-fg-subtle`, `text-fg-inverse` or `text-danger` class; label and amount are sibling nodes in one row
- [x] 1.3 Red: interactive elements: Pay now is a `button` that is not a descendant of an `a`, keeps its disabled conditions (submitting, quote loading, no quote) and still creates the booking, requests checkout and sets `window.location.href`; the back action is a `link` to `/listings/<id>` with no `button` inside
- [x] 1.4 Red: states: no dates renders one `h1` with `booking.ui.select_dates`, a paper panel, no `role="alert"` and one back link with no `button`; loading has `aria-busy="true"`, no `h1` and no `rounded-xl`, `rounded-pill` or `shadow`; listing 404 and quote error each render exactly one `role="alert"` containing one `h1` with the existing string, a solid danger edge, tint fill and an `aria-hidden` tile; server error renders through the shared alert (one `role="alert"`, same text, tile)
- [x] 1.5 Red: `BookingSuccessPage.test.tsx`: confirmed state has one `h1`, ember panel classes, an `aria-hidden` ink tile, text classes `text-fg` only inside the panel (no muted or subtle), `#<bookingId>` as one text node, and the view-bookings action as a `link` to `/bookings` with no `button` inside; the no-`bookingId` path renders the same panel and copy; the timed-out path renders the same panel (fake timers)
- [x] 1.6 Red: waiting state: `role="status"`, `aria-busy="true"`, the dashed 2px class and stone fill, the existing processing text, flat skeleton bars; the polling, sync and timeout assertions already in the file stay and pass
- [x] 1.7 Red: `BookingCancelPage.test.tsx`: one `h1`, paper panel classes, an `aria-hidden` outlined tile, no ember or danger class; with `listingId` one link to `/listings/<id>` named with the existing text and no `button` inside; without it one link to `/search` with the existing text
- [x] 1.8 Red: `MyBookingsPage.test.tsx`: each card keeps the `rounded-card` class and has the 2px border class and no `shadow`; a status tag per status has its shape class (pending dashed, confirmed solid ink, cancelled `line-through` with the muted solid edge, completed solid with an `aria-hidden` marker), the exact label text and no `rounded-pill`; a cancellable booking exposes exactly one `getByRole("button", { name: /cancel/ })`; complete payment and review buttons keep role, name and handlers
- [x] 1.9 Red: my bookings states: loading keeps `aria-busy="true"` and has no `rounded-pill` or `rounded-md` block; error renders exactly one `role="alert"` with the existing generic text, a solid danger edge, tint fill and an `aria-hidden` filled tile; empty still renders `EmptyState` with the same message and link
- [x] 1.10 Red: `CancelBookingModal.test.tsx` and `ReviewModal.test.tsx`: the dialog surface has the 2px border class and no `shadow`; textarea has the 2px border class and the label is bold; a failed submit renders exactly one `role="alert"` with the same text and a tile; review star buttons are still named "1 star" to "5 stars" with `aria-pressed`, each contains one `svg[aria-hidden]` and the document contains no `★` or `☆`; selecting "4 stars" fills four glyphs and leaves the fifth an outline; review success renders the existing text in a flat 2px panel and `onSuccess` still runs after 1200 ms (fake timers); add `Modal.test.tsx` (role `dialog`, `aria-modal`, `aria-labelledby`, frame classes) and `EmptyState.test.tsx` (dashed 2px class, no `rounded-xl`, message and link intact)
- [x] 1.11 Red: no-behaviour tests: `Modal` has no key handler (pressing Escape does not call anything) and no backdrop click handler, asserted so the follow-up is visible; the `/cancel/` single-match constraint is asserted in 1.8
- [x] 1.12 Red: dictionary-unchanged test: snapshot as literals the values of `booking.ui.*`, `booking.dashboard.*`, `listings.error.not_found`, `error.generic.unexpected`, `common.loading`, `common.submitting` and `common.action.close` at baseline and assert they equal `t()` output and that every key these screens read exists
- [x] 1.13 Run the new and extended tests and record that they fail for the right reason (missing structure, classes and roles, not a typo)

## 2. Red tests (e2e, Playwright, mocked API)

- [ ] 2.1 Red: add `apps/web/e2e/booking-payment-identity.spec.ts` patterned on `listing-detail-identity.spec.ts` and `layout.spec.ts` (mock `http://localhost:3000/...` endpoints for listing, quote, bookings, booking by id and sync; helpers for no-overflow, inside-viewport and screenshot attach) at 1440x900 and 360x800: summary panel 2px ink border and `box-shadow: none`; photo border 2px and radius 0; no element with a box shadow or gradient in any state
- [ ] 2.2 Red: total band background `rgb(230, 95, 53)` and the computed colour of every text node inside it equals ink `rgb(30, 30, 30)`; no input or button is a descendant of the band; Pay now is outside the band
- [ ] 2.3 Red: success panel background ember with every text node ink; waiting panel `border-style: dashed` and stone background `rgb(229, 226, 221)`; cancel panel paper background and no ember descendant
- [ ] 2.4 Red: my bookings: cards keep `.rounded-card` with a 2px border; status tag `border-style` is dashed for pending, solid otherwise; cancelled text has `text-decoration-line: line-through`; no tag has a 9999px radius
- [ ] 2.5 Red: error panels (404, quote error, bookings failure) have a danger border `rgb(155, 28, 46)`, solid style and tint background `rgb(248, 225, 224)` and exactly one `role="alert"`; the cancel and review dialogs have a 2px border and no shadow; stars are `svg` with the names "N stars"
- [ ] 2.6 Red: 360 px no-overflow for the form (long title, city and currency amount), no-dates, loading, 404, success, waiting, cancel, my bookings (long title, ten cards), empty, error, and with each dialog open; document `scrollWidth <= innerWidth` and the primary actions inside the viewport
- [ ] 2.7 Red: keyboard: Tab reaches Pay now and then the back link (one stop each); the success and cancel link actions are one stop; the focused element shows the 3px ink outline
- [ ] 2.8 Run the new e2e spec against an isolated server (see 7.1) and record that it fails before implementation

## 3. Implementation (green)

- [ ] 3.1 `BookingFormPage.tsx`: add the local link constants (D1), the summary panel with the framed photo and the ember total band (D2, ink text only, same label and amount row), `ServerErrorAlert` for the server error, single-link back and no-dates actions, and local state panels with authored tile glyphs on the 24 grid; Pay now stays a `<Button>`; no query, handler, condition, redirect or `t()` change
- [ ] 3.2 `BookingSuccessPage.tsx`: ember success panel with ink tile and ink text, paper foot with the single link CTA, dashed stone waiting panel with `role="status"` and `aria-busy`, flat skeleton; do not split the timed-out path from success; polling, sync, timeouts and state logic untouched
- [ ] 3.3 `BookingCancelPage.tsx`: neutral paper sign panel with an outlined tile and single-link CTAs; keep roles, names and hrefs
- [ ] 3.4 `MyBookingsPage.tsx`: flat 2px cards that keep `rounded-card`, a local `StatusTag` (shape per status plus the unchanged label text) replacing `Badge` and `statusTone`, flat skeleton, danger sign panel for the error; action buttons, conditions and handlers unchanged
- [ ] 3.5 `Modal.tsx`: remove the shadow, add the 2px ink edge and a flat backdrop; add no handler, prop or behaviour
- [ ] 3.6 `CancelBookingModal.tsx` and `ReviewModal.tsx`: 2px textarea, bold label, `ServerErrorAlert` for the error, local drawn `StarGlyph` (filled versus outline, `aria-hidden`, 44px buttons, aria-labels unchanged), two-layer focus ring, flat success panel; keep the `setTimeout` behaviour and all payloads
- [ ] 3.7 `EmptyState.tsx`: flat 2px dashed panel with an authored 24-grid glyph; keep the nested `Link > Button` (issue #138) and the props
- [ ] 3.8 Run tasks 1.1 to 1.12 green and re-run the 2.x e2e green against the isolated server

## 4. Review and update existing unit tests (MANDATORY)

- [ ] 4.1 Review every test and e2e spec that renders or navigates to the changed pieces: the six page and modal tests, `apps/web/e2e/us-4.1-booking.spec.ts` (raw `2026-08-01` and `2026-08-04`, `/service fee/`, no-dates copy, checkout redirect; its mocked URL hard-codes `localhost:5173` and fails off 5173, so do not edit it and record it as known and unchanged), `us-4.2-cancel-booking.spec.ts` and `us-6.1-review.spec.ts` (`.rounded-card` locator and the text "Cancelled"), `focus-hover.spec.ts` and `layout.spec.ts`, and `rg -n "bookings|booking" apps/web/e2e apps/web/src --glob "*.test.*"`; update stale class or text assumptions without weakening any assertion; confirm text queries still resolve to one node
- [ ] 4.2 Confirm every other user of `Modal` and `EmptyState` (found in 0.3, for example `HostListingsPage`) still passes and still renders correctly; confirm the other `Badge` and `Card` users are untouched (nothing shared in `packages/ui` changed)
- [ ] 4.3 Verify: `pnpm --filter @nomadhome/web test && pnpm lint && pnpm typecheck` green

## 5. Run unit tests and verify database state (MANDATORY - AGENT MUST EXECUTE)

- [ ] 5.1 Run targeted tests for the changed files, then `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; record totals
- [ ] 5.2 Database state: **not applicable.** The change is frontend only. Justification check: `git diff origin/main --stat` shows no path under `apps/api/`, `packages/db/`, `packages/shared/` or `packages/ui/`, and no database is started by any step. If any such path appears, stop and reopen this task
- [ ] 5.3 Write report `openspec/changes/booking-payment-identity/reports/YYYY-MM-DD-step-5-unit-test-verification.md` with commands, results and the not-applicable justification for the database step

## 6. Manual endpoint testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [ ] 6.1 **Not applicable.** No endpoint, request shape, response shape, status code, Stripe call or API client changes; the pages call the same booking, quote, checkout, sync, cancel and review endpoints through the unchanged `bookingsApi` and `listingsApi`. Justification check: `git diff origin/main --stat -- apps/web/src/api apps/api packages/shared packages/db packages/ui` is empty. Record the check and the result in the step 7 report instead of a curl report

## 7. E2E and visual checks (MANDATORY - AGENT MUST EXECUTE)

- [ ] 7.1 Isolated run setup: pick a free port (`node -e "require('net').createServer().listen(0,function(){console.log(this.address().port);this.close()})"`), start the web dev server only with `pnpm --filter @nomadhome/web exec vite --port <port> --strictPort`, and run Playwright with a throw-away config kept outside the repo (scratchpad) that spreads the repo config, sets `baseURL` to that port, uses an absolute `testDir` and `reuseExistingServer: false`; never use 5173; API calls are mocked so no API or database runs
- [ ] 7.2 Run `apps/web/e2e/booking-payment-identity.spec.ts`, `us-4.1-booking.spec.ts`, `us-4.2-cancel-booking.spec.ts`, `us-6.1-review.spec.ts`, `focus-hover.spec.ts` and `layout.spec.ts` on the isolated port and confirm green, except the known `us-4.1` checkout-redirect failure caused by its hard-coded `localhost:5173` URL (record it as pre-existing and unchanged)
- [ ] 7.3 Run the whole `pnpm test:e2e` suite on the isolated port (throw-away config) and confirm green; record any failure that is a hard-coded port 5173 URL in an unrelated or untouched spec as unchanged by this change
- [ ] 7.4 Visual check with Playwright at 1440x900 and 360x800: booking form (with and without photo, long strings), no-dates, loading, 404, quote error, server error, success, no-bookingId, waiting, cancel with and without listing, my bookings (one card per status, long title), my bookings loading, error and empty, cancel dialog (with error), review dialog (with a selected rating, with error, with success); save PNGs to `openspec/changes/booking-payment-identity/reports/screenshots/`; confirm total is ink on ember, tiles and star glyphs read on the 24 grid, status tags are distinguishable by shape, no overflow, and capture a grayscale pass for the status tags, the error panels and the success and waiting panels; note the modal still has no focus trap or ESC (follow-up)
- [ ] 7.5 Confirm keyboard use through Playwright key presses (Tab order on each page, Enter on Pay now and on each link action, focus ring visible on paper, stone and ember-adjacent controls, star buttons with arrow-free Tab and Space, dialog Tab behaviour recorded as is) and that no console error is logged in any state
- [ ] 7.6 Write report `openspec/changes/booking-payment-identity/reports/YYYY-MM-DD-step-7-e2e-and-visual-verification.md` with the port used, commands, results, screenshot list, the no-backend-change check from 6.1 and any finding

## 8. Documentation (MANDATORY)

- [ ] 8.1 Write the surface brief `apps/web/.impeccable/surfaces/src-pages-bookingformpage-tsx.md` (frontmatter `version: 1`, `slug: "src-pages-bookingformpage-tsx"`, `primary_target: "src/pages/BookingFormPage.tsx"`, `related_targets` listing BookingSuccessPage, BookingCancelPage, MyBookingsPage and the booking modals) in the format of `src-pages-listingdetailpage-tsx.md`: scope and mode (Operate, inheriting the landing world), audience, job, action, proof (real quote and booking data only, nothing invented), constraints, direction contract (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM, FINISH), palette note, unresolved decisions (D1 to D13 summarised, plus the follow-ups)
- [ ] 8.2 Update `apps/web/DESIGN.md`: add a "Booking and payment" subsection under Components (summary panel with ember total band, state panels, success and waiting panels, cancel panel, my-bookings card and status tag grammar, modal frame, star glyph, empty state), extend the Overview sentence that lists the screens, add the Do and Don't lines (status is a shape plus text; the total on ember is ink; no muted, subtle, paper or danger text on the total band or the success panel), no token or palette change; run `rg -n -i "booking|my bookings|empty state|modal" apps/web/DESIGN.md apps/web/PRODUCT.md` and fix any stale description
- [ ] 8.3 `rg -n -i "booking page|payment page|my bookings|bookings page" README.md docs apps/web/*.md apps/web/.impeccable openspec/project.md` and update remaining non-archive mentions that contradict the shipped look; do not edit `openspec/changes/archive/` or `openspec/specs/`
- [ ] 8.4 Record in the PR description the follow-ups from design.md Open points: Modal accessibility (focus trap, initial focus and restore, ESC, backdrop close, scroll lock; needs an `onClose` prop), `Link > Button` in `EmptyState` and `HostListingsPage` (issue #138), copy changes (timed-out versus success on the success page, the catch message for "Complete payment", hard-coded English star aria-labels, ISO dates versus `formatDate`), the `Badge` pill in `packages/ui`, and a shared `StatePanel`

## 9. Memory notes

- [ ] 9.1 Save engram notes (`mem_save`) for the decisions: ink-only ember total band and success panel, single-link CTAs with local constants, local status tag with shape per status, flat modal frame with the a11y gap recorded, drawn star glyph with unchanged aria-labels, EmptyState kept nested for #138; then `mem_session_summary` before reporting done

## 10. Final verification

- [ ] 10.1 `node scripts/check-mvp-scope.mjs` and `openspec validate booking-payment-identity --strict` pass
- [ ] 10.2 Final `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` green (e2e on the isolated port; caveat as in 7.2 and 7.3)
- [ ] 10.3 `rg -n "rounded-xl|rounded-lg|rounded-full|rounded-pill|shadow-sm|shadow-md|bg-slate|★|☆|text-warning|text-success|border-border-muted" apps/web/src/pages/Booking*.tsx apps/web/src/pages/MyBookingsPage.tsx apps/web/src/components/{Modal,CancelBookingModal,ReviewModal,EmptyState}.tsx` returns only intended hits; `fg-muted` and `fg-subtle` only on paper or stone; none inside the total band or the success panel
- [ ] 10.4 Confirm no unrelated file changed: `git diff origin/main --stat` lists only the files in design.md "Files in scope" and no path under `apps/api/`, `packages/db/`, `packages/shared/`, `packages/ui/` or `apps/web/src/api/`
- [ ] 10.5 PR title states the user story (for example: "Let a guest confirm a price, pay and follow a booking on screens that look like the rest of NomadHome"), the description links the change-id and says "Refs #124; closes #124", attaches the 1440 and 360 screenshots and lists the follow-ups from 8.4; commits are Conventional with the (NH-124) suffix, one per reviewable change, no AI attribution
