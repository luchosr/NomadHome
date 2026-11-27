# Tasks: a11y-rating-terms-moderation

Order is TDD: QA red (section 1), Frontend green (section 2), E2E (section 3), docs (section 4). Paths are relative to the worktree root. No `apps/api/`, `packages/db/` or `apps/web/src/api/` change.

New keys: `booking.ui.star_one` "star" and `booking.ui.star_other` "stars". No existing key or value changes.

Copy guards affected: `apps/web/src/pages/ModalCopy.test.ts` (exact set of keys read by `ReviewModal.tsx`) and `apps/web/src/pages/BookingCopy.test.ts` (`en.booking.ui` compared with `toEqual`). `HostCopy.test.ts` scans `BecomeHostPage.tsx` but needs no edit because no key changes there. `AdminCopy.test.ts` is unaffected.

## 1. QA red

- [x] 1.1 `apps/web/src/pages/ModalCopy.test.ts`: add `booking.ui.star_one` and `booking.ui.star_other` to `BASELINE` and update the header comment to name them as the only additions. Keep every existing literal.
- [x] 1.2 `apps/web/src/pages/BookingCopy.test.ts`: add `star_one: "star"` and `star_other: "stars"` to `BOOKING_UI`. Keep every existing literal. The existing exact-name guard in `apps/web/src/components/ReviewModal.test.tsx` stays unedited.
- [ ] 1.3 `apps/web/src/pages/BecomeHostPage.test.tsx`: add the field error link scenarios for the display name input, payout email input and terms checkbox (error shown: `aria-invalid="true"` and `aria-describedby` equal to the id of that control's own error element, which has no role; before submit: no `aria-describedby`, `aria-invalid` not `true`; after correcting the field or checking the box: both cleared). Leave the email empty to trigger its error, since a malformed value is stopped by native `type="email"` validation before submit.
- [ ] 1.4 Run `pnpm --filter @nomadhome/web test`; confirm only the new or updated assertions fail, for the expected reasons. Commit `test(web): red tests for star names and become-host error links (NH-146)`.

## 2. Frontend green

- [ ] 2.1 `packages/shared/src/strings/en.ts`: add `star_one` and `star_other` under `booking.ui`.
- [ ] 2.2 `apps/web/src/components/ReviewModal.tsx`: set the star `aria-label` to the number, one space, and `t("booking.ui.star_one")` for 1 or `t("booking.ui.star_other")` otherwise, each as its own literal `t()` call (not a ternary inside `t()`, which the copy guards do not match). Make 1.1 and 1.2 pass. Commit `fix(web): route review star names through t() (NH-146)`.
- [ ] 2.3 `apps/web/src/pages/BecomeHostPage.tsx`: import `errorIdFor` from `../components/FormField.js`; give the checkbox `aria-invalid={!!errors.acceptedTerms}` and `aria-describedby={errors.acceptedTerms ? errorIdFor("acceptedTerms") : undefined}`; give the error paragraph `id={errorIdFor("acceptedTerms")}`. No class, text or role change. Commit `fix(web): link become-host terms error to its checkbox (NH-146)`.
- [ ] 2.4 `apps/web/src/pages/BecomeHostPage.tsx`: give the `displayName` and `payoutEmail` inputs `aria-describedby={errors.<field> ? errorIdFor("<field>") : undefined}`, keeping their existing `aria-invalid`. `apps/web/src/components/FormField.tsx` already renders the ids and is not edited. Make 1.3 pass. Commit `fix(web): link become-host field errors to their inputs (NH-146)`.
- [ ] 2.5 Verify: `pnpm lint`, `pnpm typecheck`, `pnpm --filter @nomadhome/web test`, `pnpm --filter @nomadhome/shared test`, `pnpm build`.

## 3. E2E (no production change)

These cases describe existing behaviour and are expected to pass on first run. If one fails because of the application, stop and report it; do not edit production code. Make sure the server on port 5173 is the one from this worktree (`playwright.config.ts` reuses a running server).

- [ ] 3.1 `apps/web/e2e/us-8.1-admin-users.spec.ts`: for Disable and Re-enable, each with Enter and Space (four cases), focus the button, assert it is focused, press the key, assert exactly one matching `PATCH` request and that the refetched row shows the opposite action.
- [ ] 3.2 `apps/web/e2e/us-8.2-admin-listings.spec.ts`: the same four cases for listings.
- [ ] 3.3 Run both specs headless. Record where `document.activeElement` is while the request is pending and after it settles (success and failure) and report it; do not assert focus retention and do not change production code. Commit `test(web): cover keyboard activation of admin moderation actions (NH-146)`.

## 4. Docs

- [ ] 4.1 `apps/web/DESIGN.md`: in the Field grammar paragraph, note that the Become host display name, payout email and terms controls link their errors with `aria-describedby` and set `aria-invalid`.
- [ ] 4.2 Run `openspec validate a11y-rating-terms-moderation --strict`, tick the tasks in `openspec/changes/a11y-rating-terms-moderation/tasks.md` and commit `docs(web): note become-host error links and tick tasks (NH-146)`.
