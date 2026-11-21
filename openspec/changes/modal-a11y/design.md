# Design: modal-a11y

Ticket NH-146 (#146, a checklist; this change covers the modal items and uses
"Refs #146", never "closes"). Follow-up recorded by `booking-payment-identity`
(NH-124) and `host-identity` (NH-122). Scope is `apps/web` only: no `apps/api`,
route, query, mutation, `t()` key or copy change, no new dependency, no palette
or `globals.css` change. Visual output is unchanged; behaviour gains focus
management, Escape, backdrop close and scroll lock.

## Files in scope

| File                                                             | Change                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `apps/web/src/components/Modal.tsx`                              | Native `<dialog>`, `showModal()`, `onClose`, cancel, backdrop, scroll, focus     |
| `apps/web/src/components/CancelBookingModal.tsx`                 | Pass guarded `onClose`; `autoFocus` on the textarea                              |
| `apps/web/src/components/ReviewModal.tsx`                        | Pass guarded `onClose`; `autoFocus` on the first star; success allows close      |
| `apps/web/src/test/setup.ts`                                     | jsdom stub for `HTMLDialogElement.showModal` and `close`                         |
| `apps/web/src/components/Modal.test.tsx` (new), consumers' tests | Escape, backdrop, pending guard, scroll lock, focus return, initial focus        |
| `apps/web/e2e/booking-payment-identity.spec.ts` (and a11y spec)  | Tab loop, `inert` background, `::backdrop`, Escape, focus return                 |
| `openspec/specs/platform/spec.md` (via delta spec at Gate 2)     | "Booking modals and empty state use the identity" and the follow-up sentences    |
| `apps/web/DESIGN.md`                                             | "Modal frame" (~l.285): drop "no focus trap, ESC, backdrop close or scroll lock" |
| `openspec/changes/modal-a11y/reports/*`                          | Verification reports and screenshots                                             |

Read but **not** changed: `MyBookingsPage.tsx` (conditional render and
`onClose` setters stay), `ServerErrorAlert`, `globals.css`, `packages/ui`,
`en.ts`, `apps/api`.

## D1. Native `<dialog>` with `showModal()`

`Modal` renders `<dialog ref aria-modal="true" aria-labelledby>` and calls
`ref.current.showModal()` in an effect on mount. The browser supplies the top
layer, `::backdrop`, `inert` on everything outside, the Tab loop and a built-in
Escape request, which cover focus containment without custom code.

| Option                                     | Verdict  | Why                                                                                                                               |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Native `<dialog>` + `showModal()` (chosen) | Chosen   | Zero dependency; browser owns trap, inert and top layer; implicit `dialog` role                                                   |
| Manual focus trap on the existing `div`    | Rejected | ~60 lines of keydown and tabbable-query code with edge cases (shadow, hidden, dynamic controls); background stays reachable by AT |
| `@radix-ui/react-dialog`                   | Rejected | New dependency for two modals; not installed                                                                                      |

## D2. Escape through the `cancel` event

The `cancel` event fires on Escape. The handler calls `preventDefault()` (the
dialog stays open) and then `onClose()`. React state remains the single source
of truth: the parent unmounts the modal, which closes it. This also makes the
pending guard (D7) trivial, because a noop `onClose` leaves the dialog open.
Without `preventDefault()` the browser would close the element behind React's
back and the `close` state would diverge.

## D3. Backdrop click: `e.target === e.currentTarget`

The `<dialog>` is shrink-wrapped with `p-0` around the surface, and the
`::backdrop` is part of the dialog's hit target, so a click on the backdrop has
`target === currentTarget` while a click inside the surface has a descendant as
target. The `onClick` handler closes only on that equality. Styling:
`backdrop:bg-ink/40`, flat, `backdrop-filter: none` (no blur), as the spec
requires. Padding on the dialog is rejected because padding clicks would also
match `currentTarget` and make dead zones close the modal.

## D4. Surface stays the first element child; ARIA kept explicit

The existing e2e helper locates the surface with `dialog.locator(":scope > *").first()`
and asserts a 2px ink edge, 4px radius and no shadow on it, so the surface
`div` (`mx-4` removed; `w-full max-w-md rounded-card border-2 border-border
bg-surface-raised p-6`) remains the single first child. `aria-modal="true"` and
`aria-labelledby` stay explicit: they are asserted today, and the implicit
`aria-modal` of `showModal()` is not exposed uniformly.

## D5. UA default styles must not shift layout

`<dialog>` ships UA styles (margin auto, padding, border, background, `max-width`
and `max-height` calc, `color`). Resets: `p-0`, `border-0`, `bg-transparent`,
`text-inherit` (as needed), and `max-w-[calc(100%-2rem)]` on the dialog to
replace the old `mx-4` gutter at 360px; the surface keeps `w-full max-w-md`.
Centring comes from the UA `margin: auto` in the top layer, so no flex wrapper
is needed. Visual diff at 1440 and 360 px is mandatory in the verification
report, for both dialogs.

## D6. Manual scroll lock and focus return

- **Scroll lock.** On mount store `previous = document.body.style.overflow`, set
  `hidden`; the cleanup restores `previous` (not `""`), so a nested or
  pre-locked body is not clobbered. No scrollbar-gutter compensation (open point).
- **Focus return.** Before `showModal()`, store `document.activeElement` as
  `opener`. On unmount, if `opener instanceof HTMLElement && opener.isConnected`,
  call `opener.focus()`. `MyBookingsPage` renders the modal conditionally, so the
  effect cleanup is the single place both paths (close and success) go through.
  When the opener is gone (a successful cancel refetches the list and may remove
  or re-render the row button), focus is left to the browser (Risks, open points).

## D7. Consumers guard `onClose` while pending

`CancelBookingModal` and `ReviewModal` pass `onClose={isSubmitting ? noop :
onClose}` to `Modal`. While the request is in flight Escape and backdrop are
blocked (the Close button is already `disabled`), which prevents closing a modal
whose mutation then resolves into an unmounted tree. After a failed submit
`isSubmitting` is false again and close is allowed. In `ReviewModal`, once
`success` is set (the 1200ms delayed `onSuccess`) Escape and backdrop close are
allowed: the review is already saved and closing early is harmless; the pending
timer still calls `onSuccess` (D9 notes the cleanup question). `MyBookingsPage`
is unchanged.

## D8. Initial focus with `autoFocus`

`showModal()` focuses the first focusable descendant unless an element has
`autofocus`. Declare it explicitly so the choice does not depend on DOM order:
the `textarea#cancel-reason` in `CancelBookingModal` (the destructive button
must not be the default target), the first star button in `ReviewModal`. React
calls `.focus()` for `autoFocus` on mount, before or after `showModal()`
depending on effect order, so the unit test asserts `document.activeElement`
after render and the e2e asserts it in a real browser. No new copy or `t()` key.

## D9. Tests

- **Setup.** `apps/web/src/test/setup.ts` stubs
  `HTMLDialogElement.prototype.showModal` (sets `open`) and `close` (clears
  `open`, fires `close`) because jsdom does not implement them.
- **Unit (red first).** `Modal`: `showModal` called on mount; `cancel` event
  calls `onClose` and is default-prevented; click on the dialog calls `onClose`,
  click inside the surface does not; body overflow is `hidden` while mounted and
  the previous value is restored on unmount; focus returns to the opener on
  unmount. Consumers: Escape and backdrop are no-ops while pending, work after a
  failed submit, and work in the Review success state; `autoFocus` target is
  focused.
- **E2E (Playwright, mocked API).** Tab and Shift+Tab loop inside the dialog;
  background is `inert` (not reachable); Escape and backdrop click close; focus
  returns to the opener; page does not scroll behind the dialog; `::backdrop` is
  flat with no blur; existing identity assertions (2px edge, 4px radius,
  `backdrop-filter: none`, surface as first child) still pass at 1440 and 360.
- **Gate.** `pnpm` typecheck, lint, unit and e2e for `apps/web`, plus `node
scripts/check-mvp-scope.mjs` and `openspec validate modal-a11y --strict`.

## D10. Docs and spec

At Gate 2 a delta spec MODIFIES "Booking modals and empty state use the
identity" (today it says restyling MUST NOT claim focus trap, initial focus or
restore, ESC, backdrop close or scroll lock) and narrows the follow-up sentences
in the two "restyle changes no behavior" requirements. `apps/web/DESIGN.md`
"Modal frame" (~l.285) is rewritten to describe the native dialog. Verify the
current line numbers then.

## D11. No other behaviour change

Routes, API calls, queries, handlers, accessible names, visible strings, tab
order inside the dialog (apart from containment) and `disabled` conditions are
unchanged. No `t()` key is added.

## Contrast

No colour pairing changes: the scrim stays `ink/40` and the surface tokens are
untouched. No contrast table is needed; the existing token tests stay green.

## Risks

| Risk                                                                 | Mitigation                                                                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| jsdom cannot verify Tab loop, `inert` or `::backdrop`                | The stub only enables unit behaviour; e2e in a real browser owns those assertions (D9)                     |
| UA `<dialog>` styles shift layout at 360px                           | Resets and `max-w-[calc(100%-2rem)]` (D5); screenshots at 1440 and 360 px in the report                    |
| Focus return when the opener unmounts                                | Restore only if connected (D6); documented fallback to browser default; e2e covers the cancel-success path |
| Escape or backdrop mid-request                                       | Noop `onClose` while pending (D7); unit tests                                                              |
| `autoFocus` and `showModal()` order differ across React and browsers | Assert `activeElement` in unit and e2e (D8)                                                                |
| Backdrop click misfires after a drag that starts inside the surface  | Plain `click` with the `target === currentTarget` guard (D3); e2e covers drag-out                          |
| Tests or screenshots pin the old `div` structure                     | Helper selectors keep working (D4); update any `.fixed` or overlay selectors in the same PR                |

## Open points

None blocking. Recorded for the PR description:

- **Scrollbar jump.** Setting `overflow: hidden` removes the page scrollbar and
  may shift layout on desktop; compensating with `scrollbar-gutter` or padding
  is deferred unless the 1440 px screenshot shows a visible jump.
- **Focus return when the opener unmounts.** After a successful cancel the list
  refetches; if the opener is gone, focus lands on `body`. Moving it to a
  stable heading is a possible follow-up.
- **Review success timer.** The 1200ms `setTimeout(onSuccess)` is not cleared on
  unmount; closing early via Escape lets it fire once on an unmounted modal.
  Confirm `handleModalSuccess` is idempotent, or clear the timer, at Gate 2.
- **Rest of #146.** Items other than the modal remain open; the issue stays open.
