# identity — Delta for add-admin-ui

## ADDED Requirements

### Requirement: Admin user list endpoint

The API SHALL expose `GET /admin/users` (admin-only) returning a paginated list of all users with their roles and disabled status.

#### Scenario: admin lists users

- **Given** the platform has registered users
- **When** an admin calls `GET /admin/users?page=1&limit=50`
- **Then** the API returns 200 with `{ data: User[], total, page, limit }` where each user has `id`, `email`, `roles`, `disabledAt`

### Requirement: Admin users page

The web app SHALL provide an `/admin/users` page where an admin can view all users and disable or re-enable any account.

#### Scenario: admin disables a user

- **Given** an admin is on the users page and sees an active user
- **When** they click "Disable"
- **Then** `PATCH /admin/users/:id/disable` is called and the row updates to show a "Re-enable" button

#### Scenario: admin re-enables a user

- **Given** an admin sees a disabled user
- **When** they click "Re-enable"
- **Then** `PATCH /admin/users/:id/enable` is called and the row shows "Disable" again
