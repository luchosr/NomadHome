# Proposal: add-host-onboarding

## Why

Listings — and therefore the whole booking loop — require a host. The identity
spec already specifies guest→host upgrade, but it is unimplemented: there is no
`HostProfile`, no way to gain the `host` role, and no role guard. This change
adds host onboarding, unblocking the `listings` capability.

## What

- A `HostProfile` model + migration (per `docs/data-model.md` §3.2).
- `POST /users/me/become-host` (authenticated): creates the host profile, adds
  `host` to the user's roles atomically, audits `role_added`, and returns a fresh
  access token carrying the new roles. Already-host requests get 409.
- A reusable `requireRole(...)` middleware for role-guarded routes.

## Impact

- **Capabilities affected**: `identity` (role upgrade); reused later by
  `host-tooling`, `listings`, `admin`.
- **Breaking changes**: no.
- **Migration required**: yes — `HostProfile` table.
- **Out of scope**: host dashboard / listings, host→guest downgrade, editing the
  host profile, phone collection (deferred per data-model §3.2).

## Risks & Mitigations

| Risk                                                  | Likelihood | Mitigation                                                                                |
| ----------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| Stale access token lacks the new role                 | Medium     | Onboarding returns a fresh access token with updated roles.                               |
| Partial upgrade (profile without role, or vice versa) | Low        | Profile creation + role add run in one Prisma transaction.                                |
| Client spoofs the accepted terms version              | Low        | The server stamps the current terms version; the client only sends an acceptance boolean. |

## Rollout

Big bang — no feature flag. Verified by DB-backed integration tests (locally and
in CI).
