# Step 7: e2e and visual verification (booking-payment-identity, NH-124)

Date: 2026-11-18. HEAD `fc29792`.

## Isolation

- Port 5224 (free before and after; the Vite process was stopped by PID). Never 5173. All API calls are mocked by the specs; no API or
  database ran.
- Throw-away Playwright config outside the repo: `/private/tmp/claude-501/pw-nh124v/playwright.config.mjs` (plain object, absolute
  `testDir`, `baseURL` 5224). Server: `pnpm exec vite --port 5224 --strictPort` started by hand in `apps/web`.
- Command: `cd apps/web && pnpm exec playwright test -c /private/tmp/claude-501/pw-nh124v/playwright.config.mjs`.

## 6.1 No-backend-change check

`git diff origin/main --stat -- apps/web/src/api apps/api packages/shared packages/db packages/ui` is empty. No curl report needed;
the pages call the same endpoints through the unchanged `bookingsApi` and `listingsApi`.

## 7.2 / 7.3 Whole suite (includes the six named specs)

146 tests: 145 passed, 1 failed. The failure is `us-4.1-booking.spec.ts:83` ("creates booking and shows success page after payment"):
the spec hard-codes `localhost:5173` in a mocked checkout URL, so after Pay now the browser leaves for `chrome-error://chromewebdata/` on
any other port. Pre-existing, in a file this change does not touch, not edited. The new `booking-payment-identity.spec.ts`, `us-4.2`,
`us-6.1`, `focus-hover` and `layout` specs all pass.

## 7.4 Visual check (screenshots/)

Captured by running a copy of `booking-payment-identity.spec.ts` kept in `/private/tmp/claude-501/pw-nh124v/shots/` whose
screenshot helper writes PNGs (the repo spec is unchanged and only attaches them). `d` = 1440x900, `m` = 360x800, full page.
A 600 ms wait before each shot avoids catching the button colour transition. The 54 tests of the copy all passed.

| State                                                  | Files                                                                                                                                                                                                                                          |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Form with dates                                        | `form-loaded-d/m.png`                                                                                                                                                                                                                          |
| Form long strings (360)                                | `form-long-strings-m.png`                                                                                                                                                                                                                      |
| No dates                                               | `form-no-dates-d/m.png`                                                                                                                                                                                                                        |
| Form loading, listing 404, quote error, server error   | `form-loading-*`, `form-404-*`, `form-quote-error-*`, `form-server-error-*`                                                                                                                                                                    |
| Success, success without booking id, waiting           | `success-*`, `success-no-booking-id-*`, `waiting-*`                                                                                                                                                                                            |
| Cancel                                                 | `cancel-d/m.png`                                                                                                                                                                                                                               |
| My bookings (pending, confirmed, cancelled, completed) | `bookings-d/m.png`; ten cards at 360: `bookings-ten-cards-m.png`                                                                                                                                                                               |
| My bookings loading, error, empty                      | `bookings-loading-*`, `bookings-error-*`, `bookings-empty-*`                                                                                                                                                                                   |
| Cancel dialog with server error                        | `cancel-dialog-d/m.png`                                                                                                                                                                                                                        |
| Review dialog (4 stars selected), review success       | `review-dialog-d/m.png`, `review-success-d/m.png`                                                                                                                                                                                              |
| Grayscale pass (CSS `grayscale(1)`, 1440)              | `gray-*-d.png` for status tags (`gray-bookings`), error panels (`gray-form-404`, `gray-form-quote-error`, `gray-form-server-error`, `gray-bookings-error`), success and waiting (`gray-success`, `gray-waiting`), cancel, empty, cancel dialog |

Observations:

- Total is ink on ember in one row; no control sits in the band; Pay now is below it. The summary panel and photo have 2px ink edges, no
  shadow and a square photo. Checked in screenshots and by the spec.
- Status tags are distinguishable in grayscale by shape alone: pending dashed, confirmed solid, cancelled struck through with a muted edge,
  completed solid with a filled square marker.
- Error panels keep the filled "!" tile and a heavier edge, so they read as errors in grayscale; the success panel keeps the ink tile with a
  check glyph.
- Star glyphs are drawn (filled versus outline) and read on their grid at 360; no emoji stars.
- No horizontal overflow at 360 in any state (also asserted by the spec).
- In full-page shots the dialog backdrop covers only the first viewport height (backdrop is `fixed`); this is a screenshot artefact, not a layout
  defect. The modal still has no focus trap, ESC or backdrop close (known follow-up, task 8.4).

## 7.5 Keyboard and console

- The spec's keyboard tests (Tab reaches Pay now then the back link, one stop each; success and cancel link actions one stop; 3px ink outline)
  all pass.
- Console during the 54-test capture run: zero `pageerror`. The only `console.error` entries are the browser's own "Failed to load resource"
  lines for the mocked 404, 409, 422 and 500 responses the error-state tests deliberately return.
- Not verified here: Space on star buttons and Tab order inside the open dialogs. Task 7.5 is therefore left unticked.

## Findings

1. `us-4.1-booking.spec.ts:83` hard-coded 5173 (pre-existing, unchanged, allowed by tasks 7.2 and 7.3).
2. No other failure and no regression found.

## Step 10 final checks

- `node scripts/check-mvp-scope.mjs`: clean. `openspec validate booking-payment-identity --strict`: valid.
- 10.3 legacy-class `rg` over the pages and four components (excluding tests): one hit, `border-border-muted` on the cancelled status tag
  (`MyBookingsPage.tsx:40`), intended. `fg-muted` and `fg-subtle` appear only on paper surfaces (summary rows, card meta, modal body,
  placeholders, empty state); none inside the total band or the success panel.
- 10.4 `git diff origin/main --stat` lists only the page and modal sources and tests, `BookingCopy.test.ts`, the new e2e spec, `DESIGN.md`,
  `.impeccable/design.json` and the surface brief, and the change folder. Nothing under `apps/api/`, `packages/*` or `apps/web/src/api/`.
  Note: `apps/web/.impeccable/design.json` is the sidecar of the DESIGN.md update.
- diff-cover as CI runs it: exit 0, 99% on 334 changed lines (see step 5 report).
