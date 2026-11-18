# Step 7: e2e and visual verification (admin-identity, NH-123)

Date: 2026-11-18. HEAD `e8f9ff6` (plus the verification commits).

## Isolation

- Port 5320 (free before; the Vite process was stopped by PID afterwards and the port confirmed free). Never 5173. Port 5310 was
  already taken by an unrelated process, so it was not used or touched. All API calls are mocked by the specs; no API or database ran.
- Throw-away Playwright config outside the repo: `/private/tmp/claude-501/pw-nh123/pw5320.config.ts` (plain object, absolute `testDir`,
  `baseURL` 5320, 4 workers). Server: `pnpm exec vite --port 5320 --strictPort` started by hand in `apps/web`.
- Command: `cd apps/web && pnpm exec playwright test -c /private/tmp/claude-501/pw-nh123/pw5320.config.ts`.

## 6.1 No-backend-change check

`git diff origin/main --stat -- apps/web/src/api apps/api packages apps/web/src/components` is empty. No curl report needed; the pages call
the same endpoints through the unchanged API client and hooks.

## 7.2 / 7.3 Whole suite (includes the named specs)

230 tests: 229 passed, 1 failed. The failure is `us-4.1-booking.spec.ts:83` ("creates booking and shows success page after payment"): the
spec hard-codes `localhost:5173` in a mocked checkout URL, so after Pay now the browser leaves the isolated port. Pre-existing, in a file this
change does not touch, not edited.

`admin-identity.spec.ts` alone: **34 tests, 34 passed** (also 34 of 34 inside the whole suite). `us-8.1-admin-users`, `us-8.2-admin-listings`,
`focus-hover`, `layout` and every other spec pass.

## 7.4 Visual check (screenshots/)

Captured with a Playwright script kept in `/private/tmp/claude-501/pw-nh123/capture.mjs`. `d` = 1440x900, `m` = 360x800, full page, with a
600 ms wait before each shot to avoid catching a colour transition. API mocked. 34 PNGs (about 1.6 MB).
The fixtures hold an active account, a disabled account, a multi-role account (`guest, host, admin`), a very long unbroken email, and one
listing each of published, draft and disabled plus a listing with a very long title, city and host email.

| State                                                                            | Files                                                                                                                                  |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Users: table at 1440, cards at 360 (active, disabled, multi-role, long email)    | `users-d/m.png`                                                                                                                        |
| Users: empty, loading, error                                                     | `users-empty-*`, `users-loading-*`, `users-error-*`                                                                                    |
| Listings: table at 1440, cards at 360 (draft, published, disabled, long strings) | `listings-d/m.png`                                                                                                                     |
| Listings: empty, loading, error                                                  | `listings-empty-*`, `listings-loading-*`, `listings-error-*`                                                                           |
| Focus ring on Disable and on Re-enable, both pages, both sizes                   | `focus-users-disable-*`, `focus-users-reenable-*`, `focus-listings-disable-*`, `focus-listings-reenable-*`                             |
| Focus ring on the first Tab stop                                                 | `focus-users-tab-first-*`, `focus-listings-tab-first-*`                                                                                |
| Grayscale pass (CSS `grayscale(1)`)                                              | `gray-users-tags-d`, `gray-listings-tags-d`, `gray-error-panel-d`, `gray-empty-panel-d`, `gray-users-table-d`, `gray-listings-cards-m` |

Observations:

- At 1440 the focus ring on Disable and Re-enable is complete (not clipped) and Re-enable is a one-line button. Long-string rows show every
  column (Status and Actions stay in the table; the long email, title, city and host email wrap).
- Tags are distinguishable by shape in grayscale: Active solid ink edge with a filled marker; Disabled struck through with a muted edge;
  listings draft dashed, published solid with a marker, disabled struck through. The listings tags at 1440 are visible in `gray-listings-tags-d`.
- Below `sm` each row is a 2px-edged card with email or title (wrapping), tag, labelled roles or type/city/host, and a full-width action.
- Disable is the danger red filled button; Re-enable is the flat outlined secondary. No ember on either admin page apart from the shared
  header logo tile; no shadow, no gradient, no pill.
- Error panels keep the filled tile and a danger edge; the empty panel is dashed. Both read in grayscale.
- No horizontal overflow at 360 in any state (also asserted by the spec).

## 7.5 Keyboard and console

- Covered by e2e (`admin-identity.spec.ts`, "Admin screens keyboard focus", one per page): Tab reaches each Disable and Re-enable exactly once,
  in order, and the focused button shows the 3px ink outline. Focus-ring screenshots above are taken after real Tab key presses.
- Covered only by unit tests: the Disable and Re-enable handlers (same mutation arguments, same query-key invalidation, `disabled` while
  pending) are driven by click in `AdminUsersPage.test.tsx` and `AdminListingsPage.test.tsx`.
- Not verified by a dedicated test: Enter or Space pressed on a focused action. Both are plain `<button>` elements, so activation is native
  browser behaviour; no key-press test drives it.
- Console during a pass over all 34 states at both sizes (instrumented copy of the capture script): zero `pageerror` and zero
  `console.error`, ignoring the browser's own "Failed to load resource" lines for the mocked 500 responses the error states return.

## Findings

1. `us-4.1-booking.spec.ts:83` hard-coded 5173 (pre-existing, unchanged, allowed by tasks 7.2 and 7.3).
2. No other failure and no regression found.

## Step 10 final checks

- `node scripts/check-mvp-scope.mjs`: clean. `openspec validate admin-identity --strict`: valid.
- 10.3 `rg` over `AdminUsersPage.tsx` and `AdminListingsPage.tsx` for `rounded-xl|rounded-lg|rounded-md|rounded-full|rounded-pill|shadow-sm|shadow-md|
text-red-600|bg-ember|accent-action|Badge|statusLabel|userStatusTone|listingStatusTone`: zero hits.
- Contrast: `fg-muted` appears only as secondary text, the empty-panel text, and the disabled tag edge and text, always on the paper surface;
  `ember` appears in neither page nor in `ListingStatusTag.tsx`, so no ember text exists and `fg-muted`/`fg-subtle` never sit on ember.
- 10.4 `git diff origin/main --stat` lists only the two admin pages with their tests, `AdminCopy.test.ts`, the new e2e spec, the declared edits to
  `us-8.1` and `us-8.2`, `DESIGN.md`, `.impeccable/design.json`, the surface brief and the change folder. Nothing under `apps/api/`,
  `packages/*`, `apps/web/src/api/` or `apps/web/src/components/`.
- diff-cover as CI runs it: exit 0, 100% on 242 changed lines (see the step 5 report).
