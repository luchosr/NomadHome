# identity — Delta for add-auth-ui

## ADDED Requirements

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
