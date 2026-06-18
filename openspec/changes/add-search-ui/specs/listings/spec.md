# listings — Delta for add-search-ui

## ADDED Requirements

### Requirement: Listing detail page UI

The web app SHALL provide a `/listings/:id` page where any visitor can view the full detail of a published listing: title, type, location, description, amenities, photo gallery, nightly rate, star rating, and guest reviews. An authenticated guest sees a "Book now" CTA; unauthenticated visitors see a "Log in to book" prompt.

#### Scenario: guest views listing detail

- **Given** a published listing with at least one photo and some reviews
- **When** an authenticated guest visits `/listings/:id`
- **Then** the page shows all listing fields plus a "Book now" button

#### Scenario: visitor views listing detail (not logged in)

- **Given** a published listing exists
- **When** an unauthenticated visitor visits `/listings/:id`
- **Then** the page shows listing detail and a "Log in to book" link instead of the CTA

#### Scenario: listing not found

- **Given** the listing ID does not exist or is not published
- **When** any visitor navigates to `/listings/:id`
- **Then** the page shows a 404 not-found message
