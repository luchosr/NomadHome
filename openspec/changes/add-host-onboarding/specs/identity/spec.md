# identity — Delta for add-host-onboarding

## MODIFIED Requirements

### Requirement: Guest can upgrade to host role

The system SHALL allow an authenticated guest to gain the `host` role in addition to `guest` by completing the host onboarding form, after which the user can access host-only routes.

The onboarding endpoint SHALL be `POST /users/me/become-host`, protected by authentication. The form SHALL capture a display name and a payout email and SHALL require explicit acceptance of the current terms; the system SHALL stamp the accepted terms version server-side (the client cannot set it). Creating the host profile and adding the `host` role SHALL be atomic. The response SHALL include a fresh access token carrying the updated roles so the user can access host-only routes without re-authenticating. A user who already holds the `host` role SHALL be rejected (HTTP 409) without creating a duplicate profile.

#### Scenario: Guest completes host onboarding

- **GIVEN** an authenticated user with role `guest` only
- **WHEN** the user completes and submits the host onboarding form with valid data
- **THEN** the account gains the `host` role in addition to `guest`
- **AND** the user can access host-only routes immediately
- **AND** the auth audit log records `user.role_added` with role `host`

#### Scenario: A host profile is created with the submitted details

- **GIVEN** an authenticated user with role `guest` only
- **WHEN** the user submits the onboarding form with a display name, payout email, and terms acceptance
- **THEN** a host profile is persisted with that display name and payout email
- **AND** the accepted terms version is recorded as stamped by the server

#### Scenario: Re-running onboarding for an existing host is rejected

- **GIVEN** an authenticated user who already holds the `host` role
- **WHEN** the user submits the host onboarding form
- **THEN** the system returns HTTP 409
- **AND** no second host profile is created

#### Scenario: Onboarding requires authentication

- **GIVEN** a request with no valid access token
- **WHEN** it is sent to the host onboarding endpoint
- **THEN** the system returns HTTP 401
- **AND** no host profile is created
