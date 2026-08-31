# identity Specification

## Purpose

Authentication and authorization for the NomadHome marketplace: email/password registration, login, JWT access tokens paired with server-side revocable refresh tokens (per `decide-refresh-token-policy`), role escalation from `guest` to `host`, and the auth-event audit trail. Owns the `User`, `HostProfile`, `RefreshToken`, `EmailVerificationToken`, and `AuthAuditEvent` aggregates.

## Requirements

### Requirement: Email and password registration

The system SHALL allow a new visitor to create an account with email and password, defaulting the account to the `guest` role and recording the event in the auth audit log.

The system SHALL enforce a password policy of at least 10 characters including at least one letter and one digit. The system SHALL store the password as a bcrypt hash and SHALL NOT persist the plaintext password anywhere, including logs.

Registration SHALL issue a single-use email-verification token that expires 24 hours after issuance. Registration SHALL NOT issue any access or refresh token — a session is established only at login. Email comparison for uniqueness SHALL be case-insensitive.

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

#### Scenario: Duplicate email is matched case-insensitively

- **GIVEN** an existing account registered as `Lucia@Example.com`
- **WHEN** a visitor submits the registration form with `lucia@example.com`
- **THEN** the registration is rejected as a duplicate
- **AND** no new account is created

#### Scenario: Registration does not establish a session

- **GIVEN** a valid, unused email and a compliant password
- **WHEN** the visitor submits the registration form
- **THEN** the response does not contain an access token or a refresh token
- **AND** a single-use email-verification token is persisted for the new account

### Requirement: Login with email and password

The system SHALL authenticate a registered user with valid credentials by issuing a short-lived JWT access token and a longer-lived refresh token. Failed logins SHALL return a generic error that does not reveal whether the email is registered (no enumeration). A disabled account (`disabledAt` set) SHALL NOT be able to log in, and the rejection SHALL use the same generic error as invalid credentials.

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

#### Scenario: Login is rejected for a disabled account

- **GIVEN** valid credentials for an account whose `disabledAt` is set
- **WHEN** the user submits the login form
- **THEN** the system returns the same generic "invalid credentials" error
- **AND** no token is issued
- **AND** the auth audit log records `user.login_failed` with timestamp and source IP

### Requirement: Guest can upgrade to host role

The system SHALL allow an authenticated guest to gain the `host` role in addition to `guest` by completing the host onboarding form, after which the user can access host-only routes.

The onboarding endpoint SHALL be `POST /users/me/become-host`, protected by authentication. The form SHALL capture a display name and a payout email and SHALL require explicit acceptance of the current terms; the system SHALL stamp the accepted terms version server-side (the client cannot set it). Creating the host profile and adding the `host` role SHALL be atomic. The response SHALL include a fresh access token carrying the updated roles so the user can access host-only routes without re-authenticating. A user who already holds the `host` role SHALL be rejected (HTTP 409) without creating a duplicate profile. A user whose email is not verified (`emailVerifiedAt` is `null`) SHALL be rejected (HTTP 403) without creating a host profile; the response body SHALL include a stable machine-readable error code `EMAIL_NOT_VERIFIED` in addition to a human-readable `message`.

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

#### Scenario: Onboarding is rejected for an unverified email

- **GIVEN** an authenticated user with role `guest` only whose `emailVerifiedAt` is `null`
- **WHEN** the user submits the host onboarding form
- **THEN** the system returns HTTP 403
- **AND** the response body includes `error: "EMAIL_NOT_VERIFIED"`
- **AND** the response body includes a human-readable `message`
- **AND** no host profile is created
- **AND** the user does not gain the `host` role

### Requirement: Access tokens and refresh tokens

The system SHALL issue access tokens as signed JWTs with a short TTL and SHALL issue refresh tokens as opaque server-side records that can be revoked. Refresh tokens SHALL be stored server-side (not solely as JWT claims) so that revocation is authoritative.

Access tokens SHALL have a TTL of 15 minutes from issuance. The access token SHALL carry the user identifier and roles as claims, SHALL be signed with the `JWT_SECRET`, and SHALL be rejected on any protected route once its `exp` claim is in the past.

Each refresh token SHALL have an absolute TTL of 30 days from its issuance time (`expiresAt = issuedAt + 30 days`). The TTL of an individual token SHALL NOT be extended on use; rotation produces a brand-new token row instead.

The token-refresh endpoint SHALL be `POST /auth/refresh` and the logout endpoint SHALL be `POST /auth/logout`; both accept the refresh token in the request body. The refresh token is presented as an opaque value and matched server-side by its stored hash.

The system SHALL rotate refresh tokens on use: when a valid (non-revoked, non-expired) refresh token is presented to the token-refresh endpoint, the system SHALL issue a new access token AND a new refresh token (also 30-day TTL from issuance) AND revoke the presented refresh token. A user's session can be extended indefinitely through rotation; no individual token survives beyond 30 days of its own issuance.

The system SHALL detect refresh-token reuse: when a refresh token whose `revokedAt` is already set (i.e., it was previously rotated, explicitly logged out, or revoked by an admin) is presented to the token-refresh endpoint, the system SHALL revoke every currently-active refresh token belonging to the same user and SHALL return HTTP 401. This treats a revoked-token presentation as a theft signal.

Logout SHALL explicitly revoke the refresh token used to call the logout endpoint and SHALL NOT revoke other refresh tokens belonging to the same user. Other devices and other active sessions remain logged in until their own refresh tokens are revoked or expire.

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

#### Scenario: Refresh token is rotated on use

- **GIVEN** a refresh token that is neither revoked nor past its `expiresAt`
- **WHEN** the token is presented to the token-refresh endpoint
- **THEN** the system returns a new access token and a new refresh token
- **AND** the new refresh token's `expiresAt` is exactly 30 days from its issuance
- **AND** the presented refresh token's `revokedAt` is set to the rotation time
- **AND** the operation is atomic — either both the new token row and the revocation succeed, or both fail

#### Scenario: Refresh token is rejected after absolute expiry

- **GIVEN** a refresh token whose `expiresAt` is in the past
- **WHEN** the token is presented to the token-refresh endpoint
- **THEN** the system returns HTTP 401
- **AND** no new access token or refresh token is issued
- **AND** the user must log in again to obtain a new refresh token

#### Scenario: Refresh-token reuse triggers full revocation

- **GIVEN** a refresh token that was rotated 1 minute ago (its `revokedAt` is set)
- **AND** the user has other currently-active refresh tokens (e.g., from a parallel device session)
- **WHEN** the already-revoked refresh token is presented to the token-refresh endpoint
- **THEN** the system returns HTTP 401
- **AND** every other currently-active refresh token belonging to the same user is also revoked
- **AND** an audit log entry `user.refresh_token_reuse_detected` is recorded with the user identifier and the source IP

#### Scenario: Logout revokes only the presented refresh token

- **GIVEN** a user with two currently-active refresh tokens A and B (e.g., logged in on two devices)
- **WHEN** the user calls the logout endpoint presenting refresh token A
- **THEN** refresh token A's `revokedAt` is set
- **AND** refresh token B remains valid and continues to support rotation
- **AND** access tokens already issued continue to work until their `exp` claim is reached (no server-side blacklist for access tokens)

### Requirement: register-page

The system SHALL provide a `/register` page where a guest can create an account.

#### Scenario: guest registers successfully

- **Given** I am on `/register`
- **When** I submit a valid email and password
- **Then** my account is created, I am logged in automatically, and redirected to `/`

#### Scenario: register with invalid input

- **Given** I am on `/register`
- **When** I submit with an invalid email or short password
- **Then** inline validation errors are shown and no API call is made

### Requirement: login-page

The system SHALL provide a `/login` page where an existing user can sign in.

#### Scenario: guest logs in successfully

- **Given** I am on `/login`
- **When** I submit valid credentials
- **Then** I receive an access token, am redirected to `/`, and the nav shows my email

#### Scenario: login with wrong credentials

- **Given** I am on `/login`
- **When** I submit invalid credentials
- **Then** an error message is shown below the form

### Requirement: protected-routes

The system SHALL redirect unauthenticated users to `/login` when they navigate to protected paths.

#### Scenario: unauthenticated access to protected path

- **Given** I am not logged in
- **When** I navigate to `/host` or any protected path
- **Then** I am redirected to `/login`

### Requirement: role-guard

The system SHALL show a 403 page when an authenticated user accesses a path that requires a role they do not hold.

#### Scenario: guest accesses host path

- **Given** I am logged in as a guest without the `host` role
- **When** I navigate to `/host`
- **Then** I see a 403 Forbidden message

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
