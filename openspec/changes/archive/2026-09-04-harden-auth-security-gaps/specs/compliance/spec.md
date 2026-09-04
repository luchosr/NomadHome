# compliance — Delta for harden-auth-security-gaps

## ADDED Requirements

### Requirement: Auth endpoints are rate-limited per IP

The system SHALL rate-limit `POST /auth/login` and `POST /auth/register` to 5 requests per minute per source IP. Requests exceeding the limit SHALL receive HTTP 429 and SHALL NOT reach the underlying login/registration logic (no credential check, no account lookup, no audit-log write for the throttled request itself).

#### Scenario: Login requests within the limit succeed normally

- **GIVEN** fewer than 5 `POST /auth/login` requests from the same IP within the current minute
- **WHEN** another request arrives from that IP
- **THEN** it is processed normally (200 on success, 401 on invalid credentials, per the existing login requirement)

#### Scenario: Exceeding the login rate limit returns 429

- **GIVEN** 5 `POST /auth/login` requests already received from the same IP within the current minute
- **WHEN** a 6th request arrives from that IP within the same window
- **THEN** the system responds `429 Too Many Requests`
- **AND** no login attempt (successful or failed) is processed or audit-logged for that 6th request

#### Scenario: Exceeding the registration rate limit returns 429

- **GIVEN** 5 `POST /auth/register` requests already received from the same IP within the current minute
- **WHEN** a 6th request arrives from that IP within the same window
- **THEN** the system responds `429 Too Many Requests`
- **AND** no account is created for that 6th request

### Requirement: JWT signing secret has a minimum length

The system SHALL reject a `JWT_SECRET` environment value shorter than 32 characters at the point it is used to sign or verify a token, failing loudly (throwing) rather than accepting a weak secret silently. This check is in addition to, not a replacement for, the existing check that `JWT_SECRET` is set at all.

#### Scenario: JWT_SECRET is set but too short

- **GIVEN** `JWT_SECRET` is set to a value shorter than 32 characters
- **WHEN** the system attempts to sign or verify a JWT (e.g. on login)
- **THEN** the operation throws an error identifying the secret as too short
- **AND** no token is issued

#### Scenario: JWT_SECRET meets the minimum length

- **GIVEN** `JWT_SECRET` is set to a value of 32 characters or more
- **WHEN** the system signs or verifies a JWT
- **THEN** the operation succeeds as before
