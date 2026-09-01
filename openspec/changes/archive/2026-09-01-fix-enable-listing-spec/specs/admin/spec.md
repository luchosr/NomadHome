# admin — Delta for fix-enable-listing-spec

## MODIFIED Requirements

### Requirement: enable-listing

The system SHALL allow an admin to re-enable a disabled listing. Re-enabling SHALL revert the listing to `DRAFT`, not `PUBLISHED` — matching the same invariant applied when a listing is re-enabled via the user-disable cascade (see capability overview) and `docs/data-model.md` §3.6. The host MUST manually re-publish the listing before it appears in guest-facing search again.

#### Scenario: admin enables a listing

- **Given** I am authenticated as an admin
- **When** I send `PATCH /admin/listings/:id/enable`
- **Then** the listing's `status` is set to `DRAFT` and `disabledAt` is cleared
- **And** I receive HTTP 200
