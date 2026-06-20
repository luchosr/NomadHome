# Proposal: add-admin-ui

## Why

Admins have no UI to manage users or listings. This is the final MVP frontend ticket: add the admin dashboard with user list + disable/enable and listing list + disable/enable (NH-023).

## What Changes

- **Backend**: two new admin list endpoints — `GET /admin/users` (paginated, with roles and disabled status) and `GET /admin/listings` (paginated, with host email and status).
- **`AdminUsersPage`** (`/admin/users`): table of all users with email, roles, disabled status, and disable/enable toggle buttons.
- **`AdminListingsPage`** (`/admin/listings`): table of all listings with title, type, city, status, host email, and disable/enable toggle buttons.
- Router: replace `/admin/*` wildcard placeholder with real routes.

## Impact

- **Capabilities affected**: `identity`, `listings`
- **Breaking changes**: no
- **Migration required**: no
- **Out of scope**: audit log view, payout management UI (backend endpoints exist; deferred to post-MVP)

## Risks & Mitigations

| Risk                      | Likelihood | Mitigation                                    |
| ------------------------- | ---------- | --------------------------------------------- |
| Large user/listing tables | Low        | Paginate at 50 rows; no search needed for MVP |

## Rollout

Big bang — no existing admin UI to replace.
