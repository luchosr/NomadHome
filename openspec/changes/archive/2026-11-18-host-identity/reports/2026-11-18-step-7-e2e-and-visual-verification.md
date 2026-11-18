# Step 7: e2e and visual verification (host-identity, NH-122)

Date: 2026-11-18. HEAD `fd46983` (plus the verification commits).

## Isolation

- Port 5270 (free before and after; the Vite process was stopped by PID). Never 5173. All API calls are mocked by the specs; no API or
  database ran.
- Throw-away Playwright config outside the repo: `/private/tmp/claude-501/pw-nh122/playwright.config.ts` (plain object, absolute `testDir`,
  `baseURL` 5270, 4 workers). Server: `pnpm exec vite --port 5270 --strictPort` started by hand in `apps/web`.
- Command: `cd apps/web && pnpm exec playwright test -c /private/tmp/claude-501/pw-nh122/playwright.config.ts`.

## 6.1 No-backend-change check

`git diff origin/main --stat -- apps/web/src/api apps/api packages apps/web/src/components/Modal.tsx apps/web/src/components/EmptyState.tsx`
is empty. No curl report needed; the pages call the same endpoints through the unchanged API client and hooks.

## 7.2 / 7.3 Whole suite (includes the named specs)

196 tests: 195 passed, 1 failed. The failure is `us-4.1-booking.spec.ts:83` ("creates booking and shows success page after payment"):
the spec hard-codes `localhost:5173` in a mocked checkout URL, so after Pay now the browser leaves the isolated port. Pre-existing, in a file
this change does not touch, not edited.

`host-identity.spec.ts` alone: **50 tests, 50 passed** (run with a name filter on the same config, also 50 of 50 inside the whole suite).
`us-1.3`, `us-2.1`, `us-2.2`, `us-2.3`, `us-7.1`, `focus-hover`, `layout` and `booking-payment-identity` all pass.

## 7.4 Visual check (screenshots/)

Captured with a Playwright script kept in `/private/tmp/claude-501/pw-nh122/` (adapted from the review-time capture; bookings below `sm` are
cards, so every bookings state was re-shot). `d` = 1440x900, `m` = 360x800, full page, with a 600 ms wait before each shot to avoid
catching a colour transition. API mocked. 68 PNGs.

| State                                                                            | Files                                                                                                                                                          |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Listings: published with photo, draft, disabled workspace (pictogram tile)       | `listings-three-d/m.png`                                                                                                                                       |
| Listings: long title and city                                                    | `listings-long-title-d/m.png`                                                                                                                                  |
| Listings: empty, loading, error                                                  | `listings-empty-*`, `listings-loading-*`, `listings-error-*`                                                                                                   |
| Host bookings: four statuses (table at 1440, cards at 360)                       | `bookings-four-d/m.png`                                                                                                                                        |
| Host bookings: long guest email                                                  | `bookings-long-email-d/m.png`                                                                                                                                  |
| Host bookings: empty, loading, error                                             | `bookings-empty-*`, `bookings-loading-*`, `bookings-error-*`                                                                                                   |
| Create: empty, field errors, server error                                        | `create-empty-*`, `create-field-errors-*`, `create-server-error-*`                                                                                             |
| Edit: draft, published, photos (empty, two), availability blocks                 | `edit-draft-*`, `edit-published-*`, `edit-photos-empty-*`, `edit-photos-two-*`, `edit-availability-blocks-*`                                                   |
| Edit: publish error, upload error, loading, not found                            | `edit-publish-error-*`, `edit-upload-error-*`, `edit-loading-*`, `edit-not-found-*`                                                                            |
| Become host: empty, terms error                                                  | `become-host-empty-*`, `become-host-terms-error-*`                                                                                                             |
| Amenity grid unchecked and checked                                               | `amenity-unchecked-*`, `amenity-checked-*`                                                                                                                     |
| Focus ring: New listing link, Edit link, input, amenity checkbox, terms checkbox | `focus-*-d/m.png`                                                                                                                                              |
| Grayscale pass (CSS `grayscale(1)`, 1440)                                        | `gray-tags-d` (listing tags), `gray-status-tags-row-d` (booking tags), `gray-error-panel-d`, `gray-empty-panel-d`, `gray-form-errors-d`, `gray-amenity-grid-d` |

Observations:

- Listing tags are distinguishable by shape in grayscale: draft dashed, published solid with a filled marker, disabled struck through with a
  muted edge. Booking tags: pending dashed, confirmed solid, cancelled struck through, completed solid with a filled square marker.
- Below `sm` the bookings are 2px-edged cards with title, tag, guest email, both dates and amount; at 1440 the table has a 2px ink head
  rule. A long guest email wraps inside the card.
- No ember anywhere on the host screens apart from the shared header logo tile; no shadow, no gradient, no pill.
- Error panels keep the filled tile and a danger edge; the empty panel is dashed. Both read in grayscale.
- Checkboxes are square 2px ink boxes with a drawn check; the amenity grid reads checked versus unchecked in grayscale.
- No horizontal overflow at 360 in any state (also asserted by the spec).

## 7.5 Keyboard and console

- Spec evidence (all green): Tab reaches New listing then each Edit once each, in order, with the 3px ink outline; the ring shows on a
  select, a textarea, a checkbox and the submit button on Create; Publish, a textarea, a select and Save changes on Edit; Space toggles the
  terms checkbox on become host and the ring shows on it. Space on the amenity checkboxes is asserted by `AmenityCheckboxGrid.test.tsx`
  (Space and label click each call the handler once). Links activate with Enter natively (they are plain anchors).
- Console during a second pass over all 60 states at both sizes: zero `pageerror` and zero `console.error`, ignoring the browser's own
  "Failed to load resource" lines for the mocked 404, 422 and 500 responses the error states deliberately return.
- Not verified here: Enter on each link was not driven by a key press in a dedicated test (anchor default behaviour only).

## Findings

1. `us-4.1-booking.spec.ts:83` hard-coded 5173 (pre-existing, unchanged, allowed by tasks 7.2 and 7.3).
2. Cosmetic, pre-existing markup: the listing meta line renders "Property ·Lisbon, PT" with no space after the dot. Not changed by this
   verification pass; candidate follow-up.
3. No other failure and no regression found.

## Step 10 final checks

- `node scripts/check-mvp-scope.mjs`: clean. `openspec validate host-identity --strict`: valid.
- 10.3 legacy-class `rg` over the pages and six components (excluding tests): zero hits.
- Contrast: `fg-muted` and `fg-subtle` appear only on paper or raised surfaces (secondary text, placeholders, cancelled and disabled tag
  edges, booking card meta); `ember` appears in none of the host pages or components, so neither token sits on ember and no ember text exists.
- 10.4 `git diff origin/main --stat` lists only the host pages and components with their tests, `HostCopy.test.ts`, the new e2e spec, the
  5-line edit to `us-7.1-host-dashboard.spec.ts`, `DESIGN.md`, `.impeccable/design.json`, the surface brief and the change folder.
  Nothing under `apps/api/`, `packages/*` or `apps/web/src/api/`.
- diff-cover as CI runs it: exit 0, 100% on 464 changed lines (see the step 5 report).
