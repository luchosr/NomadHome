# Tasks: fix-email-verification-gate

## 1. Backend

- [ ] 1.1 In `apps/api/src/controllers/auth.controller.ts` (`becomeHost` catch block, ~line 162), add the stable code `EMAIL_NOT_VERIFIED` to the existing `403` response so the body becomes `{ error: "EMAIL_NOT_VERIFIED", message: t("identity.become_host.email_not_verified") }`, matching the `{ error: <STABLE_CODE>, message: t(...) }` convention already used for `SELF_BOOKING_NOT_ALLOWED` in `booking.controller.ts`.
- [ ] 1.2 In `apps/api/src/services/booking.service.ts`, add an `emailVerifiedAt` check as the **first** precondition in `BookingService.create` (before the `checkIn < today` check), fetching the guest via `this.users.findById(guestId)` (already injected). Reuse `EmailNotVerifiedError` from `apps/api/src/services/auth.service.ts` (export it if not already exported) rather than defining a duplicate error class, since it already carries the exact semantics needed here.
- [ ] 1.3 In `apps/api/src/controllers/booking.controller.ts` (`mapError`), add a branch for `EmailNotVerifiedError` mapping to `res.status(403).json({ error: "EMAIL_NOT_VERIFIED", message: t("booking.error.email_not_verified") })`, placed before the other precondition checks to mirror the service's check order.
- [ ] 1.4 Add the new string key `booking.error.email_not_verified` to `packages/shared/src/strings/en.ts` under the existing `booking.error` block (alongside `not_found`, `listing_not_found`, `self_booking`). Reuse the existing wording style of `identity.become_host.email_not_verified` ("Please verify your email address before …") adapted to booking.
- [ ] 1.5 Considered and declined: a shared error-code constants file in `packages/shared` (e.g. `ERROR_CODES.EMAIL_NOT_VERIFIED`). Existing stable codes (`SELF_BOOKING_NOT_ALLOWED`, `OVERLAP_CONFLICT`, `CHECKIN_ALREADY_PASSED`, `BOOKING_NOT_CANCELLABLE`) are inline string literals with no existing centralization in this codebase — introducing one now for a single new code would be a scope-creep refactor unrelated to this fix. Follow the existing inline-literal convention instead.

## 2. Frontend

- [ ] 2.1 In `apps/web/src/pages/BecomeHostPage.tsx` (`onSubmit` catch block, lines 28-34), add a branch: when `err instanceof ApiError && err.status === 403`, read `(err.body as { error?: string })?.error`, and if it is `"EMAIL_NOT_VERIFIED"`, call `setServerError(t("identity.become_host.email_not_verified"))` instead of falling through to `t("error.generic.unexpected")`. Keep the existing `409` branch unchanged.
- [ ] 2.2 In `apps/web/src/pages/BookingFormPage.tsx` (`onSubmit` catch block, lines 94-105), add a branch: when `err instanceof ApiError && err.status === 403`, read `(err.body as { error?: string })?.error`, and if it is `"EMAIL_NOT_VERIFIED"`, call `setServerError(t("booking.error.email_not_verified"))`. Keep the existing `422` branch (`BOOKING_OVERLAP` / `SELF_BOOKING`) unchanged — those literal codes are a pre-existing, unrelated mismatch with the actual backend codes (`OVERLAP_CONFLICT` / `SELF_BOOKING_NOT_ALLOWED`) and are out of scope for this fix.

## 3. Tests

- [ ] 3.1 In `apps/api/src/become-host.test.ts`, add a test "rejects onboarding for an unverified email with 403 EMAIL_NOT_VERIFIED": register a user directly via `prisma.user.create` with `emailVerifiedAt: null` (a variant of the existing `registerAndLogin` helper, or a new `registerUnverifiedAndLogin` helper), log in, submit the onboarding form, and assert `res.status === 403` and `res.body.error === "EMAIL_NOT_VERIFIED"`.
- [ ] 3.2 In `apps/api/src/booking.test.ts`, add a test "returns 403 EMAIL_NOT_VERIFIED when guest email is not verified": extend the local `createUser` helper with an `emailVerified?: boolean` option (default `true`, preserving all existing call sites), create a guest with `emailVerified: false`, attempt `POST /bookings` against a published listing, and assert `res.status === 403` and `res.body.error === "EMAIL_NOT_VERIFIED"`.
- [ ] 3.3 Add/extend `apps/web/src/pages/BecomeHostPage.test.tsx` (create the file if it doesn't exist, following the pattern in `apps/web/src/pages/BookingFormPage.test.tsx`) with a case asserting that a `403 EMAIL_NOT_VERIFIED` `ApiError` renders the verification message.
- [ ] 3.4 Extend `apps/web/src/pages/BookingFormPage.test.tsx` with a case mirroring the existing `"shows overlap error when create throws ApiError 422 BOOKING_OVERLAP"` test: `mockCreate.mockRejectedValue(new ApiError(403, { error: "EMAIL_NOT_VERIFIED" }))`, asserting the verification message renders.
- [ ] 3.5 Checked `apps/web/e2e/us-1.3-become-host.spec.ts` and `apps/web/e2e/us-4.1-booking.spec.ts`: neither currently covers any error path (no existing assertions on `409`, `422`, or error messages), so no new Playwright spec is added — the Vitest coverage in 3.1-3.4 is the acceptance-level test for this change, consistent with existing test coverage patterns for sibling error codes in this codebase.

## 4. Docs & Ops

- [ ] 4.1 None. No new environment variables, no data migration (see proposal.md "Migration required: No").
