# Proposal: a11y-rating-terms-moderation

## Why

NH-146 (GitHub issue #146, group 1: accessibility) lists three gaps:

1. The review dialog builds its star button names from a hand-written English template, bypassing the `t()` helper.
2. The Become host terms error is not programmatically linked to its checkbox, so assistive technology does not announce it with the control.
3. No end-to-end test proves that the admin Disable and Re-enable actions work with Enter and Space.

## What Changes

- Review dialog star names are composed from the number plus new keys `booking.ui.star_one` and `booking.ui.star_other`. Names and visible copy are unchanged.
- The Become host terms checkbox gets `aria-invalid` and, only while the error exists, `aria-describedby` pointing to the error element.
- New Playwright cases press Enter and Space on Disable and Re-enable for users and listings. No production change is expected for the admin pages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform`: adds the star-name and terms-linking requirements; modifies "Modal is a keyboard-operable modal dialog", which currently forbids any new `t()` key in the dialogs.
- `admin`: adds a keyboard-operability requirement for moderation actions.

## Impact

- **Code**: `packages/shared/src/strings/en.ts`, `apps/web/src/components/ReviewModal.tsx`, `apps/web/src/pages/BecomeHostPage.tsx`, tests, e2e and `apps/web/DESIGN.md`.
- **Breaking changes**: no.
- **Migration required**: no.
- **Out of scope**: interpolation or plural support in `t()`; any i18n library; linking the display name and payout email errors on Become host; focus management after a moderation action; per-row accessible names.

## Decisions

- `t(key)` accepts only a key and returns the raw string: no interpolation, no plural rules. The name is composed as number plus word with two `_one` / `_other` keys, the same convention as `search.summary_result_*` and `home.hero.stay_unit_*`.
- The keys live in `booking.ui`, where the existing "Booking and payment restyle changes no behavior" requirement already allows new keys, so that requirement needs no change.
- Each key is read by its own literal `t("...")` call, so the source-scanning copy guards see both.
- The terms link reuses `errorIdFor("acceptedTerms")` from the shared form field, matching the login, register and create-listing forms. The checkbox is not wrapped in `FormField`.

## Risks & Mitigations

| Risk                                                        | Likelihood | Mitigation                                                                    |
| ----------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Copy guard tests fail on the new keys                       | Certain    | Update `ModalCopy.test.ts` and `BookingCopy.test.ts` first, as the red step   |
| The pending-disabled moderation button drops keyboard focus | Likely     | Record the observed behaviour in the e2e task; fixing it is a separate ticket |
| A keyboard test exposes a real defect                       | Low        | Stop and report; no production change inside this change                      |

## Rollout

Single pull request, no feature flag.
