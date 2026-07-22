# Vulnerability Scan Report

| Field          | Value                    |
| -------------- | ------------------------ |
| Project        | NomadHome                |
| Date           | 2026-07-17T10:04:56.754Z |
| Files tracked  | 75                       |
| Files analyzed | 75                       |
| Total findings | 40                       |

## Summary

| Severity | Count |
| -------- | ----- |
| CRITICAL | 1     |
| HIGH     | 1     |
| MEDIUM   | 26    |
| HIGH_BUG | 3     |
| BUG      | 9     |

## CRITICAL (1)

### Env-var name mismatch exposes unauthenticated dev file-write endpoint in production

- **File:** `apps/api/src/services/storage.service.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 4, 13
- **Slug:** path-traversal
- **Confidence:** high

storage.service.ts decides 'local dev' via `!process.env.CLOUDFLARE_R2_ACCOUNT_ID` (L4) and reads ALL real R2 config from `CLOUDFLARE_R2_*` (L16-23). But apps/api/src/app.ts registers the local-dev endpoints behind a DIFFERENT variable: `if (!process.env['R2_ACCOUNT_ID'])` (app.ts:43) it mounts `app.put('/dev-upload/:key', express.raw(...), fs.writeFileSync(path.join(uploadsDir, req.params.key), req.body))` (app.ts:45-49) and `app.use('/uploads', express.static(uploadsDir))` (app.ts:50). The two guards use different names, so the enabling condition for the dev endpoint is fully decoupled from whether R2 is actually configured. A production deployment configured per apps/api/.env.example (which documents CLOUDFLARE_R2_ACCOUNT_ID, not R2_ACCOUNT_ID) sets CLOUDFLARE_R2_ACCOUNT_ID (storage.service isLocalDev=false → uses R2 for real) but never sets the unprefixed R2_ACCOUNT_ID, so app.ts's guard is true and the dev endpoints stay live in prod. The committed runtime apps/api/.env demonstrates exactly this state (CLOUDFLARE_R2_ACCOUNT_ID set to a real value; R2_ACCOUNT_ID absent). The dev-upload handler is unauthenticated (mounted before all routers/guards) and writes attacker-controlled bytes to a filesystem path built directly from `req.params.key`. Attack: (a) `PUT /dev-upload/evil.html` writes uploads/evil.html, then served same-origin via `/uploads/evil.html` → stored XSS / content spoofing / overwrite of legitimate listing photos (integrity) / disk-fill DoS (20mb each); (b) since Express (v4.21) decodes the captured param, `PUT /dev-upload/..%2f..%2f..%2fpath` decodes to `../../../path` and escapes uploads/ via path.join → arbitrary file write anywhere the process can write → potential RCE. The documented 'known false-positive' (dev-only, active only when R2_ACCOUNT_ID absent) is void precisely because the flag that turns the endpoint on is not the flag that configures R2.

**Recommendation:** Use one source of truth for the dev/R2 decision: export `isLocalDev` from storage.service.ts and reuse it in app.ts, aligning on a single variable name (CLOUDFLARE_R2_ACCOUNT_ID). Additionally, never register /dev-upload unless NODE_ENV!=='production' AND an explicit opt-in flag is set; require auth; reject any key containing '/', '..', or that path.resolve()s outside uploadsDir; and restrict content types/size.

---

## HIGH (1)

### Host can delete BOOKING_HOLD availability blocks, enabling double-booking

- **File:** `apps/api/src/services/availability.service.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 84, 86, 87, 88
- **Slug:** acl-check
- **Confidence:** high

deleteBlock() authorizes on listing ownership (assertOwnership) and that the block belongs to the listing (block.listingId === listingId), but never checks block.source. AvailabilityBlockSource has HOST_BLOCK, BOOKING_HOLD, and ADMIN_BLOCK. BOOKING_HOLD rows are created for every booking in booking.repository.ts (L29-37) and are the mechanism that reserves the date range via the btree_gist EXCLUDE constraint. Attack: a host owns listing L; a guest books dates [D1,D2] creating a CONFIRMED booking + a BOOKING_HOLD block; the host calls DELETE /listings/L/availability/{holdBlockId}; deleteBlock removes the hold. The Booking row is not cascade-deleted (the FK cascade is from Listing, not Booking), so the confirmed booking now has no date reservation and the dates are bookable again — a second overlapping booking succeeds, producing two CONFIRMED bookings for the same room/dates. This breaks the platform's core no-overlap invariant and has direct financial/operational impact (oversell). The same gap also allows deleting ADMIN_BLOCK rows (moderation bypass) if/when that source is used. Route (availability.ts:18) and controller (availability.controller.ts:46-57) pass blockId straight through with no source guard.

**Recommendation:** In deleteBlock, after confirming the block belongs to the listing, reject deletion unless block.source === 'HOST_BLOCK' (throw BlockNotFoundError/BlockForbiddenError otherwise). Booking-derived holds must only be removed by the booking cancellation/expiry flow (booking.repository.cancel), and ADMIN_BLOCK only by admins.

---

## MEDIUM (26)

### GitHub Actions pinned to mutable major-version tags

- **File:** `.github/workflows/ci.yml`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 35, 42, 82, 85, 108
- **Slug:** github-workflow-security
- **Confidence:** low

`actions/checkout@v4` (L35, L82), `actions/setup-node@v4` (L42, L85), and `actions/upload-artifact@v4` (L108) are pinned to moving major-version tags rather than immutable commit SHAs. If one of these tags were re-pointed to malicious code (as happened to tj-actions/changed-files in 2025), it would execute in CI. Risk here is materially lower than the generic case because all three are first-party `actions/*` maintained by GitHub, and this workflow runs under `pull_request` (not `pull_request_target`) with only a throwaway `JWT_SECRET: ci-test-secret` and local test-DB creds in scope — no production secrets are exposed to compromise. Reported as a supply-chain hardening item, not a directly exploitable flaw.

**Recommendation:** Pin actions to full commit SHAs with the version in a trailing comment (e.g. `uses: actions/checkout@<sha> # v4.x`) and automate bumps via Dependabot/Renovate.

---

### Secrets interpolated directly into a run-step shell command

- **File:** `.github/workflows/deploy.yml`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 19, 21
- **Slug:** github-workflow-security
- **Confidence:** low

`VERCEL_TOKEN` (L19) and `VERCEL_PROJECT_ID` (L21) are inlined into the `run:` curl command via `${{ secrets.* }}`, which renders the secret values into the shell command string at expansion time. GitHub's own guidance discourages this in favor of passing secrets through `env:` and referencing `$VAR`, because inline expansion widens the surface for accidental log/command-line exposure and for shell breakage/injection if a value ever contained metacharacters. Practical exploitability is low: this workflow triggers only on `push` to `main` (trusted committers, no untrusted PR input), the secrets are admin-set and masked in logs, and Vercel IDs/tokens are not attacker-controlled. Reported as a best-practice hardening item.

**Recommendation:** Move the secrets into an `env:` block on the step and reference them as environment variables in the curl command (e.g. `env: { VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }} }` then `-H "Authorization: Bearer $VERCEL_TOKEN"`), quoting expansions to avoid word-splitting.

---

### Runtime container runs as root (no USER directive)

- **File:** `Dockerfile`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 36, 45
- **Slug:** dockerfile-run-as-root
- **Confidence:** medium

The final `runner` stage (L36-45) sets WORKDIR, copies the built API, and runs `CMD ["node", "dist/index.js"]` with no `USER` directive, so the API process runs as UID 0 (root) inside the container. The `node:20-alpine` base image ships a non-root `node` user specifically for this. This is a defense-in-depth gap, not directly exploitable on its own: if any RCE or file-write bug in the Node app (or a dependency) is triggered, running as root maximizes blast radius — the attacker can write anywhere in the container filesystem, tamper with the copied Prisma schema/migrations, and has a stronger position for container-escape primitives that require root. Combined with the app's own threat surface (Stripe/webhook handling, signed-URL uploads), least-privilege here is worthwhile.

**Recommendation:** Add `USER node` (and ensure copied files are readable by that user) in the runner stage before CMD, e.g. `COPY --chown=node:node --from=builder /prod/api .` then `USER node`. Optionally add an init process (dumb-init/tini) for correct signal handling.

---

### Base image pinned to mutable tag instead of digest

- **File:** `Dockerfile`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 1, 36
- **Slug:** dockerfile-from-mutable-tag
- **Confidence:** low

Both stages use `FROM node:20-alpine` (L1, L36), a mutable tag that is re-pointed upstream over time. Builds are therefore not reproducible and are exposed to supply-chain risk: whatever `node:20-alpine` resolves to at build time is trusted implicitly, so a compromised or unexpectedly-changed upstream tag would be pulled silently. This is a hardening/supply-chain item, not directly attacker-exploitable.

**Recommendation:** Pin the base image by digest (e.g. `FROM node:20-alpine@sha256:<digest>`) and update it deliberately via Dependabot/Renovate so base-image changes are reviewed.

---

### Path traversal in /dev-upload/:key arbitrary file write (dev-gated, missing containment check)

- **File:** `apps/api/src/app.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 45, 47
- **Slug:** path-traversal
- **Confidence:** medium

`fs.writeFileSync(path.join(uploadsDir, req.params.key!), req.body)` (L47) writes attacker-controlled bytes to an attacker-controlled path with no containment check. Although Express `:key` matches a single segment, URL-encoded slashes bypass this: `PUT /dev-upload/..%2f..%2f..%2fapp%2fconfig.js` decodes to `req.params.key = "../../../app/config.js"`, so `path.join` resolves OUTSIDE `uploadsDir`. Combined with the 20MB `express.raw` body and the server binding to `0.0.0.0` (index.ts), an attacker on the network can overwrite arbitrary process-writable files — source `.js`, config, package.json, etc. — which is a plausible path to RCE. IMPORTANT CAVEAT: this handler is gated by `if (!process.env["R2_ACCOUNT_ID"])` (L43) and is documented as a local-dev stub, so it does not run in a correctly configured production deployment. I'm reporting it as defense-in-depth because (a) the security rests entirely on one env var — an unset/typo'd `R2_ACCOUNT_ID` during a deploy turns this into an internet-exposed arbitrary-write, (b) it has no auth wrapper, and (c) the fix is trivial. This matches the documented path-traversal flag criterion (`path.join(root, userInput)` with no `path.resolve(...).startsWith(root)` check).

**Recommendation:** Even in the dev stub, contain the path: `const target = path.resolve(uploadsDir, req.params.key!); if (!target.startsWith(uploadsDir + path.sep)) return res.status(400).send();` before writing. Better, use only `path.basename(req.params.key)` since a storage key should never contain path separators. Consider failing fast at boot if R2 is unconfigured in a non-dev NODE_ENV so the stub can never activate in prod.

---

### become-host grants host role without verifying email ownership

- **File:** `apps/api/src/controllers/auth.controller.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 140, 153
- **Slug:** acl-check
- **Confidence:** high

POST /users/me/become-host (becomeHost, L140-167) delegates to AuthService.becomeHost (services/auth.service.ts L244-272), which checks only that the user exists and is not already a host. It never checks user.emailVerifiedAt. Compounding this, login() (services/auth.service.ts L143-155) rejects only disabled accounts, not unverified ones, so a user can register with an email they do not control, log in, and call become-host to obtain the `host` role plus a HostProfile carrying an attacker-chosen payoutEmail. The host role enables publishing listings and collecting Stripe payouts, so bypassing email verification here is a meaningful trust/authorization gap (the primary lateral-movement actor in the threat model is a host account). emailVerifiedAt is only ever read to echo it back in `me` (L103); it gates nothing.

**Recommendation:** In AuthService.becomeHost, load the user and reject with a 403 (e.g. EmailNotVerifiedError) when emailVerifiedAt is null before creating the host profile / adding the role. Optionally also block unverified accounts from logging in, or from any state-changing endpoint.

---

### No rate limiting or lockout on authentication endpoints

- **File:** `apps/api/src/controllers/auth.controller.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 41, 65, 107
- **Slug:** rate-limit-bypass
- **Confidence:** medium

There is no rate-limiting middleware anywhere (confirmed: only require-auth and require-role exist in middleware/, and package.json has no express-rate-limit or equivalent; app.ts adds only cors + express.json). login (L65-86) has no throttle or account lockout after repeated login_failed events, enabling credential stuffing / brute force bounded only by bcrypt cost. register (L41-63) is unauthenticated and triggers this.email.sendVerificationEmail() to any attacker-supplied address (services/auth.service.ts L134) with no cap, enabling email-bombing of arbitrary victims and Resend cost abuse. refresh (L107) is likewise unthrottled.

**Recommendation:** Add per-IP and per-account rate limiting (e.g. express-rate-limit) to /auth/login, /auth/register, and /auth/refresh, plus progressive backoff / temporary lockout after N failed logins. Cap verification emails per address/time window.

---

### Access-token verification does not pin the JWT algorithm

- **File:** `apps/api/src/controllers/auth.controller.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 17
- **Slug:** jwt-handling
- **Confidence:** low

requireAuth (imported L17) calls tokenService.verifyAccessToken, which in services/token.service.ts L31-33 runs `jwt.verify(token, this.secret())` with no `algorithms` option. Best practice is to pin `algorithms: ['HS256']`. Practically NOT currently exploitable: JWT_SECRET is a symmetric string, and jsonwebtoken v9 defaults a string key to HS256/384/512 only (it rejects `none` and RS256), so the classic alg-confusion/none attacks do not apply. Flagged as defense-in-depth: if the secret is ever swapped to an RSA public key (e.g. a future RS256 migration) without adding pinning, the token would become forgeable.

**Recommendation:** Pass `{ algorithms: ['HS256'] }` to jwt.verify in TokenService.verifyAccessToken so the accepted algorithm is explicit and future-proof.

---

### Disabled user can still create bookings within the access-token window

- **File:** `apps/api/src/controllers/booking.controller.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 26, 33
- **Slug:** auth-bypass
- **Confidence:** medium

create (L26-43) resolves the actor from the JWT via req.user.id and calls BookingService.create, which validates listing status and self-booking but never checks whether the acting user is disabled. requireAuth (middleware/require-auth.ts) verifies the JWT without any DB lookup, so disabledAt is not consulted on the request path. When an admin disables a user (repositories/admin.repository.ts disableUser), the cascade sets disabledAt and revokes nothing stateless — the existing 15-minute access token stays valid. A user disabled for abuse can therefore keep creating bookings (and BOOKING_HOLD availability blocks, repositories/booking.repository.ts L27-39) until the token expires. Same gap applies to other state-changing host/guest endpoints.

**Recommendation:** For sensitive mutations (booking creation, cancellation, listing/availability/photo mutations) load the user and reject if disabledAt is set, or shorten the access-token TTL substantially and/or maintain a server-side revocation/deny list checked in requireAuth.

---

### Public reviews endpoint leaks internal guestId and bookingId

- **File:** `apps/api/src/repositories/review.repository.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 36, 37, 38, 39, 40, 41
- **Slug:** other-info-disclosure
- **Confidence:** medium

findByListing() returns full Review rows, and ReviewService.listForListing / ReviewController.listForListing serialize them directly to the response of the public, unauthenticated route GET /listings/:id/reviews (reviews.ts line 20, no requireAuth). Each row includes internal identifiers guestId and bookingId in addition to the intended rating/text/createdAt. Exposing the reviewer's internal user UUID publicly enables cross-referencing/enumeration of users, and leaking bookingId exposes an internal identifier that is otherwise not surfaced to third parties. No auth mutation can be performed with these ids (review/booking mutations enforce guestId ownership), so impact is limited to information disclosure of internal identifiers, not direct account takeover.

**Recommendation:** Return a projection instead of the raw entity: select/map only the fields the public UI needs (id, rating, text, createdAt, and a display name if desired). Do not expose guestId or bookingId on the public endpoint.

---

### Host role granted without verifying emailVerifiedAt (email-verification bypass on become-host)

- **File:** `apps/api/src/repositories/user.repository.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 50, 62
- **Slug:** acl-check
- **Confidence:** high

`createHostProfileAndAddRole` (L50-64) atomically creates a HostProfile and pushes the 'host' role. Its sole caller, `AuthService.becomeHost` (auth.service.ts L244-272), only checks that the user exists and is not already a host — it never checks `user.emailVerifiedAt`. The route (routes/users.ts L15) applies only `requireAuth`, and the controller (auth.controller.ts L140-167) adds no verification gate. Critically, `AuthService.login` (auth.service.ts L143-178) does NOT require emailVerifiedAt either — it only blocks disabledAt — so an account registered with an unverified (or not-owned) email can log in, obtain an access token, and call POST /users/me/become-host to gain the host role. A host can publish listings and collect Stripe payments, so this lets an unverified identity operate as a paid host. A grep confirms the only non-test emailVerifiedAt references are the setter (L136) and the /me response (auth.controller.ts L103); no code enforces it on this privileged transition. The project's own security notes mandate this check ('Should verify emailVerifiedAt is non-null before granting. Flag if that check is absent.').

**Recommendation:** In AuthService.becomeHost, after loading the user, reject with a specific error when `user.emailVerifiedAt == null` before calling createHostProfileAndAddRole. Consider also blocking login (or at least host-gated actions) for unverified accounts to make the invariant robust.

---

### No rate limiting on login, register, or refresh — brute force and email/cost abuse

- **File:** `apps/api/src/routes/auth.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 18, 19, 20
- **Slug:** rate-limit-bypass
- **Confidence:** high

The auth router exposes /login, /register, /refresh, /logout, /verify with no rate-limiting middleware (confirmed: no express-rate-limit/helmet/slow-down anywhere in the repo, and none in app.ts). /login allows unlimited password guessing (credential stuffing / brute force; bcrypt cost 12 also makes each attempt CPU-expensive → DoS amplification). /register is unauthenticated and, per createAuthRouter, dispatches a Resend verification email on every call (LoggingEmailService in tests, ResendEmailService in prod) plus a bcrypt hash — an attacker can flood arbitrary inboxes and burn Resend quota/cost. There is no CAPTCHA or throttle in front of these handlers.

**Recommendation:** Add per-IP and per-account rate limiting (e.g., express-rate-limit) to /login, /register, /refresh, and /verify; consider exponential backoff/lockout on repeated login failures and CAPTCHA on register.

---

### Disabled user can still create/cancel bookings within the access-token TTL

- **File:** `apps/api/src/routes/bookings.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 48, 50
- **Slug:** auth-bypass
- **Confidence:** low

All /bookings routes use `requireAuth`, which only verifies the JWT and never checks `disabledAt` (require-auth.ts). Account disabling is enforced at /auth/refresh and at login, not on every request. A user disabled by an admin therefore retains a valid access token for up to its 15-minute TTL (token.service.ts ACCESS_TTL) and can continue creating bookings (which insert BOOKING_HOLD availability blocks) and cancelling. This is a documented design tradeoff, but it means state-changing booking operations lack immediate revocation. Low confidence because the 15m TTL bounds the window and the behavior is intentional per the auth shape notes.

**Recommendation:** For sensitive state-changing endpoints (booking create/cancel, listing mutation), add a lightweight DB check of `disabledAt` (or a cached deny-list / very short access-token TTL) so disabled users are rejected immediately.

---

### Presigned upload URL accepts arbitrary content-type (SVG/HTML smuggling)

- **File:** `apps/api/src/routes/listing-photos.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 21, 22
- **Slug:** other-unrestricted-upload-content-type
- **Confidence:** medium

POST /listings/:id/photos/upload-url is host-guarded and ownership-checked, but UploadUrlRequestSchema (packages/shared/src/schemas/listing.ts:31-33) validates `contentType` as only `z.string().min(1)` — no image allowlist. ListingPhotoService.getUploadUrl (listing-photo.service.ts:33-42) passes it straight into StorageService.getPresignedUploadUrl (storage.service.ts:27-37) as the S3/R2 PutObject ContentType. A malicious/compromised host can mint a presigned PUT for `image/svg+xml` or `text/html`, upload active markup, then register it; the object is later served from the public bucket with that content-type. Directly opening the stored URL executes script in the storage origin — escalating to app-cookie theft if the public bucket is a cookie-sharing subdomain of the app. Secondary: ListingPhotoService.register (listing-photo.service.ts:44-53) accepts an arbitrary `key` and never verifies it matches the `photos/<listingId>/` prefix that getUploadUrl issued (service.ts:39) or that the object exists, so a host can also point a listing photo at any object in the bucket. The frontend `accept="image/*"` (EditListingPage.tsx:380) is client-side only and not enforced server-side.

**Recommendation:** Restrict contentType to an allowlist (e.g. image/jpeg|png|webp) in UploadUrlRequestSchema and re-check server-side in getUploadUrl. Serve the public bucket from a cookieless origin with Content-Disposition: attachment / a restrictive CSP. In register(), validate that `key` starts with the expected `photos/${listingId}/` prefix.

---

### Public /listings/:id/blocked-dates leaks availability for unpublished/disabled listings

- **File:** `apps/api/src/routes/reviews.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 22, 23
- **Slug:** other-info-disclosure
- **Confidence:** medium

The public handler calls `availabilityRepo.listByListing(req.params.id)` (L23) with no status filter, unlike the getPublic route which uses findPublished (status = PUBLISHED). It returns start/end date ranges of every AvailabilityBlock (BOOKING_HOLD and HOST_BLOCK) for ANY listing id, including DRAFT and DISABLED listings. An attacker who knows or guesses a listing UUID can enumerate occupancy/hold patterns for listings that are not publicly visible. Impact is limited to date ranges (no PII), hence medium/low.

**Recommendation:** Only serve blocked-dates for PUBLISHED listings — look up the listing (or join) and return 404 when it is not published, mirroring getPublic.

---

### STRIPE_WEBHOOK_SECRET falls back to a hardcoded placeholder, enabling webhook forgery if unset

- **File:** `apps/api/src/routes/stripe.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 12, 26, 31
- **Slug:** secret-in-fallback
- **Confidence:** medium

`webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"] ?? "whsec_placeholder"` (L12) feeds `stripe.webhooks.constructEvent` (controller L21). Webhook signature verification is the sole defense against spoofing per the threat model. If STRIPE_WEBHOOK_SECRET is missing in an environment, verification silently downgrades to the known, source-hardcoded secret `whsec_placeholder`. An attacker can then forge a `checkout.session.completed` event signed with that placeholder — using their own session id (returned to them by createCheckoutSession) — and get their booking marked CONFIRMED without paying. Exploitation is conditional on the env var being unset, but a hardcoded secret fallback should never silently satisfy a signature check.

**Recommendation:** Fail fast at startup if STRIPE_WEBHOOK_SECRET (and STRIPE_SECRET_KEY) are unset instead of substituting a placeholder. Never provide a hardcoded fallback for a value used in signature verification.

---

### become-host grants host role without verifying email ownership

- **File:** `apps/api/src/routes/users.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 15
- **Slug:** acl-check
- **Confidence:** high

POST /users/me/become-host (users.ts:15) requires only requireAuth. The downstream AuthService.becomeHost (apps/api/src/services/auth.service.ts:244-272) loads the user via findById and checks only `!user` and `user.roles.includes('host')` — it never checks `user.emailVerifiedAt`. A grep confirms emailVerifiedAt is only written (user.repository.ts:136) and returned by /me (auth.controller.ts:103), never gated on in the promotion path. Attack: register with an email you do not control (or a throwaway), skip verification, and immediately call become-host with an attacker-chosen `payoutEmail` (BecomeHostSchema does not verify the payout email either). You now hold the `host` role, can publish listings, and receive Stripe payouts — all from an unverified/spoofed identity. This is the exact eligibility gate the threat model requires before granting host.

**Recommendation:** In AuthService.becomeHost, after loading the user, reject when `user.emailVerifiedAt == null` (throw a dedicated EmailNotVerifiedError mapped to 403). Optionally require the payoutEmail to be verified/owned before enabling payouts.

---

### Disabled user can self-promote to host and refresh their access window

- **File:** `apps/api/src/routes/users.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 15
- **Slug:** auth-bypass
- **Confidence:** medium

AuthService.becomeHost (auth.service.ts:245-269) already fetches the full user via findById but does NOT check `user.disabledAt`, unlike login (auth.service.ts:147) and refresh (auth.service.ts:210) which both reject disabled accounts. requireAuth does not hit the DB (known 15-min disabled-user window). Because become-host does its own DB lookup, a user disabled by an admin who still holds a non-expired access token can (a) permanently add the `host` role to their disabled account and (b) receive a freshly-signed 15-minute access token from become-host (auth.service.ts:269), extending their usable window past the disable action. The persisted role change outlives the token, so this is worse than a passive read during the window.

**Recommendation:** Add `if (user.disabledAt) throw new InvalidCredentialsError();` in becomeHost, mirroring login/refresh. Since findById is already called, the check is free.

---

### becomeHost grants host role without verifying email (or disabled state)

- **File:** `apps/api/src/services/auth.service.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 245, 249
- **Slug:** acl-check
- **Confidence:** high

becomeHost (L244-272) loads the user and refuses only if the user is missing (L246) or already a host (L249). It never checks `user.emailVerifiedAt`. Because login (L143) also does not require a verified email, a guest who registered but never clicked the verification link can obtain a session and immediately self-promote to host via POST /users/me/become-host, then create/publish listings and collect Stripe payouts. Project rules explicitly require emailVerifiedAt to be non-null before granting the host role. Secondarily, becomeHost does not check `user.disabledAt`, so a user disabled within the ≤15-minute access-token window (requireAuth does no DB lookup) could still acquire the host role. The added role is then trusted by requireRole('host') on all host routes.

**Recommendation:** In becomeHost, after loading the user, reject (403/precondition-failed) when `!user.emailVerifiedAt`, and also when `user.disabledAt`, before calling createHostProfileAndAddRole.

---

### No rate limiting on authentication endpoints

- **File:** `apps/api/src/services/auth.service.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 143
- **Slug:** rate-limit-bypass
- **Confidence:** medium

login (L143), refresh (L185), register (L104) and verifyEmail (L90) are exposed via unauthenticated /auth/\* routes with no rate-limiting middleware anywhere in the app (confirmed: no express-rate-limit/slow-down usage in apps/api/src; app.ts wires only CORS + express.json). The project's own README and docs/tasks.md specify 5 req/min/IP for register and 10 req/min/IP for login, but those tasks are unchecked and unimplemented. Without throttling, /auth/login is open to online password brute-force and credential stuffing (bcrypt cost 12 slows but does not stop distributed guessing) and /auth/register to automated account/spam creation. The generic login error avoids user enumeration but does not mitigate brute force.

**Recommendation:** Add IP + account rate limiting (express-rate-limit or equivalent) to /auth/login, /auth/register, /auth/refresh, plus progressive backoff/lockout on repeated login failures.

---

### Partial email-verification token written to durable log

- **File:** `apps/api/src/services/email.service.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 36
- **Slug:** secret-in-log
- **Confidence:** low

LoggingEmailService.sendVerificationEmail logs the first 8 characters of the raw verification token via console.info (durable stdout/log aggregation). The token is randomBytes(32).toString('hex') = 64 hex chars (256 bits) and is single-use with a 24h TTL; verifyEmail looks it up by SHA-256 of the FULL token. Logging 8 of 64 hex chars exposes only 32 bits and leaves 224 bits secret, so it is not practically exploitable — the truncation is effectively a deliberate mitigation. Reported at low confidence as a logging-hygiene/defense-in-depth issue: token material of any length in durable logs is best avoided, and in a misconfigured deployment where RESEND_API_KEY is unset this stub becomes the live verification path (auth.ts:12).

**Recommendation:** Do not log token material at all; log only a non-sensitive correlation id (e.g. userId or verification record id). If a breadcrumb is desired, log the token hash prefix rather than the raw token prefix.

---

### Presigned upload content-type not restricted to an image allowlist

- **File:** `apps/api/src/services/listing-photo.service.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 33, 36, 40
- **Slug:** other-unrestricted-upload
- **Confidence:** medium

getUploadUrl passes the client-supplied contentType straight to StorageService.getPresignedUploadUrl, which pins it as the S3/R2 PutObject ContentType. UploadUrlRequestSchema validates contentType only as z.string().min(1) (packages/shared/src/schemas/listing.ts:31-33) — no image allowlist. A host can request a presigned PUT for text/html or image/svg+xml, upload active content to the public bucket, and the object is served back from CLOUDFLARE_R2_PUBLIC_URL with that Content-Type. Navigating to the URL executes the HTML/SVG script, giving stored XSS/phishing/malware hosting on the platform's storage domain; impact depends on whether that domain shares cookie scope with the app (e.g. a \*.nomadhome.com subdomain). The key itself is safe (server-generated photos/<listingId>/<uuid>), so this is specifically a content-type validation gap.

**Recommendation:** Restrict contentType to an explicit image allowlist (e.g. image/jpeg, image/png, image/webp) in UploadUrlRequestSchema and re-check in getUploadUrl before presigning; ensure the bucket serves objects with X-Content-Type-Options: nosniff and, ideally, from a cookieless domain.

---

### Host can reverse an admin listing takedown (DISABLED → PUBLISHED)

- **File:** `apps/api/src/services/listing.service.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 46, 57, 68, 71, 74
- **Slug:** acl-check
- **Confidence:** high

Admin moderation removes a listing via PATCH /admin/listings/:id/disable, which sets status=DISABLED (admin.repository.ts:57-61); the public endpoint GET /listings/:id then 404s it (findPublished filters status=PUBLISHED; asserted by search-ui.test.ts:181). However, publish() (L68-72), unpublish() (L74-77) and update() (L57-66) authorize solely through getOwned() (L46-51), which fetches a listing by id and only checks ownership — it never inspects status, so DISABLED listings pass. disableListing does NOT disable the owning host account, so the host remains active, still passes requireAuth + requireRole('host'), and still owns the listing. The host can therefore call PATCH /listings/:id/publish, which runs updateStatus(id, 'PUBLISHED') (L71) with no allowed-transition guard, restoring the moderated listing to public/searchable/bookable status. This defeats the admin trust-and-safety control (e.g., a fraudulent or policy-violating listing that admins took down is put straight back up by its host). update() similarly lets the host keep editing a disabled listing, and unpublish() moves it to DRAFT — all escaping the DISABLED state that only an admin enable should clear.

**Recommendation:** Treat DISABLED as an admin-locked terminal state that host-facing operations cannot leave. Either reject in the service when listing.status === 'DISABLED' for publish/unpublish/update (throw ListingForbiddenError), or better, enforce it atomically at the DB layer by scoping the transition: e.g. updateStatus should filter where { id, status: { not: 'DISABLED' } } (via updateMany) so DISABLED→PUBLISHED is impossible, and only AdminRepository.enableListing may clear DISABLED.

---

### HTML/content injection into transactional emails via unescaped host-controlled fields

- **File:** `apps/api/src/services/resend.service.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 32, 33, 45, 54
- **Slug:** xss
- **Confidence:** medium

Email bodies are built with template literals that interpolate user-controlled values without HTML-escaping. In sendBookingConfirmation, payload.listingTitle (set by the host who created the listing, no HTML sanitization — CreateListingSchema stores free text) is injected into the HTML sent to the GUEST (L44-47) and host (L54-57). A malicious host can set a listing title like '<a href="https://evil">Reset your payment</a>' or an <img> tracking/phishing payload; every guest who books that listing receives it inside a trusted NomadHome email, enabling convincing phishing and email-client-dependent script execution. sendCancellationToHost (L32-35) similarly injects hostName/listingTitle. Reachability note: booking/cancellation flows are currently wired to LoggingEmailService (bookings.ts:18, stripe.ts:20), so this specific path is latent until the documented Resend binding swap (email.service.ts:32) lands; the sendVerificationEmail path IS live via auth.ts but its inputs (APP_URL env, hex rawToken) are not attacker-controlled. The defect is a real, on-the-roadmap-to-production escaping gap in the email adapter.

**Recommendation:** HTML-escape every interpolated value before placing it in email HTML (e.g. an escapeHtml helper on hostName, listingTitle, guest/host-derived strings), or render via a templating engine with auto-escaping. Also validate/encode the token in the verification link URL with encodeURIComponent for robustness.

---

### JWT verified without algorithm pinning

- **File:** `apps/api/src/services/token.service.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 32
- **Slug:** jwt-handling
- **Confidence:** low

verifyAccessToken calls `jwt.verify(token, this.secret())` (L32) with no `{ algorithms: ['HS256'] }` option; tokens are signed HS256 with a symmetric secret (L28). Missing pinning lets jsonwebtoken accept any algorithm compatible with the key. In the CURRENT code this is not directly exploitable: the only key ever used is the symmetric JWT_SECRET (there is no RSA/EC public key anywhere, so the classic RS256→HS256 confusion has no public key to abuse), and jsonwebtoken rejects alg:'none' when a non-empty key is supplied. This is a defense-in-depth / future-proofing gap: it becomes exploitable the moment an asymmetric verification path is introduced or the verifying key becomes attacker-knowable.

**Recommendation:** Pin the algorithm explicitly: `jwt.verify(token, secret, { algorithms: ['HS256'] })`.

---

### Long-lived refresh token persisted in localStorage (XSS-to-account-takeover amplification)

- **File:** `apps/web/src/contexts/auth.tsx`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 41, 50, 62, 69, 83
- **Slug:** other-token-storage
- **Confidence:** medium

The refresh token is written to and read from window.localStorage (setItem at L50, L62, L69; getItem at L41, L83). Unlike the access token, which is kept in a module-level in-memory variable (apps/web/src/api/client.ts), the refresh token is a long-lived credential and localStorage is readable by any JavaScript executing on the origin. Any XSS flaw anywhere in the SPA — a dependency, a stored review string rendered unsafely, etc. — can read localStorage['nh_refresh_token'] and exfiltrate it, then mint fresh access tokens via /auth/refresh, resulting in persistent account takeover that survives password-change-less. This is a defense-in-depth weakness (it amplifies any XSS rather than being independently exploitable). It is partially mitigated by refresh-token rotation plus the server-side theft-detection referenced in the L33-35 comment: a stolen token will eventually collide with the legitimate client's next refresh and invalidate the family. However, a momentary XSS still yields at least one successful token exchange before detection triggers. The more robust pattern is an httpOnly, Secure, SameSite=strict cookie that JavaScript cannot read.

**Recommendation:** Store the refresh token in an httpOnly, Secure, SameSite cookie set by the /auth/\* endpoints instead of localStorage, so client JS never touches it; keep the short-lived access token in memory as done today. If cookie-based storage is infeasible, keep the current rotation + theft-detection and minimize refresh-token TTL, and treat this as an accepted, documented tradeoff.

---

## HIGH_BUG (3)

### recordPayout persists payouts with no server-side eligibility/amount validation

- **File:** `apps/api/src/controllers/payment.controller.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 50, 57
- **Slug:** other-financial-integrity
- **Confidence:** medium

POST /admin/payouts flows recordPayout -> PaymentService.recordPayout -> PaymentRepository.recordPayout (payment.repository.ts:96-123). The repository blindly inserts a Payout using the admin-supplied hostId, amountCents, currency, method, externalReference and links each supplied bookingId, performing NO validation that: (a) the bookingIds actually belong to hostId, (b) each booking is CONFIRMED with checkOut in the past and not already settled, or (c) amountCents equals the sum of the linked bookings' payoutCents. The only guardrail is the PayoutBooking.bookingId unique constraint (surfaced as DoublePayoutError), which merely prevents settling the exact same booking twice. The documented contract (docs/tasks.md 5.2.5: 'validates all bookingIds belong to host and are eligible, sums amounts') is not implemented. Consequences: an admin (or a compromised/errant admin account) can record a payout whose amount is unrelated to what is actually owed, or attach another host's bookings to a payout, corrupting the payout ledger and the getPayoutSummary 'amount owed' reconciliation (which keys off PayoutBooking linkage). RecordPayoutSchema (packages/shared/src/schemas/payment.ts) validates shape only and does not dedupe or bound bookingIds. This is admin-gated (requireAuth + requireRole('admin')), so it is not exploitable by an unprivileged attacker — hence a data-integrity bug, not a direct security vulnerability. Fix belongs in the service/repository, not the controller.

**Recommendation:** In PaymentService.recordPayout (or the repository, inside the transaction), load the bookings by id and assert every booking belongs to data.hostId, is CONFIRMED with checkOut < today, and is not already linked to a PayoutBooking; compute the payout amount server-side as the sum of the eligible bookings' payoutCents and reject (or ignore) the client-supplied amountCents if it disagrees. Deduplicate bookingIds. Keep the unique-constraint catch as a backstop.

---

### BOOKING_HOLD never released for abandoned (PENDING_PAYMENT) bookings — permanently blocks listing availability

- **File:** `apps/api/src/repositories/booking.repository.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 29, 75
- **Slug:** other-orphaned-booking-hold
- **Confidence:** high

`create()` (L27-40) atomically inserts a Booking (default status PENDING_PAYMENT per schema.prisma L240) and an AvailabilityBlock with source=BOOKING_HOLD that reserves the date range via the DB EXCLUDE constraint. The ONLY code path that deletes a BOOKING_HOLD is `cancel()` (L75-77: deleteMany where bookingId+source=BOOKING_HOLD). But `BookingService.cancel` (booking.service.ts L155-157) throws BOOKING_NOT_CANCELLABLE unless status===CONFIRMED, so a guest cannot cancel an unpaid booking. Meanwhile the Stripe webhook controller (stripe-webhook.controller.ts L27) handles ONLY 'checkout.session.completed' — there is NO 'checkout.session.expired' handler, and a repo-wide grep found no cron/setInterval/cleanup job. Result: if a guest creates a booking and abandons Stripe Checkout (or the session expires), the BOOKING_HOLD lives forever and permanently blocks those dates on the listing. This is directly abusable: an authenticated guest can POST /bookings for many date ranges on a competitor's listing and never pay, locking out the entire calendar (availability denial-of-service). The README (packages/db docs L675) states the intended invariant 'a BOOKING_HOLD row exists iff status ∈ {PENDING_PAYMENT, CONFIRMED}; CANCELLED deletes the hold' — but nothing transitions an abandoned PENDING_PAYMENT booking out of that state or frees its hold.

**Recommendation:** Add a 'checkout.session.expired' branch to the Stripe webhook that transitions the booking to CANCELLED/EXPIRED and deletes its BOOKING_HOLD (reuse the deleteMany in cancel()), and/or add a scheduled sweep that expires stale PENDING_PAYMENT bookings past a TTL and releases their holds. Ensure hold deletion is idempotent.

---

### checkout.session.expired not handled — abandoned checkout permanently blocks listing dates

- **File:** `apps/api/src/routes/stripe.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 31
- **Slug:** other-orphaned-hold
- **Confidence:** high

The Stripe webhook (mounted here at L31, logic in stripe-webhook.controller.ts) only handles `checkout.session.completed`. Booking creation (booking.repository.ts create) inserts a `BOOKING_HOLD` AvailabilityBlock in the same transaction, and the DB EXCLUDE constraint blocks any overlapping booking on those dates. When a guest starts checkout and then abandons it, Stripe fires `checkout.session.expired` — which is silently ignored, so the hold is never deleted. The booking also stays `PENDING_PAYMENT`, and BookingService.cancel refuses to cancel anything that isn't `CONFIRMED` (booking.service.ts L155), so neither the guest nor the system can release the hold. Result: every abandoned checkout permanently blocks those dates for that listing, degrading host inventory over time. The project threat model explicitly calls this out: 'An orphaned hold permanently blocks those dates.'

**Recommendation:** Handle `checkout.session.expired` (and `checkout.session.async_payment_failed`) in the webhook controller: delete the `BOOKING_HOLD` AvailabilityBlock for the session's booking and transition the booking to EXPIRED/CANCELLED. Optionally add a sweeper for holds whose Stripe session is no longer open.

---

## BUG (9)

### enableListing force-publishes listings that were DRAFT before being disabled

- **File:** `apps/api/src/repositories/admin.repository.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 64, 65, 66, 67, 68, 69, 14
- **Slug:** other-state-machine-bug
- **Confidence:** medium

enableListing() unconditionally sets status to PUBLISHED. However a DRAFT listing can legitimately reach DISABLED: disableUser()'s cascade disables listings with status in ['PUBLISHED','DRAFT'] (line 14), and disableListing() operates on any listingId regardless of prior status. Sequence: host creates a DRAFT listing -> admin disables the host (or the listing) -> listing becomes DISABLED -> admin later enables the listing -> it becomes PUBLISHED even though the host never published it. This exposes an unfinished/unreviewed draft (potentially with placeholder pricing, incomplete description, or wrong availability) to the public search/listing surface. The pre-disable status is not preserved, so enable cannot correctly restore it.

**Recommendation:** Record the status prior to disabling (e.g., a `previousStatus` column or only setting DISABLED from PUBLISHED) and restore it on enable, or restrict enableListing to listings whose previous state was PUBLISHED. Do not blanket-set PUBLISHED.

---

### Disabling a user emits no user_disabled audit event

- **File:** `apps/api/src/repositories/admin.repository.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 7, 8, 9, 10, 11, 46
- **Slug:** other-missing-audit-log
- **Confidence:** medium

disableUser() sets disabledAt, cascades to listings, and creates BookingFlag rows, but never records an AuthAuditEvent. The AuthAuditEventType enum defines a `user_disabled` value specifically for this action, yet no code path writes it (verified across admin.repository.ts, admin.service.ts, and admin-moderation.controller.ts). The MVP compliance scope requires a 'basic audit log of auth events'; account disablement is a security-relevant admin action and should be captured. Without it, there is no trail of who disabled whom or when.

**Recommendation:** Within the disableUser transaction, insert an AuthAuditEvent with event 'user_disabled', the target userId, and metadata identifying the acting adminId.

---

### Disabling a user does not revoke refresh tokens (design drift)

- **File:** `apps/api/src/repositories/admin.repository.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 7, 8, 9, 10, 11, 47
- **Slug:** other-defense-in-depth
- **Confidence:** low

The documented auth design states refresh tokens are 'revoked in bulk when a user is disabled (admin cascade)'. disableUser() performs no RefreshToken revocation (no updateMany setting revokedAt). In practice this is compensated: AuthService.refresh() re-loads the user and rejects when user.disabledAt is set (auth.service.ts line 210), so a disabled user cannot mint new tokens; the existing short-lived access token remains valid until expiry (the documented, accepted window). The residual risk is purely defense-in-depth: the stale token rows persist, and if the refresh-endpoint disabledAt check were ever refactored away, the tokens would silently become usable again. Flagging as low-impact drift between stated design and implementation.

**Recommendation:** For belt-and-suspenders parity with the documented design, add `tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })` inside the disableUser transaction.

---

### recordPayout does not validate booking ownership, eligibility, or amount

- **File:** `apps/api/src/repositories/payment.repository.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 96, 116, 117, 118, 119
- **Slug:** other-financial-integrity
- **Confidence:** medium

recordPayout() creates a Payout for a given hostId and links every UUID in bookingIds via PayoutBooking, with no check that (a) each booking's hostId equals data.hostId, (b) the bookings are CONFIRMED / past checkout / unsettled, or (c) amountCents equals the sum of the linked bookings' payoutCents. The RecordPayoutSchema only validates shape. The DB `PayoutBooking.bookingId @unique` constraint prevents settling the same booking twice, but nothing prevents attaching Host B's booking to Host A's payout: doing so marks Host B's booking as settled (getPayoutSummary filters on `payoutBooking: null`), so Host B is silently never paid for it, and the recorded amount can diverge from what was actually owed. The endpoint is admin-only (router.use(requireAuth, requireRole('admin'))), so this is an integrity footgun for a trusted operator rather than an attacker-exploitable vulnerability, but it undermines the financial-integrity invariant the threat model prioritizes.

**Recommendation:** In recordPayout (or the service), load the referenced bookings and assert each belongs to hostId, is CONFIRMED with checkOut in the past, and is not already settled; assert amountCents equals the sum of their payoutCents (and matches currency). Reject with a domain error otherwise, inside the same transaction.

---

### enableListing force-sets status to PUBLISHED, publishing drafts and bypassing the photo invariant

- **File:** `apps/api/src/routes/admin.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 42
- **Slug:** other-logic-bug
- **Confidence:** medium

PATCH /admin/listings/:id/enable → AdminRepository.enableListing sets status unconditionally to `PUBLISHED` (admin.repository.ts L64-68). The user-disable cascade (disableUser) moves BOTH `PUBLISHED` and `DRAFT` listings to `DISABLED`. So a listing that was a DRAFT before the host was disabled becomes PUBLISHED when an admin later re-enables it — going live even though it was never published and bypassing the 'must have at least one photo to publish' invariant enforced in ListingService.publish. This corrupts listing state and can surface incomplete/photoless listings to guests.

**Recommendation:** Record the pre-disable status (or restore to DRAFT) rather than force-publishing. enableListing should return the listing to its prior state, and only re-publish if it satisfies the publish invariants.

---

### Booking creation accepts past check-in dates

- **File:** `apps/api/src/services/booking.service.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 82, 90
- **Slug:** other-logic-bug
- **Confidence:** medium

create() (L77-122) computes nights/pricing and inserts a booking but never validates that checkIn is today or in the future. CreateBookingSchema only enforces checkOut > checkIn (lexical ISO-date compare), so a client can book an entirely past range (e.g. 2020-01-01..2020-01-05). This creates a PENDING_PAYMENT booking plus an AvailabilityBlock for past dates that can never be cancelled — cancel() throws CHECKIN_ALREADY_PASSED once `booking.checkIn <= today` (L160) — leaving an orphaned hold/booking. No security impact, but a data-integrity/logic gap (and a way to create nonsensical bookings).

**Recommendation:** Validate checkIn >= current UTC date at the schema or service layer and reject past-dated bookings.

---

### Startup refresh discards a valid refresh token on any error, including transient network failures

- **File:** `apps/web/src/contexts/auth.tsx`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 53, 54, 55
- **Slug:** other-logic-bug
- **Confidence:** low

In the mount effect (L46-56), the .catch at L53-55 removes the stored refresh token from localStorage on ANY rejection from authApi.refresh — not just an invalid/expired-token 401. apiFetch rejects with an ApiError on non-2xx responses but also rejects if fetch() itself fails (offline, DNS failure, API temporarily down, CORS hiccup). In those transient cases the still-valid refresh token is permanently deleted, silently logging the user out and forcing a full re-login even though their credential was fine. This is a robustness/UX bug, not a security hole.

**Recommendation:** Only clear the stored refresh token when the failure is an authentication failure (e.g., inspect ApiError.status === 401/403); on network/5xx errors, leave the token in place and surface a retry rather than logging the user out.

---

### computeNights renders NaN total for invalid/unparseable date params

- **File:** `apps/web/src/pages/BookingFormPage.tsx`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 14, 15, 16, 17, 29, 78, 79
- **Slug:** other-logic-bug
- **Confidence:** medium

checkIn/checkOut come from URL search params and are only guarded by hasDates (length > 0), never validated as dates. If a user opens /listings/:id/book?checkIn=x&checkOut=y with unparseable values, new Date(...) yields NaN, so computeNights returns NaN (Math.max(0, NaN) === NaN) and the displayed total becomes '$NaN'. No security or financial impact — the actual charge is computed server-side and invalid dates are rejected at booking creation — but it is a broken-display logic gap reachable by editing the URL.

**Recommendation:** Validate checkIn/checkOut as real ISO dates (e.g. Zod date parse or Number.isNaN(new Date(x).getTime())) before rendering; fall back to the 'select dates' state when they don't parse or checkOut <= checkIn.

---

### isoDate regex accepts semantically invalid dates (e.g. 2026-13-45)

- **File:** `packages/shared/src/schemas/listing.ts`
- **Recent committers:** Luciano Ramello <luchosr@gmail.com>
- **Lines:** 47, 54
- **Slug:** other-weak-validation
- **Confidence:** low

The `isoDate` validator (L47) only enforces the shape `\d{4}-\d{2}-\d{2}` — it does not validate that the month/day are real. Values like `2026-13-45`, `2026-00-00`, or `0000-99-99` pass validation. `BlockDateRangeSchema.refine((d) => d.endDate > d.startDate)` then compares them as strings, so a nonsense-but-lexicographically-greater endDate also passes. A host submitting such a range to the availability-block endpoint pushes an invalid date into the persistence layer; when it reaches PostgreSQL's date/daterange parsing it throws, surfacing as an unhandled 500 rather than a clean 400. This is a robustness/validation gap, not a security hole (host-only input, DB rejects truly invalid values), but it defeats the purpose of client/server shared validation.

**Recommendation:** Validate real calendar dates, e.g. `z.string().refine((s) => !Number.isNaN(Date.parse(s)) && /^\d{4}-\d{2}-\d{2}$/.test(s))` or use `z.coerce.date()` / a date library, then compare as Date objects. Keeps a nonsense date from reaching the DB as a 500.

---
