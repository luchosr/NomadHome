# platform Specification

## Purpose

Cross-cutting web UI and API contract. Covers the English-only mobile-responsive web app (down to 360 px viewport), the i18n-ready `t(key)` helper (snake_case dot-joined keys, reserved domains, `<key-not-found: KEY>` fallback, backend direct dict reuse — per `decide-i18n-key-format`), and the Zod-validated REST contract that is the single source of truth for request/response shapes across `apps/api` and `apps/web` via `packages/shared`. Owns no persistent state — invariants are about the application boundary.

## Requirements
### Requirement: Web application is English-only and mobile-responsive

The system SHALL deliver a web UI in English only for the MVP. The UI MUST render usably across desktop and mobile viewport widths down to 360 px. All user-facing strings MUST be routed through a `t(key)` helper backed by an English-only lookup table so that future internationalization can be added without locating untranslated literals across the codebase.

**Key format.** Keys SHALL match the regular expression `^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$` — lower-case `snake_case` segments joined by dots, with at least two segments. The convention is `<domain>.<context>.<specific>` (e.g., `auth.form.email_label`, `booking.success.confirmation_title`, `email.booking_confirmation.subject`).

**Reserved top-level domains.** The dictionary MUST always contain `common`, `error`, and `validation` as top-level domains so error and validation messages have stable lookup paths from day one. Beyond those three, every top-level domain MUST correspond to a capability folder under `openspec/specs/<capability>/`. Adding a new capability adds a new top-level domain in the same PR.

**Missing-key behavior.** When the `t()` helper is invoked with a key that does not resolve in the dictionary, the helper SHALL log a warning (to `console.warn` on the frontend or the structured logger on the backend) and SHALL return the literal string `<key-not-found: KEY>` where `KEY` is the exact key requested. The angle brackets are part of the returned string so the gap is visible in rendered UI / email body. The helper SHALL NOT throw.

**Backend reuse.** The backend SHALL import the same `en` dictionary directly (typed) from the shared package and SHALL NOT use the React-bound `t()` helper. Email templates and other server-rendered strings SHALL access keys via `en.<domain>.<context>.<specific>` and SHALL apply a simple `{{var}}` interpolation pass for variable substitution.

#### Scenario: All UI text is sourced through the `t()` helper

- **GIVEN** any rendered page of the web UI
- **WHEN** a static analysis check scans for hardcoded user-facing string literals in JSX text and attributes (excluding test files, ARIA labels generated dynamically, and developer-only logs)
- **THEN** the check finds no hardcoded user-facing string outside the `t()` helper

#### Scenario: UI renders usably on a 360 px viewport

- **GIVEN** any primary user-flow page (search, listing detail, booking, host dashboard, admin pages)
- **WHEN** the page is rendered at a viewport width of 360 px
- **THEN** all primary actions are reachable without horizontal scrolling
- **AND** no content is visually clipped or unreadable due to overflow

#### Scenario: Every `t()` key conforms to the snake_case-dot format

- **GIVEN** every `t('...')` literal call site in `apps/web/` source
- **WHEN** the keys are extracted and matched against the regex `^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$`
- **THEN** every key matches
- **AND** any key with uppercase letters, hyphens, or fewer than two segments is reported as a violation

#### Scenario: Reserved top-level domains are present in the dictionary

- **GIVEN** the English dictionary `en` shipped in `packages/shared/src/strings/en.ts`
- **WHEN** its top-level keys are inspected
- **THEN** `common`, `error`, and `validation` are all present
- **AND** every other top-level key corresponds to a folder under `openspec/specs/<capability>/`

#### Scenario: Missing key returns the marker string and logs a warning

- **GIVEN** a `t(key)` call where `key` is `booking.does_not_exist`
- **AND** the dictionary `en` does NOT contain that path
- **WHEN** the call executes
- **THEN** the return value is the literal string `<key-not-found: booking.does_not_exist>`
- **AND** a warning is logged identifying the missing key
- **AND** no exception is thrown

#### Scenario: Backend imports the dictionary directly without the React-bound helper

- **GIVEN** the API codebase under `apps/api/`
- **WHEN** server-rendered strings are needed (e.g. transactional email templates)
- **THEN** the code imports `en` from the shared package and accesses keys via `en.<domain>.<context>.<specific>`
- **AND** the React-bound `t()` helper is NOT imported in `apps/api/` source
- **AND** variable substitution uses a simple `{{var}}` interpolation pass on the resolved string

### Requirement: REST API contract with Zod-validated request/response shapes

The system SHALL expose a REST API. All request and response payloads MUST be validated against Zod schemas defined in the shared package, and those schemas MUST be the single source of truth used by both the backend (runtime validation) and the frontend (type inference and client-side validation).

#### Scenario: Invalid request body is rejected at the API boundary

- **GIVEN** any API endpoint with a Zod-validated request body
- **WHEN** the client submits a body that fails the Zod schema
- **THEN** the system returns HTTP 400 with a machine-readable validation error describing which field(s) failed
- **AND** the controller handler is not invoked

#### Scenario: Response shape matches the declared schema

- **GIVEN** any successful API response
- **WHEN** the response is generated
- **THEN** the response body conforms to the declared Zod response schema for that endpoint

