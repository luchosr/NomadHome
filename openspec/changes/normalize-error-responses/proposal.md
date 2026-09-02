# Proposal: normalize-error-responses

## Why

GitHub issue #98: five guest-facing forms (`BecomeHostPage.tsx`, `BookingFormPage.tsx`, `LoginPage.tsx`, `ReviewModal.tsx`, `CancelBookingModal.tsx`) each catch API errors by branching on one or two specific HTTP status codes, falling through to a generic `error.generic.unexpected` message for everything else. This is why the become-host 403 (issue #84) shipped invisible to users, and it will keep happening for any future error the frontend hasn't special-cased.

The root cause is on the backend: error response shape is inconsistent across controllers. Three conventions coexist today:
- `{ error: t(...) }` — the human message travels *as* the `error` field, no stable code
- `{ error: "CODE" }` — a stable code with no `message` at all
- `{ error: "CODE", message: t(...) }` — the correct pattern, already used where earlier tickets (#84, booking cancellation) fixed specific cases

Because of this inconsistency, the frontend can't simply "show `message` if present, else generic" today — for the second group that would leak raw codes like `unauthorized` to users. An audit of every 4xx/5xx response in `auth.controller.ts`, `booking.controller.ts`, and `review.controller.ts` reachable by the 5 forms above found 7 straggler sites not yet on the `{error, message}` convention.

## What

- Normalize 7 backend response sites to `{ error: STABLE_CODE, message: t(...) }`:
  - `auth.controller.ts` login 401 (`INVALID_CREDENTIALS`), become-host 409 (`ALREADY_HOST`)
  - `booking.controller.ts`'s `mapError`: `BookingNotFoundError` 404 (`BOOKING_NOT_FOUND`), `ListingNotAvailableError` 404 (`LISTING_NOT_AVAILABLE`), `BookingOverlapError` 409 (add `message` alongside the existing `OVERLAP_CONFLICT` code and `conflict` payload), `NoFeeConfigError` 500 (`NO_FEE_CONFIG`)
  - `review.controller.ts` `ReviewNotFoundError` 404 (`BOOKING_NOT_FOUND`)
- Add a shared frontend helper (`apps/web/src/api/client.ts`) that extracts `body.message` from an `ApiError`, falling back to `t("error.generic.unexpected")` only when no `message` is present.
- Replace the 5 forms' per-status-code branches with that shared helper — each becomes a single `setError(getDisplayMessage(err))` in the catch block, no per-code branching. Endpoint-specific behavior that isn't just message selection (e.g. `auth.tsx`'s 401/403 logout interceptor, `ListingDetailPage.tsx`'s 404-based query-retry logic) is untouched — those aren't part of this pattern.

## Impact

- **Capabilities affected**: `identity` (login, become-host response shape), `booking` (mapError response shape), `reviews` (review-creation response shape).
- **Breaking changes**: No. `error` field keeps carrying a value on every response (either the same string as before, or now a stable code) — no consumer currently depends on `error` being human-readable text for these 7 sites (this ticket is what makes it safe to add the `message` field they were missing).
- **Migration required**: No.
- **Out of scope**: The ~48 other error-response sites across the API not reachable by these 5 forms (listing CRUD, admin moderation, availability, photos, payments, search, stripe webhooks) — normalizing those is real follow-up work but not driven by an observed bug, unlike these 7. `auth.tsx`'s interceptor and `ListingDetailPage.tsx`'s retry-on-404 logic, which use status codes for behavior, not message selection. Also out of scope: the `BookingFormPage.tsx` price-preview bug mentioned alongside this finding — already fixed in #92, not reproducible in current code.

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Removing a form's specific status-code branch changes user-visible message wording if the corresponding backend `message` string differs from what the frontend used to show. | Low | The backend already owns the canonical wording via `t(...)`; frontend branches were duplicating (and risking drifting from) that same text. Tests assert the exact expected message text per scenario. |
| A future error site is added to one of the 3 touched controllers without the `{error, message}` shape, silently reintroducing the bug class. | Medium | Out of scope to enforce structurally in this ticket (e.g. a lint rule or shared response-builder) — flagged as a candidate follow-up, not blocking this fix. |

## Rollout

Big bang, no flag — bug fix restoring error visibility, not new user-facing functionality.
