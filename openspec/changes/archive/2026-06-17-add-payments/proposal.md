# Proposal: add-payments

## Why

NH-013 (`add-booking`) created bookings in `PENDING_PAYMENT` status but left them permanently in that state — there is no mechanism to collect payment or confirm a booking. This ticket closes that gap by wiring Stripe Checkout to the booking lifecycle, exposing the admin payouts view, and providing the manual payout-recording API.

Without this change, the end-to-end booking loop (search → book → pay → stay → review) is broken between "book" and "pay", making the MVP unshippable.

Ticket: NH-014

## What

- **`POST /bookings/:id/checkout`** — authenticated guest creates a Stripe Checkout session for a `PENDING_PAYMENT` booking they own. Returns the Checkout `url`. Stores the `stripeCheckoutSessionId` on the booking.
- **`POST /stripe/webhook`** — unauthenticated endpoint (Stripe signature verified). Handles `checkout.session.completed`: transitions the booking to `CONFIRMED`, sets `confirmedAt` and `stripePaymentIntentId`, sends confirmation emails to both guest and host. Idempotent via `StripeProcessedEvent` deduplication.
- **`GET /admin/payouts`** — authenticated admin lists hosts with a non-zero amount owed (sum of `Booking.payoutCents` where status=CONFIRMED, checkOut < today, booking not yet in a `PayoutBooking` row), grouped by currency.
- **`POST /admin/payouts`** — authenticated admin records a manual out-of-band payout, linking a set of qualifying bookings. Prevents double-settlement via `PayoutBooking.bookingId UNIQUE`.
- **Close the guest service fee / host commission open decision**: rates are confirmed at guestServiceFeeBps=1500 (15 %) and hostCommissionBps=300 (3 %), already seeded in `PlatformFeeConfig`. This decision is locked and removed from the open-decisions tracker.
- **Close the cancellation policy open decision** (resolved in NH-013 but never removed from the tracker): flat single-tier, any CONFIRMED pre-check-in cancellation → full refund `PENDING_ADMIN`.

## Impact

- **Capabilities affected**: `payments`
- **Breaking changes**: none — adds new endpoints and models only
- **Migration required**: yes — adds `StripeProcessedEvent`, `Payout`, `PayoutBooking` tables
- **Out of scope**:
  - Automated payouts or Stripe Connect (post-MVP)
  - Partial refunds or refund automation (post-MVP)
  - Frontend Checkout redirect UI (frontend is NH-016 / host tooling; backend returns the URL)
  - Email sending via a real provider (LoggingEmailService stub continues; production wiring is a separate infra change)

## Risks & Mitigations

| Risk                                                  | Likelihood | Mitigation                                                                                                                            |
| ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate webhook delivery causes double-confirmation | Medium     | `StripeProcessedEvent` deduplication on `stripeEventId`; idempotent booking update                                                    |
| Race: two Checkout sessions open for the same booking | Low        | Only one session allowed per PENDING_PAYMENT booking; second `POST /checkout` returns existing session URL if session is still active |
| Admin double-settles a booking                        | Low        | `PayoutBooking.bookingId @unique` enforced at DB level → 409 on conflict                                                              |
| Stripe signature verification bypassed                | Low        | `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET` env var; 400 on invalid signature                                       |

## Rollout

Big bang — endpoints are additive. No feature flag needed. Stripe test-mode keys used in dev/CI; production keys provisioned separately via environment variables.
