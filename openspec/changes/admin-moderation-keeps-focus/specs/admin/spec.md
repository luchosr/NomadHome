# admin — Delta for admin-moderation-keeps-focus

## MODIFIED Requirements

### Requirement: Admin users and listings pages show pending and error feedback on moderation actions

The admin users page and the admin listings page SHALL track one in-flight moderation action per page with a `pendingId`. While an action is in flight, the action button of the matching row MUST carry `aria-disabled="true"` and MUST NOT carry the native `disabled` attribute, so that it stays focusable; the page MUST ignore further activations (click, Enter or Space) so the same action cannot be submitted twice. At any other time the button MUST NOT carry `aria-disabled="true"`. `pendingId` MUST be cleared when the request settles, on success or failure. When a disable or enable request fails, the page SHALL show a visible error produced by `getDisplayMessage` and rendered through `ServerErrorAlert`, and the row button MUST no longer carry `aria-disabled="true"`. The error MUST be cleared when the next action starts. On success the list MUST be refetched exactly as before.

#### Scenario: Row button is aria-disabled while the request is in flight

- **Given** an admin on the users page (or the listings page) with a pending-free list
- **When** they click Disable (or Re-enable) on a row and the request has not resolved
- **Then** that row's action button has `aria-disabled="true"` and no `disabled` attribute
- **And** a second click, Enter or Space does not send a second request

#### Scenario: Failed action is visible and retryable

- **Given** an admin clicks Disable on a row and the request fails
- **When** the request settles
- **Then** an alert with the display message for that error is visible
- **And** the row's action button no longer has `aria-disabled="true"`

#### Scenario: Error clears on the next action

- **Given** a failed action left an error visible
- **When** the admin starts another action
- **Then** the previous error is no longer shown while the new request is in flight

#### Scenario: Successful action refetches the list

- **Given** an admin clicks Disable or Re-enable on a row
- **When** the request succeeds
- **Then** the list is refetched and the row's button does not have `aria-disabled="true"`

## ADDED Requirements

### Requirement: Admin moderation actions keep keyboard focus

When a Disable or Re-enable button on the admin users page or the admin listings page is activated, keyboard focus SHALL stay on that button while the request is pending, after it succeeds and after it fails, in the table layout and in the card layout. After a success the same `button` element MUST remain mounted and show the opposite action, so focus MUST NOT move to the document body and the page MUST NOT move focus programmatically. This covers a request whose list refetch succeeds; the page error panel shown when the list itself cannot be loaded is out of scope.

#### Scenario: Focus stays while the request is pending

- **GIVEN** an admin on the users page, and separately the listings page, at 1280 px and at 360 px, with a Disable or Re-enable button focused
- **WHEN** they press Enter, and separately Space, and the request has not resolved
- **THEN** that button is still the focused element
- **AND** pressing Enter or Space again sends no second request

#### Scenario: Focus stays after success

- **GIVEN** a focused Disable button, and separately a focused Re-enable button, in either layout
- **WHEN** the request succeeds and the list is refetched
- **THEN** the same `button` element is still focused and shows the opposite action

#### Scenario: Focus stays after failure

- **GIVEN** a focused action button in either layout
- **WHEN** the request fails and the error alert is shown
- **THEN** that button is still focused, keeps its label and does not have `aria-disabled="true"`
