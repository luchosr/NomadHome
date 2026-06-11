## ADDED Requirements

### Requirement: Host dashboard lists owned listings

The system SHALL provide an authenticated host with a dashboard view that lists every listing they own, including its status (`draft`, `published`, `disabled`), title, type, city, and nightly rate.

#### Scenario: Host opens dashboard with multiple listings

- **GIVEN** an authenticated user with role `host` who owns one or more listings
- **WHEN** the host opens the dashboard
- **THEN** the response lists each owned listing with its status, title, type, city, and nightly rate
- **AND** listings owned by other hosts are not included

#### Scenario: Host with no listings sees empty state

- **GIVEN** an authenticated host who owns zero listings
- **WHEN** the host opens the dashboard
- **THEN** the response indicates that no listings exist
- **AND** the response surfaces an entry point to create the first listing

### Requirement: Host dashboard lists upcoming bookings

The system SHALL provide an authenticated host with a list of upcoming bookings on their owned listings — bookings with status `confirmed` and check-in date in the future — sorted by check-in date ascending. Each item MUST include the listing, the guest's display name, the check-in date, and the check-out date.

#### Scenario: Host views upcoming bookings sorted by check-in

- **GIVEN** an authenticated host with multiple confirmed bookings across their listings, with check-in dates in the future
- **WHEN** the host opens the upcoming-bookings view
- **THEN** the response includes only bookings with status `confirmed` whose check-in date is strictly in the future
- **AND** results are sorted by check-in date ascending
- **AND** each item exposes the listing, the guest's display name, the check-in date, and the check-out date

#### Scenario: Cancelled and past bookings are excluded

- **GIVEN** an authenticated host with a mix of `confirmed`, `cancelled`, and past-checkout bookings
- **WHEN** the host opens the upcoming-bookings view
- **THEN** `cancelled` bookings are excluded
- **AND** bookings whose check-in date is today or earlier are excluded
