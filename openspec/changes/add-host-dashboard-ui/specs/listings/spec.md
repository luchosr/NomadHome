# listings — Delta for add-host-dashboard-ui

## ADDED Requirements

### Requirement: Host listings management page

The web app SHALL provide a `/host/listings` page where an authenticated host can view all their listings with status and navigate to create or edit a listing.

#### Scenario: host views their listings

- **Given** an authenticated host has created listings
- **When** they navigate to `/host/listings`
- **Then** each listing shows title, type, status badge, and an "Edit" link

#### Scenario: host creates a new listing

- **Given** a host is on `/host/listings/new`
- **When** they fill in all required fields and submit
- **Then** `POST /listings` is called and the host is redirected to the edit page for the new listing

### Requirement: Host listing edit page

The web app SHALL provide a `/host/listings/:id/edit` page where a host can update listing details, manage photos, manage availability blocks, and publish or unpublish the listing.

#### Scenario: host edits listing details

- **Given** a host is on the edit page for their listing
- **When** they change a field and save
- **Then** `PATCH /listings/:id` is called with the changed fields

#### Scenario: host publishes a listing

- **Given** a draft listing with at least one photo
- **When** the host clicks "Publish"
- **Then** `PATCH /listings/:id/publish` is called and the status badge updates to Published

#### Scenario: host adds a photo

- **Given** a host is on the edit page
- **When** they select a file and upload it
- **Then** the app calls `POST /listings/:id/photos/upload-url`, PUTs the file to the signed URL, then calls `POST /listings/:id/photos` to register the key

#### Scenario: host blocks availability dates

- **Given** a host is on the edit page
- **When** they enter a start and end date and click "Block"
- **Then** `POST /listings/:id/availability` is called and the new block appears in the list

### Requirement: Host upcoming bookings page

The web app SHALL provide a `/host/upcoming` page where a host can see all upcoming confirmed bookings.

#### Scenario: host views upcoming bookings

- **Given** a host has upcoming confirmed bookings
- **When** they navigate to `/host/upcoming`
- **Then** each row shows listing title, guest email, check-in date, and check-out date
