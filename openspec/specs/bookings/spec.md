# bookings Specification

## Purpose

TBD - created by archiving change add-host-dashboard. Update Purpose after archive.

## Requirements

### Requirement: host-upcoming-bookings

The system SHALL expose an authenticated endpoint that returns a host's upcoming confirmed bookings sorted by check-in date ascending.

#### Scenario: host retrieves upcoming bookings

- **Given** I am authenticated as a host with role `host`
- **When** I send `GET /bookings/host-upcoming`
- **Then** I receive HTTP 200 with an array of confirmed bookings where `hostId` is my user id and `checkIn >= today`, each including listing title and guest email, sorted by `checkIn ASC`

#### Scenario: host with no upcoming bookings

- **Given** I am authenticated as a host with no future confirmed bookings
- **When** I send `GET /bookings/host-upcoming`
- **Then** I receive HTTP 200 with an empty array

#### Scenario: non-host is rejected

- **Given** I am authenticated as a guest (no `host` role)
- **When** I send `GET /bookings/host-upcoming`
- **Then** I receive HTTP 403
