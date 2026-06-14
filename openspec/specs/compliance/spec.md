# compliance Specification

## Purpose

Security and audit foundations that every other capability inherits: bcrypt password hashing at cost ≥ 10, HTTPS in production, and the append-only authentication audit log (`user.registered` / `user.login_succeeded` / `user.login_failed` / `user.role_added` / `user.disabled` / `user.reenabled` / `user.refresh_token_reuse_detected`). Co-owns the `AuthAuditEvent` aggregate with `identity`; broader compliance scope (GDPR self-service, ID verification, background checks) is Post-MVP per `openspec/project.md` §3.1.

## Requirements
### Requirement: Passwords are stored as bcrypt hashes

The system SHALL hash user passwords with bcrypt before persistence and MUST NOT store plaintext passwords in the database, logs, or telemetry. The bcrypt cost factor MUST be at least 10.

#### Scenario: Stored password value is never plaintext

- **GIVEN** a user who has just registered or updated their password
- **WHEN** the persisted user record is inspected
- **THEN** the stored password field is a bcrypt hash, not the plaintext password
- **AND** no log line, metric, or trace contains the plaintext password

### Requirement: Production deployments serve traffic over HTTPS

The system SHALL serve all production HTTP traffic over TLS. Plain HTTP requests in production MUST be redirected to HTTPS or rejected.

#### Scenario: Production endpoint receives a plain HTTP request

- **GIVEN** a production deployment of the platform
- **WHEN** a client connects over plain HTTP to any endpoint
- **THEN** the response is either a redirect to the same path over HTTPS, or a connection-level rejection
- **AND** no sensitive payload (credentials, tokens, PII) is processed over the plain HTTP connection

### Requirement: Authentication events are recorded in an append-only audit log

The system SHALL append a record to an auth audit log for each of the following events: `user.registered`, `user.registration_failed`, `user.login_succeeded`, `user.login_failed`, `user.role_added`, `user.disabled`, and `user.reenabled`. Each record MUST include event type, subject user identifier (when known), timestamp, and source IP address. The audit log MUST be append-only — records MUST NOT be mutated or deleted by application code.

#### Scenario: Successful login appends an audit record

- **GIVEN** a user who has just authenticated successfully
- **WHEN** the auth audit log is queried for that user
- **THEN** a record with event `user.login_succeeded`, the user's identifier, the timestamp, and the source IP is present

#### Scenario: Failed login appends an audit record

- **GIVEN** a login attempt that failed
- **WHEN** the auth audit log is queried for the attempted credential
- **THEN** a record with event `user.login_failed`, the timestamp, and the source IP is present
- **AND** the record does not include the attempted plaintext password

