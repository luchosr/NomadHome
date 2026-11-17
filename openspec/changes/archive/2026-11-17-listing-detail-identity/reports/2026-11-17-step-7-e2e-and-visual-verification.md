# Step 7: e2e and visual verification (listing-detail-identity, NH-126)

Date: 2026-11-17. HEAD `e204969`.

## Isolation

- Port 5214 (free before and after; stopped by PID). Never 5173. All API calls mocked by the specs; no API or database ran.
- Throw-away Playwright config outside the repo: `/private/tmp/claude-501/pw126b/playwright.config.ts` (absolute `testDir`,
  `baseURL` 5214, `reuseExistingServer: false`, vite `--port 5214 --strictPort`).
- Command: `cd apps/web && pnpm exec playwright test -c /private/tmp/claude-501/pw126b/playwright.config.ts [specs]`.

## 6.1 No-backend-change check

`git diff origin/main --stat -- apps/web/src/api apps/api` is empty (also empty for `packages/db` and `packages/shared`).
No curl report needed; the page uses the unchanged `listingsApi`.

## 7.2 Named specs

`listing-detail-identity`, `us-4.1-booking`, `focus-hover`, `layout`: 32 passed, 1 failed.
The failure is `us-4.1-booking.spec.ts:83` ("creates booking and shows success page after payment"): the spec hard-codes
`localhost:5173` in a mocked URL, so after payment the browser leaves for `chrome-error://chromewebdata/` on any other port.
Pre-existing, in a file this change does not touch, not edited.

## 7.3 Whole suite

91 passed, 1 failed (same `us-4.1-booking.spec.ts:83`, port 5173 hard-code). No other failure.

## 7.4 Visual check (screenshots/)

Captured by `/private/tmp/claude-501/pw126b/cap.mjs` against the isolated server, mocked API, `d` = 1440x900, `m` = 360x800.
Full-page unless noted.

| State                                                                    | Files                                                                                        |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Guest with dates, three photos (primary + 2 thumbs), date picker visible | `guest-dates-three-photo-d/m.png`                                                            |
| Visitor                                                                  | `visitor-d/m.png`                                                                            |
| Host (price band over an empty panel body, no CTA, as before)            | `host-d/m.png`                                                                               |
| No photo (dashed stone placeholder)                                      | `no-photo-d/m.png`                                                                           |
| Very long strings                                                        | `long-strings-d/m.png`                                                                       |
| Loading skeleton                                                         | `loading-d/m.png`                                                                            |
| Not found                                                                | `not-found-d/m.png`                                                                          |
| Error                                                                    | `error-d/m.png`                                                                              |
| No reviews                                                               | `no-reviews-d/m.png`                                                                         |
| Focus: Book now, Log in to book, picker day                              | `focus-book-now-d/m.png`, `focus-login-to-book-d/m.png`, `focus-datepicker-d/m.png` (+ `-m`) |
| Sticky after scroll 600px (viewport shot)                                | `scrolled-sticky-d.png`                                                                      |
| Grayscale pass (CSS `grayscale(1)`) of state panels                      | `gray-not-found-d.png`, `gray-error-d.png`                                                   |

Observations (from the screenshots and the e2e assertions):

- Frame and tags: ink 2px frame on the primary photo, flat thumbnails, square tags aligned to the left edge; no overflow at 360
  in any state (long strings included; also asserted by the e2e spec).
- Board row: `Lisbon, PT` and the address sit side by side at 1440 and stack at 360.
- Sticky: the panel stays below the nav after scrolling at 1440 and is static after the content at 360.
- Price band: ink text on ember, panel edge 2px ink, no shadow.
- Not-found and error are distinguishable in grayscale: different tile glyph (hollow square vs "!"), different fill
  (paper vs tinted grey) and different copy length; both read clearly.
- Star and tile glyphs read cleanly on their 24 grid.
- DateRangePicker in the new panel (follow-up, not fixed here, already listed in task 8.4): it fits inside the 360 panel, but the
  today marker and month chevrons use the library default blue (off palette), and the grid is left-aligned in the panel
  rather than centred.

## 7.5 Keyboard and console

- Guest with dates: Tab order is nav links, Log out, picker next-month, picker today, then Book now. Book now shows
  `3px solid rgb(30, 30, 30)` outline. Enter on Book now navigates to `/listings/listing-1/book?checkIn=2099-07-10&checkOut=2099-07-12`.
- Picker: focused day shows a 3px ink outline; ArrowRight moves focus 2026-11-17 to 2026-11-18 (unchanged behaviour).
- Visitor: Log in to book shows the same 3px ink outline. Focus ring is visible on the paper panel; no focusable element sits on stone.
- Console: zero `pageerror` and zero script errors in all states. The only `console.error` entries are the browser's own
  "Failed to load resource" lines for the mocked 404 (1 per load) and 500 (3 per load: the page's two retries) responses in the
  not-found and error states, which are the expected network results of those mocks.

## Findings

1. `us-4.1-booking.spec.ts:83` hard-coded 5173 (pre-existing, unchanged, recorded as allowed by task 7.3).
2. `apps/web/.impeccable/design.json` changed (+8 lines) but is not in design.md "Files in scope" (see step 10 note).
3. Picker colour and centring follow-ups confirmed visually (already in 8.4).

## Step 10 final checks

- `node scripts/check-mvp-scope.mjs`: clean. `openspec validate listing-detail-identity --strict`: valid.
- Legacy-class rg on `ListingDetailPage.tsx` (`rounded-xl|rounded-lg|rounded-full|rounded-pill|shadow-sm|bg-slate|emoji star|text-fg-subtle|text-fg-muted`):
  only `text-fg-muted` (lines 216, 221, 244) and `text-fg-subtle` (252, 257), all on paper, none inside the price band. No rounded, shadow,
  slate or emoji hits.
- `git diff origin/main --stat` (10 files): page, page test, new e2e spec, DESIGN.md, surface brief, design.json, and the change's
  proposal, spec, design, tasks. Note: `apps/web/.impeccable/design.json` (+8 lines) is not in the design.md scope table (sidecar of the DESIGN.md update).
- diff-cover as CI runs it (`diff-cover coverage/lcov.info --compare-branch=origin/main --fail-under=80`, lcov merged from web with the `apps/web/` prefix):
  exit 0, "No lines with coverage information in this diff". Cause: the vitest v8 lcov maps `ListingDetailPage.tsx` to a single DA line, so
  diff-cover cannot measure it. Direct figure from the vitest text report: `ListingDetailPage.tsx` 100% statements, branches, functions and lines.
- Full e2e on the isolated port: see 7.3 (91 passed, 1 pre-existing 5173 failure).
