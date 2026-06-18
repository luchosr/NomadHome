# Proposal: add-host-dashboard

## Why

Hosts need a way to see their upcoming confirmed bookings so they can prepare for guest arrivals. This is the minimal host-facing surface required by US-7.1 and the last piece of the host workflow in the MVP booking loop.

## What Changes

- New endpoint `GET /bookings/host-upcoming` — returns all `CONFIRMED` bookings where `hostId` matches the authenticated host and `checkIn >= today`, sorted by `checkIn ASC`, including listing title and guest email.

## Impact

- **Capabilities affected**: `bookings`
- **Breaking changes**: no
- **Migration required**: no
- **Out of scope**: host dashboard UI (frontend deferred), booking cancellation by host, payout status per booking

## Risks & Mitigations

| Risk                                   | Likelihood            | Mitigation                                              |
| -------------------------------------- | --------------------- | ------------------------------------------------------- |
| Large result set for high-volume hosts | Low (MVP pilot scale) | Add pagination in post-MVP; for now return all upcoming |

## Rollout

Deployed behind `requireAuth + requireRole("host")` — no feature flag needed.
