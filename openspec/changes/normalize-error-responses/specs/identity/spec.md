# identity — Delta for normalize-error-responses

## MODIFIED Requirements

### Requirement: Login with email and password

The system SHALL authenticate a registered user with valid credentials by issuing a short-lived JWT access token and a longer-lived refresh token. Failed logins SHALL return a generic error that does not reveal whether the email is registered (no enumeration). A disabled account (`disabledAt` set) SHALL NOT be able to log in, and the rejection SHALL use the same generic error as invalid credentials. The rejection response body SHALL include a stable machine-readable error code `INVALID_CREDENTIALS` in addition to a human-readable `message`.

#### Scenario: User logs in with valid credentials on a verified account

- **GIVEN** valid credentials for a verified account
- **WHEN** the user submits the login form
- **THEN** the system returns a JWT access token and a refresh token
- **AND** the auth audit log records `user.login_succeeded` with timestamp and source IP

#### Scenario: Login fails with invalid credentials

- **GIVEN** credentials that do not match any account, or that match an account but with the wrong password
- **WHEN** the user submits the login form
- **THEN** the system returns HTTP 401 with `error: "INVALID_CREDENTIALS"` and a human-readable `message`
- **AND** no token is issued
- **AND** the auth audit log records `user.login_failed` with timestamp and source IP

#### Scenario: Login is rejected for a disabled account

- **GIVEN** valid credentials for an account whose `disabledAt` is set
- **WHEN** the user submits the login form
- **THEN** the system returns the same HTTP 401 `error: "INVALID_CREDENTIALS"` response as invalid credentials
- **AND** no token is issued
- **AND** the auth audit log records `user.login_failed` with timestamp and source IP

### Requirement: Guest can upgrade to host role

The system SHALL allow an authenticated guest to gain the `host` role in addition to `guest` by completing the host onboarding form, after which the user can access host-only routes.

The onboarding endpoint SHALL be `POST /users/me/become-host`, protected by authentication. The form SHALL capture a display name and a payout email and SHALL require explicit acceptance of the current terms; the system SHALL stamp the accepted terms version server-side (the client cannot set it). Creating the host profile and adding the `host` role SHALL be atomic. The response SHALL include a fresh access token carrying the updated roles so the user can access host-only routes without re-authenticating. A user who already holds the `host` role SHALL be rejected (HTTP 409) without creating a duplicate profile; the response body SHALL include a stable machine-readable error code `ALREADY_HOST` in addition to a human-readable `message`. A user whose email is not verified (`emailVerifiedAt` is `null`) SHALL be rejected (HTTP 403) without creating a host profile; the response body SHALL include a stable machine-readable error code `EMAIL_NOT_VERIFIED` in addition to a human-readable `message`.

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
- **THEN** the system returns HTTP 409 with `error: "ALREADY_HOST"` and a human-readable `message`
- **AND** no second host profile is created

#### Scenario: Onboarding requires authentication

- **GIVEN** a request with no valid access token
- **WHEN** it is sent to the host onboarding endpoint
- **THEN** the system returns HTTP 401
- **AND** no host profile is created

#### Scenario: Onboarding is rejected for an unverified email

- **GIVEN** an authenticated user with role `guest` only whose `emailVerifiedAt` is `null`
- **WHEN** the user submits the host onboarding form
- **THEN** the system returns HTTP 403
- **AND** the response body includes `error: "EMAIL_NOT_VERIFIED"`
- **AND** the response body includes a human-readable `message`
- **AND** no host profile is created
- **AND** the user does not gain the `host` role
