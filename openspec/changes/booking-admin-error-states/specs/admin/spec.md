# admin — Delta for booking-admin-error-states

## ADDED Requirements

### Requirement: Admin users and listings pages show pending and error feedback on moderation actions

The admin users page and the admin listings page SHALL track one in-flight moderation action per page with a `pendingId`. While an action is in flight, the action button of the matching row MUST be disabled so the same action cannot be submitted twice. `pendingId` MUST be cleared when the request settles, on success or failure. When a disable or enable request fails, the page SHALL show a visible error produced by `getDisplayMessage` and rendered through `ServerErrorAlert`, and the row button MUST be enabled again. The error MUST be cleared when the next action starts. On success the list MUST be refetched exactly as before.

#### Scenario: Row button is disabled while the request is in flight

- **Given** an admin on the users page (or the listings page) with a pending-free list
- **When** they click Disable (or Re-enable) on a row and the request has not resolved
- **Then** that row's action button is disabled
- **And** a second click does not send a second request

#### Scenario: Failed action is visible and retryable

- **Given** an admin clicks Disable on a row and the request fails
- **When** the request settles
- **Then** an alert with the display message for that error is visible
- **And** the row's action button is enabled again

#### Scenario: Error clears on the next action

- **Given** a failed action left an error visible
- **When** the admin starts another action
- **Then** the previous error is no longer shown while the new request is in flight

#### Scenario: Successful action refetches the list

- **Given** an admin clicks Disable or Re-enable on a row
- **When** the request succeeds
- **Then** the list is refetched and the row's button is enabled again
