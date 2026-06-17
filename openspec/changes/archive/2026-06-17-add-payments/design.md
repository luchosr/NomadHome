# Design: add-payments

## ADR-001: Fee rates confirmed at 1500 bps guest / 300 bps host

**Decision**: Guest service fee = 1500 bps (15 % of subtotal). Host commission = 300 bps (3 % of subtotal). These values are pre-seeded in `PlatformFeeConfig` (NH-013) and confirmed here.

**Context**: `openspec/project.md §8` tracked this as an open decision pending Gate 1 of `add-payments`. The tiebreaker anchor was "comparable to Airbnb's combined fees (~15 % guest + ~3 % host)."

**Rationale**: Values match the anchor exactly. Effective take-rate = 15 % from guests + 3 % from hosts ≈ 18 % blended, competitive with Airbnb's real-world 17–21 % range. Values can change at runtime by inserting a new `PlatformFeeConfig` row; code is not affected.

**Closed**: this PR. Row removed from `openspec/project.md §8`.

---

## ADR-002: Cancellation policy — flat single-tier (resolved in NH-013, closed here)

**Decision**: Any confirmed booking cancelled before check-in → `RefundRequest(PENDING_ADMIN, totalChargedCents)`. No tiered windows (flexible / moderate / strict deferred to post-MVP).

**Context**: `openspec/project.md §8` tracked this as open pending NH-013. It was resolved during NH-013 implementation but the tracker row was not removed in that PR.

**Closed**: this PR. Row removed from `openspec/project.md §8`.

---

## ADR-003: BOOKING_HOLD persists through Stripe session expiry

**Decision**: When a Stripe Checkout session is abandoned or expires, the `BOOKING_HOLD` availability block is **not** released. The booking stays in `PENDING_PAYMENT`; the guest can submit `POST /bookings/:id/checkout` again to obtain a new session.

**Rationale**: Releasing the hold on session expiry would require a Stripe `checkout.session.expired` webhook handler (and a cleanup job for race windows). For MVP this complexity isn't warranted. The trade-off: dates stay blocked while a payment intent is outstanding. In practice, Stripe sessions expire after 24 h by default; guests or admins can cancel the booking to free the dates sooner.

---

## ADR-004: Webhook signature verification with raw body

**Decision**: The `POST /stripe/webhook` route is mounted **before** `express.json()` in `apps/api/src/app.ts` and uses `express.raw({ type: 'application/json' })` to preserve the raw request body. `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)` verifies the signature.

**Rationale**: Stripe signature verification requires the raw unparsed body. If `express.json()` parses the body first, the raw buffer is lost and signature verification fails.

---

## ADR-005: Webhook idempotency via StripeProcessedEvent

**Decision**: On each `checkout.session.completed` event, the handler inserts a `StripeProcessedEvent` row (unique on `stripeEventId`) before modifying the booking. On conflict (duplicate delivery), the handler returns `200 OK` immediately without side effects.

**Rationale**: Stripe delivers webhooks at-least-once. Without deduplication, a retry after a slow DB write could double-confirm a booking or send duplicate emails. The `StripeProcessedEvent` table acts as an idempotency ledger; the unique constraint makes the check atomic.

---

## ADR-006: Admin role check via requireRole middleware

**Decision**: Admin routes use a `requireRole('admin')` middleware that checks `req.user.roles.includes('admin')` and returns `403 Forbidden` otherwise. No separate admin-only JWT or separate token scope.

**Rationale**: The identity capability already places roles in the JWT payload. Reusing this avoids new token infrastructure. For MVP, admin is a single role; multi-tier admin roles are post-MVP.
