## ADDED Requirements

### Requirement: Email and password registration

The system SHALL allow a new visitor to create an account with email and password, defaulting the account to the `guest` role and recording the event in the auth audit log.

The system SHALL enforce a password policy of at least 10 characters including at least one letter and one digit. The system SHALL store the password as a bcrypt hash and SHALL NOT persist the plaintext password anywhere, including logs.

#### Scenario: Visitor registers with a valid, unused email and a compliant password

- **GIVEN** an email address that is not already associated with an existing account
- **AND** a password meeting the policy (≥10 chars, ≥1 letter, ≥1 digit)
- **WHEN** the visitor submits the registration form
- **THEN** an account is created with role `guest` only
- **AND** the password is stored as a bcrypt hash
- **AND** a verification email is dispatched to the submitted address
- **AND** the auth audit log records `user.registered` with timestamp and source IP

#### Scenario: Registration is rejected for a duplicate email

- **GIVEN** an email address already associated with an existing account
- **WHEN** the visitor submits the registration form
- **THEN** the system returns a generic registration error without revealing whether the email exists
- **AND** no new account is created
- **AND** the auth audit log records `user.registration_failed` with reason `duplicate_email`

#### Scenario: Registration is rejected for a weak password

- **GIVEN** a password that does not meet the policy
- **WHEN** the visitor submits the registration form
- **THEN** the system returns a validation error identifying the failed policy rule(s)
- **AND** no account is created

### Requirement: Login with email and password

The system SHALL authenticate a registered user with valid credentials by issuing a short-lived JWT access token and a longer-lived refresh token. Failed logins SHALL return a generic error that does not reveal whether the email is registered (no enumeration).

#### Scenario: User logs in with valid credentials on a verified account

- **GIVEN** valid credentials for a verified account
- **WHEN** the user submits the login form
- **THEN** the system returns a JWT access token and a refresh token
- **AND** the auth audit log records `user.login_succeeded` with timestamp and source IP

#### Scenario: Login fails with invalid credentials

- **GIVEN** credentials that do not match any account, or that match an account but with the wrong password
- **WHEN** the user submits the login form
- **THEN** the system returns a generic "invalid credentials" error
- **AND** no token is issued
- **AND** the auth audit log records `user.login_failed` with timestamp and source IP

### Requirement: Guest can upgrade to host role

The system SHALL allow an authenticated guest to gain the `host` role in addition to `guest` by completing the host onboarding form, after which the user can access host-only routes.

#### Scenario: Guest completes host onboarding

- **GIVEN** an authenticated user with role `guest` only
- **WHEN** the user completes and submits the host onboarding form with valid data
- **THEN** the account gains the `host` role in addition to `guest`
- **AND** the user can access host-only routes immediately
- **AND** the auth audit log records `user.role_added` with role `host`

### Requirement: Access tokens and refresh tokens

The system SHALL issue access tokens as signed JWTs with a short TTL and SHALL issue refresh tokens as opaque server-side records that can be revoked. Refresh tokens SHALL be stored server-side (not solely as JWT claims) so that revocation is authoritative.

> **\[OPEN]** Exact access-token TTL, refresh-token TTL, and rotation policy (sliding vs. absolute) are not specified by this baseline. The first identity-implementing ticket MUST resolve these before merging. See Finding 9 of `docs/adversarial-review.md`.

#### Scenario: Access token is rejected after expiry

- **GIVEN** an access token whose `exp` claim is in the past
- **WHEN** the token is presented to a protected route
- **THEN** the system returns HTTP 401
- **AND** the protected resource is not exposed

#### Scenario: Refresh token is rejected after revocation

- **GIVEN** a refresh token that has been revoked server-side
- **WHEN** the token is presented to the token-refresh endpoint
- **THEN** the system returns HTTP 401
- **AND** no new access token is issued
