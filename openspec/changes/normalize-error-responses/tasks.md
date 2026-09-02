# Tasks: normalize-error-responses

## 1. Backend

- [ ] 1.1 `apps/api/src/controllers/auth.controller.ts` `login` (line ~82): change `res.status(401).json({ error: t("identity.login.invalid_credentials") })` to `res.status(401).json({ error: "INVALID_CREDENTIALS", message: t("identity.login.invalid_credentials") })`.
- [ ] 1.2 `apps/api/src/controllers/auth.controller.ts` `becomeHost` `AlreadyHostError` branch (line ~172): change `res.status(409).json({ error: t("identity.become_host.already_host") })` to `res.status(409).json({ error: "ALREADY_HOST", message: t("identity.become_host.already_host") })`.
- [ ] 1.3 `apps/api/src/controllers/booking.controller.ts` `mapError`, `BookingNotFoundError` branch: change `res.status(404).json({ error: t("booking.error.not_found") })` to `res.status(404).json({ error: "BOOKING_NOT_FOUND", message: t("booking.error.not_found") })`.
- [ ] 1.4 `apps/api/src/controllers/booking.controller.ts` `mapError`, `ListingNotAvailableError` branch: change `res.status(404).json({ error: t("booking.error.listing_not_found") })` to `res.status(404).json({ error: "LISTING_NOT_AVAILABLE", message: t("booking.error.listing_not_found") })`.
- [ ] 1.5 `apps/api/src/controllers/booking.controller.ts` `mapError`, `BookingOverlapError` branch: add a `message: t("booking.error.overlap")` field alongside the existing `error: "OVERLAP_CONFLICT"` and `conflict` payload (keep `conflict` — it's structured data some future UI could use, not the display message).
- [ ] 1.6 `apps/api/src/controllers/booking.controller.ts` `mapError`, `NoFeeConfigError` branch: change `res.status(500).json({ error: err.message })` to `res.status(500).json({ error: "NO_FEE_CONFIG", message: err.message })` (`err.message` is already the translated string per `NoFeeConfigError`'s constructor).
- [ ] 1.7 `apps/api/src/controllers/review.controller.ts` `ReviewNotFoundError` branch: change `res.status(404).json({ error: t("reviews.error.booking_not_found") })` to `res.status(404).json({ error: "BOOKING_NOT_FOUND", message: t("reviews.error.booking_not_found") })`.

## 2. Frontend

- [ ] 2.1 Add `getDisplayMessage(err: unknown): string` to `apps/web/src/api/client.ts`: if `err instanceof ApiError` and `err.body` is an object with a string `message` field, return it; otherwise return `t("error.generic.unexpected")`.
- [ ] 2.2 `apps/web/src/pages/LoginPage.tsx`: replace the `err.status === 401` branch with `setServerError(getDisplayMessage(err))` unconditionally in the catch block.
- [ ] 2.3 `apps/web/src/pages/BecomeHostPage.tsx`: replace the `409`/`403 EMAIL_NOT_VERIFIED` branches with `setServerError(getDisplayMessage(err))` unconditionally.
- [ ] 2.4 `apps/web/src/pages/BookingFormPage.tsx`: replace the `409 OVERLAP_CONFLICT`/`422 SELF_BOOKING_NOT_ALLOWED`/`403 EMAIL_NOT_VERIFIED` branches with `setServerError(getDisplayMessage(err))` unconditionally.
- [ ] 2.5 `apps/web/src/components/ReviewModal.tsx`: replace the `409` branch with `setError(getDisplayMessage(err))` unconditionally — this also fixes the previously-generic `BOOKING_NOT_CONFIRMED`/`CHECKOUT_NOT_PASSED`/`BOOKING_NOT_FOUND` cases, which the backend already sent good messages for but the form never surfaced.
- [ ] 2.6 `apps/web/src/components/CancelBookingModal.tsx`: replace the `422` branch with `setError(getDisplayMessage(err))` unconditionally.
- [ ] 2.7 Leave `apps/web/src/contexts/auth.tsx` (401/403 logout interceptor) and `apps/web/src/pages/ListingDetailPage.tsx` (404-based query retry) untouched — both use status codes for control flow, not message selection; out of scope per proposal.md.

## 3. Tests

- [x] 3.1 Backend: extend `apps/api/src/auth.login.test.ts` to assert `error: "INVALID_CREDENTIALS"` + `message` on the 401 response; extend `apps/api/src/become-host.test.ts` to assert `error: "ALREADY_HOST"` + `message` on the 409 response.
- [x] 3.2 Backend: extend `apps/api/src/booking.test.ts` to assert `error`/`message` on the `LISTING_NOT_AVAILABLE` 404 and the `OVERLAP_CONFLICT` 409 (message field, in addition to existing `conflict` assertions); add/extend a `NoFeeConfigError` 500 case if one exists (check current coverage first — don't invent a new fixture path if none already exercises `NoFeeConfigError`).
- [x] 3.3 Backend: extend the review-creation test file to assert `error: "BOOKING_NOT_FOUND"` + `message` on its 404.
- [x] 3.4 Frontend: for each of `LoginPage.test.tsx`, `BecomeHostPage.test.tsx`, `BookingFormPage.test.tsx`, `ReviewModal.test.tsx` (or equivalent, create if missing following existing conventions), `CancelBookingModal.test.tsx` — assert that a mocked `ApiError` with a `message` field (matching a code NOT previously special-cased, e.g. a made-up new code for ReviewModal's now-fixed `BOOKING_NOT_CONFIRMED` case) renders that exact message, proving the generic-fallback trap from issue #98 is closed. Also keep/adjust one case per form asserting the true no-message fallback still shows the generic string.

## 4. Docs & Ops

- [ ] 4.1 None. No new environment variables, no data migration.
