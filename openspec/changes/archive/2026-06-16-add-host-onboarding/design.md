# Design: add-host-onboarding

## Atomic upgrade

`becomeHost` runs in a single `prisma.$transaction`: create the `HostProfile`
row, then set the user's `roles` to include `host`. Either both land or neither
does, so the role and the profile never diverge.

## "Immediately" access to host routes

Role checks read the access-token claims (stateless JWT). The access token issued
at login carries only `["guest"]`, so onboarding returns a **fresh access token**
with the updated roles. The client swaps it in and can call host-guarded routes
without re-logging-in or waiting for refresh. The refresh token is unchanged.

## Terms version is server-stamped

The request body carries `acceptedTerms: true` (an explicit acknowledgement), not
a version string. The server stamps `CURRENT_TERMS_VERSION` into
`HostProfile.acceptedTermsVersion`, so the recorded version is authoritative and
cannot be spoofed by the client.

## Already-a-host

If the user's roles already include `host`, the endpoint returns 409 and creates
nothing. (`HostProfile.userId` is unique, so a duplicate would fail anyway; the
explicit check gives a clean error.)

## requireRole

`requireRole(...roles)` runs after `requireAuth` and checks `req.user.roles`
against the allowed set, returning 403 on mismatch. It is the reusable guard for
host-tooling and admin routes in later tickets.
