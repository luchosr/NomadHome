# Step 7: e2e and visual verification (modal-a11y, NH-146)

Date: 2026-11-23. Branch: `feature/NH-146-modal-a11y`.

## Setup

- Vite started by hand on port 5460: `pnpm exec vite --port 5460 --strictPort` (never 5173). Stopped by PID afterwards.
- Throw-away Playwright config outside the repo (`/private/tmp/claude-501/pw-nh146/playwright.config.mjs`): absolute `testDir`, `baseURL` `http://localhost:5460`, no `webServer`. API calls are mocked through one catch-all route, so no API and no database run.
- Packages built first (`@nomadhome/shared`, `@nomadhome/ui`).

## Results

| Run                          | Result                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `modal-a11y.spec.ts`         | 44 passed at the last targeted run (1440 and 360, both dialogs) plus the scrollbar group below |
| Whole suite (`apps/web/e2e`) | **301 passed, 2 skipped, 1 failed**                                                            |

The single failure is `us-4.1-booking.spec.ts:83` (creates booking and shows success page after payment), a known pre-existing failure unrelated to this change. The spec was not edited. The 2 skipped are the "native" scrollbar tests (see below).

New e2e coverage in this round: Escape pressed three times while pending (dialog still visible, `:modal` still true, body overflow still `hidden`, then released and removed with overflow restored) at 1440 and 360 for both dialogs; review success focuses the `role="status"` panel and Escape closes with focus on the opener; the Tab-loop test asserts the background is inert (programmatic focus on outside links and buttons is refused).

## Scrollbar measurement (design open point, tasks 2.4 and 3.5)

- Playwright headless Chromium passes `--hide-scrollbars` and macOS uses overlay scrollbars. With `--hide-scrollbars` ignored and no styling, `innerWidth - clientWidth` is 0, so **the native gutter path cannot be measured on this platform**. The "native" tests detect that and skip with a reason; on a platform with classic scrollbars they run and assert that `h1` left, card left and card width do not change when the dialog opens.
- Fallback ("forced" tests, kept): `html::-webkit-scrollbar { width: 15px }` forces a classic scrollbar. Measured at 1440 for both dialogs: closed `clientWidth` 1425 (15px scrollbar), open 1440 (scrollbar gone), and `h1Left` 216.5, `cardLeft` 216.5, `cardWidth` 992 identical before and after. A custom `::-webkit-scrollbar` is not covered by `scrollbar-gutter`, so this run exercises the `lost > 0` padding fallback in `Modal`, which compensates the 15px. Decision: no layout jump, nothing further to compensate.
- Accepted: the global `html { scrollbar-gutter: stable }` reserves a gutter on every route with classic scrollbars.

## Visual verification

Captured with `/private/tmp/claude-501/pw-nh146/shots.mjs` against port 5460 after fixes 1 to 3 (all 28 re-captured; the review success and initial-focus states are the ones affected by the fixes). Per image the script checks: no horizontal overflow (`scrollWidth <= innerWidth`), no console error, dialog side gutter of at least 16px at 360, and records the focus-visible ring. All 28 reported no issue.

- Review success: unchanged visually. The focused `role="status"` panel shows no focus ring (programmatic focus on a non-interactive element), so there is no new visual element.
- Initial focus: the first star (review) and the textarea (cancel) show the two-layer focus ring (3px solid ink outline, 2px offset), as before.
- 360 px: dialog side gutter 16px each side, width 328px. No shadow, 2px ink edge, flat scrim.

### Screenshot index (`reports/screenshots/`)

| State                                                         | 1440                                                                                    | 360                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------- |
| Page at rest                                                  | `bookings-1440-rest-closed.png`                                                         | `bookings-360-rest-closed.png`      |
| Cancel, open, initial focus                                   | `cancel-1440-open-initial-focus.png`                                                    | `cancel-360-open-initial-focus.png` |
| Cancel, Tab to Close                                          | `cancel-1440-tab-focus-close.png`                                                       | `cancel-360-tab-focus-close.png`    |
| Cancel, Tab to Yes, cancel                                    | `cancel-1440-tab-focus-primary.png`                                                     | `cancel-360-tab-focus-primary.png`  |
| Cancel, pending                                               | `cancel-1440-pending-submit.png`                                                        | `cancel-360-pending-submit.png`     |
| Cancel, failed submit                                         | `cancel-1440-failed-submit.png`                                                         | `cancel-360-failed-submit.png`      |
| Review, open, initial focus                                   | `review-1440-open-initial-focus.png`                                                    | `review-360-open-initial-focus.png` |
| Review, Tab to Close                                          | `review-1440-tab-focus-close.png`                                                       | `review-360-tab-focus-close.png`    |
| Review, Tab to Submit review                                  | `review-1440-tab-focus-primary.png`                                                     | `review-360-tab-focus-primary.png`  |
| Review, pending                                               | `review-1440-pending-submit.png`                                                        | `review-360-pending-submit.png`     |
| Review, failed submit                                         | `review-1440-failed-submit.png`                                                         | `review-360-failed-submit.png`      |
| Review, success                                               | `review-1440-success.png`                                                               | `review-360-success.png`            |
| Scrollbar before and after (cancel, forced classic scrollbar) | `bookings-cancel-1440-scrollbar-before.png`, `bookings-cancel-1440-scrollbar-after.png` | n/a                                 |
| Scrollbar before and after (review)                           | `bookings-review-1440-scrollbar-before.png`, `bookings-review-1440-scrollbar-after.png` | n/a                                 |

## No backend, client or shared change (task 6.1)

`git diff origin/main --name-only` shows no path under `apps/api/`, `packages/db/`, `packages/shared/` or `apps/web/src/api/`. Curl testing is not applicable: no endpoint, request, response or status changed.

## Findings and accepted items

- Finding 1 reproduced in Chromium and fixed (see the step 5 report).
- Console: no error in any captured state (the expected mocked 500 in the failed-submit state is filtered out).
- Accepted: global `scrollbar-gutter: stable`; native-scrollbar e2e skipped on overlay-scrollbar platforms; `us-4.1-booking.spec.ts:83` pre-existing failure.
