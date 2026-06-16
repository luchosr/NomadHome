# identity — Delta for add-identity-registration

## MODIFIED Requirements

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
