# platform — Delta for a11y-rating-terms-moderation

## ADDED Requirements

### Requirement: Review star names come from the dictionary

The review dialog SHALL build each rating button's accessible name from the star number and a word read through `t()`: `booking.ui.star_one` ("star") for 1 and `booking.ui.star_other` ("stars") for 2 to 5, joined by one space. The component MUST NOT contain a hand-written English star word. The resulting names MUST be exactly "1 star", "2 stars", "3 stars", "4 stars" and "5 stars". No visible copy MUST change, and no internationalization library or `t()` signature change MUST be introduced.

#### Scenario: Names are unchanged and sourced from the dictionary

- **GIVEN** the review dialog
- **WHEN** the rating buttons are listed
- **THEN** their accessible names are exactly "1 star", "2 stars", "3 stars", "4 stars" and "5 stars"
- **AND** the component source reads `booking.ui.star_one` and `booking.ui.star_other` through `t()`

#### Scenario: Dictionary holds the two words

- **GIVEN** the English dictionary
- **WHEN** `booking.ui.star_one` and `booking.ui.star_other` are resolved
- **THEN** they are "star" and "stars"

### Requirement: Become host field errors are linked to their controls

On the Become host page the display name input, the payout email input and the terms checkbox SHALL expose their validation state with the same convention as the login and register fields. While a control's error is shown, that control MUST have `aria-invalid="true"` and an `aria-describedby` that references the id of the element holding its own error text, using the shared field error id for `displayName`, `payoutEmail` and `acceptedTerms`. While a control shows no error, it MUST NOT have `aria-describedby` and MUST NOT have `aria-invalid="true"`. The error texts, their look, the absence of a role on them, the validation rules and the submitted payload MUST NOT change.

#### Scenario: Display name and payout email errors are linked

- **GIVEN** the Become host form with the display name and payout email left empty
- **WHEN** the form is submitted
- **THEN** each of the two inputs has `aria-invalid="true"`
- **AND** each input's `aria-describedby` references the element that holds that input's own error text
- **AND** neither error element has a `role` and no request is sent

#### Scenario: Terms error is linked to the checkbox

- **GIVEN** the Become host form with the other fields valid and the terms not accepted
- **WHEN** the form is submitted
- **THEN** the checkbox has `aria-invalid="true"`
- **AND** its `aria-describedby` references the element that holds the existing terms error text
- **AND** that element has no `role` and no request is sent

#### Scenario: No link while there is no error

- **GIVEN** the Become host form before any submit
- **WHEN** the two inputs and the checkbox are inspected
- **THEN** none has `aria-describedby` and none has `aria-invalid="true"`

#### Scenario: Link is removed when the error clears

- **GIVEN** the three errors are shown
- **WHEN** the user corrects a field (or checks the terms checkbox) and its error clears
- **THEN** that control has no `aria-describedby` and `aria-invalid` is not `true`

## MODIFIED Requirements

### Requirement: Modal is a keyboard-operable modal dialog

`Modal` SHALL render a native `<dialog>` opened with `showModal()` so that it behaves as a real modal dialog, and it MUST take a required `onClose` prop. On open, focus MUST move inside the dialog to the control marked `data-autofocus` (the reason textarea in the cancel dialog, the first star button in the review dialog), and Tab and Shift+Tab MUST stay inside the dialog while the rest of the page is inert to keyboard and assistive technology. Escape and a click on the backdrop MUST call `onClose`, a click inside the dialog surface MUST NOT, and the native Escape close MUST be prevented so that React state stays the single source of truth. While the dialog is mounted, scrolling of the page behind it MUST be locked by setting `overflow: hidden` on `document.body`, and the previous inline value MUST be restored (not cleared) on unmount. On unmount, focus MUST return to the element that was focused before the dialog opened when that element is still connected to the document. The dialog MUST keep `aria-modal="true"` and `aria-labelledby`, the surface MUST stay the first element child of the dialog, and the backdrop MUST be a flat `ink/40` scrim with `backdrop-filter: none`. Dialog behaviour and markup MUST NOT change any visible copy or accessible name, MUST NOT remove or rename any `t()` key the dialogs read and MUST NOT change any existing string value. The only keys added to the set the dialogs read are `booking.ui.star_one` and `booking.ui.star_other`, which supply the review dialog star names. The layout at 360 px MUST be unchanged (no horizontal overflow, same surface width and gutter).

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
- **AND** the backdrop computed `backdrop-filter` is `none`, no existing `t()` key or string value differs, and the only added keys the dialogs read are `booking.ui.star_one` and `booking.ui.star_other`
