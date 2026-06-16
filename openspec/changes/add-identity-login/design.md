# Design: add-identity-login

## Resolved decision: access-token TTL

**Access-token TTL = 15 minutes.** This is the project.md §8 default tiebreaker;
no threat-model concern in scope argues for a different value. Short enough that a
leaked access token has a small window; refresh-token rotation (next slice) keeps
sessions alive without long-lived access tokens. The §8 table row and the spec
`[OPEN]` marker are removed in this change.

## Token design

- **Access token**: JWT signed with `JWT_SECRET` (HS256), 15-minute TTL, claims
  `sub` (user id) and `roles`. Verified by `requireAuth`; expiry → 401.
- **Refresh token**: 32 random bytes, returned raw to the client once, persisted
  only as a SHA-256 hash (mirrors the registration verification token and the
  data-model "store the hash, never the raw token" rule). 30-day absolute TTL.
  This slice issues them; the rotation/reuse/logout endpoints are a follow-up.
- `JWT_SECRET` is required — the token service throws on startup if it is unset,
  so a misconfigured environment fails loudly rather than signing with a default.

## Enumeration resistance

`POST /auth/login` returns the identical generic error and 401 status for three
cases: unknown email, wrong password, and disabled account. The audit log records
the real outcome (`login_failed`) server-side; for an unknown email there is no
user row, so the event is recorded with a null `userId`.

## Layering

`routes/auth.ts` → `controllers/auth.controller.ts` → `services/auth.service.ts`
(+ `services/token.service.ts`) → `repositories/user.repository.ts`. `requireAuth`
lives in `middleware/require-auth.ts` and is reused by every future protected
route.
