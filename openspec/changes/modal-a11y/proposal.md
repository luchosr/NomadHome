# Proposal: modal-a11y

## Why

`Modal` (`apps/web/src/components/Modal.tsx`) is a `<div role="dialog"
aria-modal="true">` inside a `fixed inset-0` overlay. The attribute announces a
modal, but nothing behaves like one. The identity restyles (`booking-payment-identity`
NH-124, `host-identity` NH-122) recorded this gap and deferred it as a follow-up
(platform spec, "Booking and payment restyle changes no behavior" and "Host
restyle changes no behavior"). Today:

- **Focus is not managed.** Opening `CancelBookingModal` or `ReviewModal` leaves
  focus on the opener behind the scrim; Tab walks the page underneath, which is
  still reachable by keyboard and screen readers despite `aria-modal`.
- **Escape does nothing**, and clicking the backdrop does nothing. The only exit
  is the Close button.
- **The page scrolls behind the dialog.**
- **Focus is lost on close.** The dialog unmounts and focus falls back to `body`.

Ticket NH-146 (GitHub issue #146) is a checklist of accessibility items. This
change addresses the modal items only. Refs #146; it MUST NOT close #146.

## What Changes

`Modal` becomes a native `<dialog>` opened with `showModal()`. The browser then
provides the top layer, `::backdrop`, `inert` on the rest of the page, the Tab
loop and Escape handling. No dependency is added.

- **`Modal` API.** New required prop `onClose: () => void`. Existing props
  (`labelledBy`, `children`) are unchanged.
- **Open and close.** `showModal()` on mount; the element is removed on unmount
  by the consumers, as today (conditional render).
- **Escape.** Handled through the `cancel` event: `preventDefault()` then
  `onClose()`, so React state stays the single source of truth.
- **Backdrop click.** Closes only when `e.target === e.currentTarget` (a click on
  the `<dialog>` box itself, which is the backdrop area because the dialog is
  shrink-wrapped with `p-0`). Clicks inside the surface never close. The backdrop
  is `backdrop:bg-ink/40`, flat, `backdrop-filter: none`.
- **Surface.** Stays the first element child of the dialog (the e2e helper uses
  `dialog.locator(":scope > *").first()`), keeping `w-full max-w-md`, the 2px
  edge, 4px radius and `p-6`. The `<dialog>` adds `max-w-[calc(100%-2rem)]` so UA
  defaults do not shift layout at 360px.
- **ARIA.** Explicit `aria-modal="true"` and `aria-labelledby` are kept
  (assertions and older assistive tech rely on them).
- **Scroll lock.** Manual: set `document.body.style.overflow = "hidden"` on mount
  and restore the previous value on cleanup.
- **Focus return.** Record `document.activeElement` before `showModal()` and
  restore focus to it on unmount (if still connected).
- **Initial focus.** `autoFocus` on the first control: the textarea in
  `CancelBookingModal`, the first star in `ReviewModal`.
- **Consumers.**
  - `CancelBookingModal` and `ReviewModal` pass a noop `onClose` to `Modal` while
    their mutation is pending (Escape and backdrop are blocked; the Close button
    is already disabled) and the real `onClose` again after a failed submit.
  - `ReviewModal` success state (the 1200ms delayed `onSuccess`) allows Escape
    and backdrop close.
  - `MyBookingsPage` is unchanged.
- **Test setup.** `apps/web/src/test/setup.ts` gains a jsdom stub for
  `HTMLDialogElement.prototype.showModal` and `close` (jsdom does not implement
  them).
- **Docs (updated with the implementation, not in this gate).** Platform spec
  requirement "Booking modals and empty state use the identity" (currently
  `openspec/specs/platform/spec.md` l.1024-1040, plus the follow-up sentences at
  ~l.1129 and ~l.1540; verify locations at Gate 2) and `apps/web/DESIGN.md` ~l.285
  ("Modal frame").

**Copy: no `t()` key is added, removed or renamed and no dictionary value
changes.** Contrast: no colour pairing changes (same tokens, same scrim), so
design.md carries no contrast table.

## Impact

- **Capabilities affected**: `platform` (MODIFIED: "Booking modals and empty state
  use the identity", which today forbids claiming focus trap, ESC, backdrop close
  and scroll lock; ADDED: modal accessibility behaviour. The "no behavior change"
  follow-up sentences are narrowed to the remaining items).
- **Breaking changes**: no for users. `Modal` gains a required prop; its only
  consumers are the two booking modals, updated in the same PR.
- **Migration required**: none. No API, schema, route, query or `t()` change.
- **Out of scope**: other #146 checklist items; `apps/api`; any other dialog or
  popover; a general `useModal` hook; palette, token or `globals.css` changes;
  animation of open and close.

## Risks & Mitigations

| Risk                                                                     | Likelihood | Mitigation                                                                                          |
| ------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| UA `<dialog>` default styles shift the surface (margin, padding, border) | Medium     | `p-0`, explicit border and background reset, `max-w-[calc(100%-2rem)]`; 1440 and 360 px screenshots |
| jsdom cannot verify Tab loop, `inert` or `::backdrop`                    | Known      | Unit tests cover Escape, backdrop click, scroll lock, focus return; Playwright e2e covers the rest  |
| Focus return target unmounted by the time the modal closes               | Low        | Restore only when the opener `isConnected`; otherwise leave focus to the browser (design D6)        |
| Escape or backdrop closes a modal mid-request                            | Medium     | Noop `onClose` while pending (D7); unit test asserts it                                             |
| Existing e2e and unit tests pin `role="dialog"` on a `div`               | Medium     | `<dialog>` keeps the implicit role and explicit attributes; helper selectors verified in e2e        |
| Backdrop click detection misfires on drag from inside the surface        | Low        | Close on `click` with the `target === currentTarget` guard only (D3)                                |

## Rollout

Single PR; no flag. The PR description links the change-id, says "Refs #146"
(not "closes"), attaches 1440 px and 360 px screenshots of both dialogs and lists
the open points from design.md.
