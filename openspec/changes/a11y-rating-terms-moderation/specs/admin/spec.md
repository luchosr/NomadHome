# admin — Delta for a11y-rating-terms-moderation

## ADDED Requirements

### Requirement: Admin moderation actions work from the keyboard

The Disable and Re-enable actions on the admin users page and the admin listings page SHALL be operable with the keyboard alone: with an action button focused, pressing Enter and pressing Space MUST each trigger the same request as a click, exactly once per press.

#### Scenario: Keyboard activation on the users page

- **Given** an admin on the users page with the Disable button of an active user focused, and separately with the Re-enable button of a disabled user focused
- **When** they press Enter, and separately Space
- **Then** exactly one `PATCH /admin/users/:id/disable` (or `/enable`) request is sent
- **And** the refetched list shows the opposite action for that user

#### Scenario: Keyboard activation on the listings page

- **Given** an admin on the listings page with the Disable button of a published listing focused, and separately with the Re-enable button of a disabled listing focused
- **When** they press Enter, and separately Space
- **Then** exactly one `PATCH /admin/listings/:id/disable` (or `/enable`) request is sent
- **And** the refetched list shows the opposite action for that listing
