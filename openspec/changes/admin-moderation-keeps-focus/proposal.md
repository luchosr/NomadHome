# Proposal: admin-moderation-keeps-focus

## Why

Follow-up of NH-146 (GitHub issue #146, group 1). Pressing Enter or Space on an admin Disable or Re-enable button moves focus to `<body>`: the button gets the native `disabled` attribute while the request is pending. Focus stays on `<body>` after success and after failure, so a keyboard user has to tab through the page again (recorded as "Observed focus behaviour" in the archived change `a11y-rating-terms-moderation`).

## What Changes

- `AdminUsersPage` and `AdminListingsPage` mark the pending row button with `aria-disabled` instead of `disabled`. The existing `pendingId` guard in `runAction` already ignores further activations.
- Both pages ignore Enter and Space key repeat on the moderation buttons, so a held key cannot toggle the action back and forth.
- The shared `Button` recipe styles `aria-disabled="true"` like the native disabled state, with a default cursor and no hover or press change.
- Unit and e2e tests cover focus retention in the table and card layouts; `apps/web/DESIGN.md` is updated.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin`: modifies the pending and error feedback requirement; adds focus-retention and key-repeat requirements.
- `platform`: modifies "Shared primitives follow the design system", "Moderation actions are 44px real buttons with a flat secondary edge" and "Admin restyle changes no behavior".

## Impact

- **Code**: `packages/ui/src/components/button.tsx`, `apps/web/src/pages/AdminUsersPage.tsx`, `apps/web/src/pages/AdminListingsPage.tsx`, their tests, two e2e specs and `apps/web/DESIGN.md`.
- **Other consumers**: none restyled. No source file passes `aria-disabled` to `Button` or to an element styled with `buttonVariants`. Native `disabled` consumers keep their classes.
- **Breaking changes**: no.
- **Migration required**: no.
- **Out of scope**: other forms and modals that use native `disabled` while pending; per-row accessible names; announcing the label change; the existing behaviours listed under Risks.

## Decisions

- No manual focus management. `renderAction` returns a `Button` at the same position in both ternary branches with no key, so React keeps the same DOM node across Disable and Re-enable and only updates its props. Rows are keyed by id and both lists are ordered by `createdAt`, so a refetch does not move them. Tests assert the node identity.
- No `aria-disabled:pointer-events-none`. It would not block keyboard focus, but a pointer press would fall through to the cell and move focus to `<body>`. Instead the `aria-disabled:` utilities override the hover and press styles. In Tailwind 3.4 they are emitted after `hover:` and `disabled:` at equal specificity (checked by compiling a probe), and the e2e style checks guard it.
- `disabled:pointer-events-none` stays as is for native disabled.
- Key repeat is cancelled with an `onKeyDown` on the page buttons (`preventDefault` when `event.repeat` and the key is Enter or Space), so no synthetic click fires. It is limited to those two keys so a held Tab still moves focus. The shared `Button` gets no behaviour change.

## Risks & Mitigations

| Risk                                                                                                             | Likelihood | Mitigation                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `aria-disabled` does not block activation, so a missing guard would send duplicate requests                      | Low        | The guard exists; tests assert one request after repeated click, Enter and Space                                            |
| jsdom `toBeEnabled` ignores `aria-disabled`, so current assertions would pass vacuously                          | Certain    | Replace them with attribute assertions in the red step                                                                      |
| Playwright treats `aria-disabled="true"` as disabled, so `click()` waits on a pending button                     | Certain    | Use keyboard presses or a raw mouse click for pending-state cases                                                           |
| Focus stays on a button whose action flips, so a held Enter would toggle it repeatedly                           | Mitigated  | Repeated Enter and Space `keydown` is cancelled; a deliberate second press still acts (accepted, each action is reversible) |
| `pendingId` clears before the refetch resolves, so the old action can briefly be sent again (existing behaviour) | Low        | Not changed here                                                                                                            |
| A failed background refetch replaces the table with the error panel and focus is lost (existing behaviour)       | Low        | Out of scope, stated in the requirement                                                                                     |

## Rollout

Single pull request, no feature flag.
