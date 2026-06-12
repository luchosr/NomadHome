## MODIFIED Requirements

### Requirement: Access tokens and refresh tokens

The system SHALL issue access tokens as signed JWTs with a short TTL and SHALL issue refresh tokens as opaque server-side records that can be revoked. Refresh tokens SHALL be stored server-side (not solely as JWT claims) so that revocation is authoritative.

Each refresh token SHALL have an absolute TTL of 30 days from its issuance time (`expiresAt = issuedAt + 30 days`). The TTL of an individual token SHALL NOT be extended on use; rotation produces a brand-new token row instead.

The system SHALL rotate refresh tokens on use: when a valid (non-revoked, non-expired) refresh token is presented to the token-refresh endpoint, the system SHALL issue a new access token AND a new refresh token (also 30-day TTL from issuance) AND revoke the presented refresh token. A user's session can be extended indefinitely through rotation; no individual token survives beyond 30 days of its own issuance.

The system SHALL detect refresh-token reuse: when a refresh token whose `revokedAt` is already set (i.e., it was previously rotated, explicitly logged out, or revoked by an admin) is presented to the token-refresh endpoint, the system SHALL revoke every currently-active refresh token belonging to the same user and SHALL return HTTP 401. This treats a revoked-token presentation as a theft signal.

Logout SHALL explicitly revoke the refresh token used to call the logout endpoint and SHALL NOT revoke other refresh tokens belonging to the same user. Other devices and other active sessions remain logged in until their own refresh tokens are revoked or expire.

> **\[OPEN]** Exact access-token TTL is not specified by this baseline. The first identity-implementing ticket MUST resolve it before merging.

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
