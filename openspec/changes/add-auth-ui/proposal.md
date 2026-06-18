# Proposal: add-auth-ui

## Why

The backend identity endpoints (register, login, refresh, logout) are fully implemented. This change wires a React frontend to those endpoints so guests and hosts can create accounts and sign in — a prerequisite for all other frontend tickets.

## What Changes

- `/register` page — email + password form with validation
- `/login` page — email + password form with validation
- `AuthProvider` + `useAuth` hook — access token in memory, refresh token in localStorage, auto-refresh on mount
- `ProtectedRoute` component — redirects unauthenticated users to `/login`
- `RoleGuard` component — shows 403 if the authenticated user lacks the required role
- App shell `Layout` — top nav with logo, role-aware links, login/logout

## Impact

- **Capabilities affected**: `identity`
- **Breaking changes**: no
- **Migration required**: no
- **Out of scope**: host onboarding UI (NH-022), OAuth, email verification UI

## Risks & Mitigations

| Risk                                            | Likelihood                      | Mitigation                                           |
| ----------------------------------------------- | ------------------------------- | ---------------------------------------------------- |
| Refresh token in localStorage is XSS-accessible | Low (MVP, no untrusted scripts) | Acceptable for MVP; move to httpOnly cookie post-MVP |

## Rollout

Frontend-only change; no backend changes.
