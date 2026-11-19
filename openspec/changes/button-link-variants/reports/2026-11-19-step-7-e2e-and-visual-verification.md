# Step 7: e2e and visual verification (button-link-variants, NH-138)

Date: 2026-11-19. Branch `feature/NH-138-button-link`.

## Setup

- Port **5421** (never 5173). Vite started by hand: `pnpm --filter @nomadhome/web exec vite --port 5421 --strictPort`, stopped by PID.
- Throw-away Playwright config outside the repo (`/private/tmp/claude-501/pw-nh138/final.config.ts`): absolute `testDir`, `baseURL` `http://localhost:5421`, 4 workers, no retries.
- API calls are mocked; no API or database was started for e2e.
- `@nomadhome/shared` and `@nomadhome/ui` built first.

## Results

| Run                                                                                                                              | Result                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `button-link-variants.spec.ts` (shared contract on every migrated screen at 1440 and 360, plus the new back link underline test) | 28 passed                                                                                                                                                                                                       |
| Whole e2e suite                                                                                                                  | **257 passed, 1 failed**                                                                                                                                                                                        |
| Known pre-existing failure                                                                                                       | `us-4.1-booking.spec.ts:83` (creates booking and shows success page after payment): the browser lands on `chrome-error://chromewebdata/` after Pay now (pre-existing). Unchanged by this change and not edited. |

The shared contract asserts per screen: zero `a button` and `button a`, one Tab stop per link CTA, computed `box-shadow: none` at rest on secondary buttons and cards, and a 3px outline plus 2px `--focus-gap` shadow on focus. `admin-identity.spec.ts` and `focus-hover.spec.ts` assert the two-layer ring and the Cancel page hover resolving to `surface-inset`; no assertion was weakened. Back link: computed `text-decoration-line` is `underline` at rest and `none` on hover at both viewports.

## Screenshot index

`openspec/changes/button-link-variants/reports/screenshots/` holds 76 PNGs: 19 subjects, each at 1440x900 and 360x800, at rest and focused (`<subject>-<1440|360>-<rest|focus>.png`). Subjects: `empty-my-bookings`, `empty-host-upcoming`, `listing-detail-book-now`, `listing-detail-visitor-login`, `host-listings`, `host-listings-edit`, `booking-form-pay`, `booking-form-back-link`, `booking-cancel`, `booking-success`, `verify-email`, `modal-cancel-booking`, `modal-review`, `my-bookings-cancel-secondary`, `my-bookings-review-secondary`, `admin-users-reenable`, `admin-listings-reenable`, `edit-listing-upload`, `edit-listing-card`. Screenshots are evidence only and never pixel-compared.

## Intentional visual changes

1. **Focus gap on secondary buttons and cards.** With the ring and `![box-shadow:none]` overrides gone, the global rule shows the 3px outline plus the 2px paper gap everywhere (spec already required it).
2. **Cancel page secondary hover.** `hover:bg-surface-raised` drift is replaced by the primitive's `hover:bg-surface-inset`.

No other visual difference is expected: the old 1px border plus 1px inset ring and the new `border-2` occupy the same 2px, apart from corner anti-aliasing.

## No-backend-change check (task 6.1)

`git diff origin/main --stat -- apps/web/src/api apps/api packages/shared packages/db` is empty. No endpoint, request or response shape changed, so no curl report is needed.

## Findings

One review finding (back link never underlined) was fixed with a red test first; see the step 5 report. Task 7.5 console-error and key-press coverage was not re-run in this pass.
