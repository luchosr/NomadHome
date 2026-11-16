# search — Delta for refresh-visual-identity

## MODIFIED Requirements

### Requirement: Guest can search listings by city and date range

The system SHALL allow any visitor (authenticated or not) to search listings by
city, check-in date, and check-out date. Results MUST include only `published`
listings located in the requested city that have availability for the entire
requested range.

Each result item MUST include the listing's primary photo, title, type
(`property` or `workspace`), nightly rate, and the computed total for the
requested range (nightly rate × number of nights, before fees).

Each result item MUST also include an `amenities` field: an array of the
listing's amenity codes (strings such as `wifi`), ordered alphabetically by
code, containing every amenity the listing has. The field is additive and
optional for consumers: clients that do not read it are unaffected. Labels are
not part of the API; clients render them from their own translation keys.

#### Scenario: Visitor searches a city with available listings

- **GIVEN** at least one `published` listing in city `C` with continuous availability across `[check_in, check_out)`
- **WHEN** the visitor submits a search for city `C` and the date range `[check_in, check_out)`
- **THEN** the response includes that listing in the result set
- **AND** each result item exposes primary photo, title, type, nightly rate, and computed total for the requested range

#### Scenario: Listing with partial availability is excluded

- **GIVEN** a published listing in city `C` with availability blocked for at least one date inside `[check_in, check_out)`
- **WHEN** the visitor searches for city `C` and the range `[check_in, check_out)`
- **THEN** the response does not include that listing

#### Scenario: Draft and disabled listings are excluded

- **GIVEN** listings in city `C` that are in `draft` status or that have been disabled by an admin
- **WHEN** the visitor searches for city `C`
- **THEN** the response does not include those listings, regardless of availability

#### Scenario: Result items include the listing's amenity codes

- **GIVEN** a published, available listing in city `C` with amenities `wifi`, `kitchen`, and `ac`
- **WHEN** the visitor searches for city `C`
- **THEN** the result item for that listing has `amenities` equal to `["ac", "kitchen", "wifi"]`
- **AND** the items contain codes only, not labels

#### Scenario: Listing without amenities returns an empty list

- **GIVEN** a published, available listing in city `C` with no amenities
- **WHEN** the visitor searches for city `C`
- **THEN** the result item for that listing has `amenities` equal to `[]`
- **AND** the listing is still included in the result set
