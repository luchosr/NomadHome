## ADDED Requirements

### Requirement: Modal is a keyboard-operable modal dialog

`Modal` SHALL render a native `<dialog>` opened with `showModal()` so that it behaves as a real modal dialog, and it MUST take a required `onClose` prop. On open, focus MUST move inside the dialog to the control marked `autoFocus` (the reason textarea in the cancel dialog, the first star button in the review dialog), and Tab and Shift+Tab MUST stay inside the dialog while the rest of the page is inert to keyboard and assistive technology. Escape and a click on the backdrop MUST call `onClose`, a click inside the dialog surface MUST NOT, and the native Escape close MUST be prevented so that React state stays the single source of truth. While the dialog is mounted, scrolling of the page behind it MUST be locked by setting `overflow: hidden` on `document.body`, and the previous inline value MUST be restored (not cleared) on unmount. On unmount, focus MUST return to the element that was focused before the dialog opened when that element is still connected to the document. The dialog MUST keep `aria-modal="true"` and `aria-labelledby`, the surface MUST stay the first element child of the dialog, and the backdrop MUST be a flat `ink/40` scrim with `backdrop-filter: none`. The change MUST NOT add, remove or rename any `t()` key or change any copy, and the layout at 360 px MUST be unchanged (no horizontal overflow, same surface width and gutter).

#### Scenario: Opening moves focus inside

- **GIVEN** a page with an opener button that has focus
- **WHEN** the cancel dialog opens, and separately when the review dialog opens
- **THEN** the dialog is open as a modal and `document.activeElement` is inside it
- **AND** that element is the reason textarea in the cancel dialog and the first star button in the review dialog

#### Scenario: Tab stays inside and the background is inert

- **GIVEN** an open dialog in a real browser
- **WHEN** the user presses Tab repeatedly and then Shift+Tab repeatedly
- **THEN** focus cycles only among the controls inside the dialog
- **AND** the content behind the dialog is not reachable by keyboard and is inert

#### Scenario: Escape closes through onClose

- **GIVEN** an open dialog that is not pending
- **WHEN** the user presses Escape
- **THEN** the `cancel` event is default-prevented and `onClose` is called exactly once
- **AND** the dialog is removed only when the parent unmounts it

#### Scenario: Backdrop click closes, surface click does not

- **GIVEN** an open dialog
- **WHEN** the user clicks the backdrop outside the surface
- **THEN** `onClose` is called once
- **AND** a click on any element inside the surface, or a drag that starts inside the surface and ends on the backdrop, does not call `onClose`

#### Scenario: Body scroll is locked and restored

- **GIVEN** `document.body.style.overflow` has a value before the dialog opens
- **WHEN** the dialog is mounted and later unmounted
- **THEN** `document.body.style.overflow` is `hidden` while it is mounted and the original value afterwards
- **AND** the page does not scroll behind the dialog while it is open

#### Scenario: Focus returns to the opener

- **GIVEN** the user opened the dialog from a button that is still in the document
- **WHEN** the dialog closes by Escape, backdrop click, Close button or success
- **THEN** focus is on that button

#### Scenario: Close is suppressed while a mutation is pending

- **GIVEN** the cancel or review dialog with a submit in flight
- **WHEN** the user presses Escape or clicks the backdrop
- **THEN** the dialog stays open and the parent `onClose` is not called

#### Scenario: Close works again after a failed submit

- **GIVEN** the cancel or review dialog whose submit failed and shows the error alert
- **WHEN** the user presses Escape or clicks the backdrop
- **THEN** the parent `onClose` is called

#### Scenario: Review success state can be closed

- **GIVEN** the review dialog showing the success message while the delayed close is pending
- **WHEN** the user presses Escape or clicks the backdrop
- **THEN** the parent `onClose` is called

#### Scenario: Review success keeps focus inside and is announced

- **GIVEN** the review dialog whose submit just succeeded and replaced the form with the success message
- **WHEN** the success state renders
- **THEN** the success panel is a `role="status"` live region that is programmatically focusable (`tabindex="-1"`) and holds focus, so focus does not fall back to `<body>`
- **AND** pressing Escape closes the dialog and focus returns to the opener

#### Scenario: A native close while mounted does not leave an invisible dialog

- **GIVEN** an open dialog that the browser closes natively (for example a second Escape that Chromium delivers as a non-cancelable `cancel`) while the component is still mounted
- **WHEN** the native `close` event fires
- **THEN** the dialog is opened again with `showModal()`, the page stays inert and the body scroll lock stays in place
- **AND** a close caused by the component unmounting is not reopened

#### Scenario: Layout at 360 px and copy are unchanged

- **GIVEN** the cancel and review dialogs open at 360 px width
- **WHEN** the surface and the document are measured
- **THEN** the surface keeps its 2px ink edge, 4px radius, no shadow and the same width and side gutter as before, and the document scroll width does not exceed the viewport width
- **AND** the backdrop computed `backdrop-filter` is `none` and no `t()` key or string value differs from before this change

### Requirement: Modal side effects are cleaned up and degrade safely

Modal consumers and `Modal` SHALL leave no stale side effect after a dialog closes, and the following points MUST hold. The review dialog's delayed `onSuccess` timer (1200 ms) MUST be cleared when the dialog unmounts, so that closing early by Escape or backdrop does not fire `onSuccess` on a dialog that is gone, and `onSuccess` handling in `MyBookingsPage` MUST remain idempotent (it only clears the modal state and invalidates the bookings query). When the opener is no longer connected on close (for example the row button was removed by a refetch after a successful cancel), `Modal` MUST NOT throw and MUST NOT focus a detached element, and focus is left to the browser. The scrollbar-width shift that `overflow: hidden` can cause on desktop is an accepted limitation and MUST NOT block this change; if the 1440 px verification screenshot shows a visible content jump, the change MUST compensate with a stable layout (for example `scrollbar-gutter: stable` on the root or padding equal to the scrollbar width) in the same change, otherwise it is recorded as accepted in the verification report.

#### Scenario: Early close clears the review timer

- **GIVEN** the review dialog in its success state with the 1200 ms timer pending
- **WHEN** the user presses Escape and the dialog unmounts before the timer elapses
- **THEN** `onSuccess` is not called after the unmount
- **AND** with fake timers, advancing the clock by 1200 ms after the unmount calls neither `onSuccess` nor any state setter on the unmounted component

#### Scenario: Timer still fires when the dialog stays open

- **GIVEN** the review dialog in its success state and left open
- **WHEN** 1200 ms elapse
- **THEN** `onSuccess` is called exactly once

#### Scenario: Opener removed before close

- **GIVEN** a dialog opened from a button that is removed from the document before the dialog closes
- **WHEN** the dialog unmounts
- **THEN** no error is thrown, focus is not moved to the detached element and the page remains usable

#### Scenario: Scrollbar jump is handled or accepted

- **GIVEN** the cancel dialog open on a desktop viewport of 1440 px with a page that scrolls
- **WHEN** the verification screenshots with and without the dialog are compared
- **THEN** either the page content does not shift horizontally or the verification report records the shift as accepted, and no other behaviour of the page changes

## MODIFIED Requirements

### Requirement: Booking modals and empty state use the identity

`Modal` SHALL render without a shadow, with a 2px ink edge, a radius of at most
4px and a flat backdrop with no blur, and MUST keep its existing roles,
`aria-modal` and labelling. Its keyboard and focus behaviour (focus management,
containment, Escape, backdrop close and scroll lock) is defined by the requirement
"Modal is a keyboard-operable modal dialog". The cancel
and review dialogs MUST render their textarea with a 2px ink edge and a bold
label, show their error through the shared form-level error alert, and use the
two-layer focus ring, and their secondary buttons MUST use the plain `Button`
variant with no `FLAT_SECONDARY` override. The review rating MUST use a drawn star
glyph that is filled or outlined by selection, is `aria-hidden`, and keeps the
button accessible names ("1 star" to "5 stars") and `aria-pressed`; unicode star
characters MUST NOT be used. The review success message MUST render in a flat
panel and MUST keep the existing delayed close. `EmptyState` MUST render flat
with a 2px dashed ink edge and no radius above 4px, keeping its message, props
and optional link, and its optional link MUST be a single anchor styled with
`buttonVariants` with no `button` nested inside.

#### Scenario: Modal frame is flat

- **GIVEN** the cancel or review dialog is open
- **WHEN** the dialog surface is inspected
- **THEN** it has a 2px ink border, no box shadow, a radius of at most 4px and a backdrop with no blur
- **AND** its role is `dialog`, `aria-modal` is `true` and it is labelled by its title as before

#### Scenario: Dialog form controls

- **GIVEN** the cancel dialog and the review dialog
- **WHEN** their textareas and labels are inspected
- **THEN** each textarea has a 2px ink border and each label is bold ink
- **AND** a failed submit shows exactly one `role="alert"` with the same message, a solid danger edge and a decorative tile

#### Scenario: Stars are drawn and keep their names

- **GIVEN** the review dialog
- **WHEN** the rating buttons are listed
- **THEN** five buttons are named "1 star", "2 stars", "3 stars", "4 stars" and "5 stars" and each contains an `aria-hidden` SVG and no `★` or `☆` character
- **AND** selecting "4 stars" sets `aria-pressed` on that button and fills four glyphs while the fifth stays an outline

#### Scenario: Empty state link is a single anchor

- **GIVEN** an `EmptyState` rendered with a link
- **WHEN** it is queried
- **THEN** exactly one `link` with the same name and `href` is present, there is no `button` and `container.querySelector("a button")` is null

### Requirement: Booking and payment restyle changes no behavior

The restyle of the booking and payment screens SHALL NOT change routes, API
calls, query keys, retry behaviour, request payloads, the checkout redirect,
the payment sync and polling interval and timeout, status logic, the cancellable
rule, the set of `t()` keys, the text of any existing string or the API client.
No data, schema or backend file MUST change. The modal accessibility gaps (focus
trap, initial focus and restore, ESC, backdrop close, scroll lock) are closed by
the requirement "Modal is a keyboard-operable modal dialog" and MUST NOT be
recorded as open follow-ups.

#### Scenario: Payment and booking behavior is unchanged

- **GIVEN** a guest on the booking form with valid dates
- **WHEN** they press Pay now
- **THEN** the booking is created, checkout is requested and the browser is sent to the returned URL, with the same payloads as before
- **AND** the success page polls and syncs on the same interval and timeout as before

#### Scenario: Dictionary is unchanged

- **GIVEN** the English dictionary before and after this change
- **WHEN** the `booking.ui`, `booking.dashboard`, `listings.error.not_found`, `error.generic.unexpected`, `common.loading`, `common.submitting` and `common.action.close` keys are compared
- **THEN** their keys and values are identical

#### Scenario: No backend, client or shared change

- **GIVEN** the change diff against `origin/main`
- **WHEN** the changed paths are listed
- **THEN** none is under `apps/api/`, `packages/db/`, `packages/shared/` or `apps/web/src/api/`

#### Scenario: Follow-ups are recorded

- **GIVEN** the change design and the pull request description
- **WHEN** they are read
- **THEN** they list the copy defects and the `Badge` pill follow-ups
- **AND** the nested link and button issue is closed by the single-anchor requirement and the modal accessibility gaps are closed by the modal dialog requirement, and neither is listed as open
