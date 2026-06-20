# listings — Delta for add-admin-ui

## ADDED Requirements

### Requirement: Admin listing list endpoint

The API SHALL expose `GET /admin/listings` (admin-only) returning a paginated list of all listings with their status and host email.

#### Scenario: admin lists listings

- **Given** the platform has listings
- **When** an admin calls `GET /admin/listings?page=1&limit=50`
- **Then** the API returns 200 with `{ data: Listing[], total, page, limit }` where each listing includes `id`, `title`, `type`, `city`, `status`, `host: { email }`

### Requirement: Admin listings page

The web app SHALL provide an `/admin/listings` page where an admin can view all listings and disable or re-enable any listing.

#### Scenario: admin disables a listing

- **Given** an admin is on the listings page and sees a published listing
- **When** they click "Disable"
- **Then** `PATCH /admin/listings/:id/disable` is called and the row status updates to DISABLED

#### Scenario: admin re-enables a listing

- **Given** an admin sees a disabled listing
- **When** they click "Re-enable"
- **Then** `PATCH /admin/listings/:id/enable` is called and the listing status updates
