# Tasks: add-payments

## 1. Database

- [x] 1.1 Add `StripeProcessedEvent` model to `packages/db/prisma/schema.prisma`
- [x] 1.2 Add `Payout` model to `packages/db/prisma/schema.prisma`
- [x] 1.3 Add `PayoutBooking` join model to `packages/db/prisma/schema.prisma` (`bookingId @unique`)
- [x] 1.4 Generate migration SQL and apply via `prisma migrate resolve --applied`
- [x] 1.5 Add Stripe SDK to `apps/api` dependencies (`stripe`)

## 2. Shared schemas

- [x] 2.1 Add `RecordPayoutSchema` in `packages/shared/src/schemas/payment.ts`
- [x] 2.2 Add payment error strings to `packages/shared/src/strings/en.ts`
- [x] 2.3 Export from `packages/shared/src/index.ts`

## 3. Backend — Stripe Checkout

- [x] 3.1 Add `createCheckoutSession` and `confirmBookingFromWebhook` to `apps/api/src/repositories/payment.repository.ts`
- [x] 3.2 Add `PaymentService` in `apps/api/src/services/payment.service.ts`
- [x] 3.3 Add `POST /bookings/:id/checkout` route in `apps/api/src/routes/bookings.ts`
- [x] 3.4 Add `POST /stripe/webhook` route with `express.raw()` middleware in `apps/api/src/routes/stripe.ts`
- [x] 3.5 Wire `/stripe/webhook` before `express.json()` in `apps/api/src/app.ts`

## 4. Backend — Admin payouts

- [x] 4.1 Add `getPayoutSummary` and `recordPayout` to `apps/api/src/repositories/payment.repository.ts`
- [x] 4.2 Add `GET /admin/payouts` and `POST /admin/payouts` routes in `apps/api/src/routes/admin.ts`
- [x] 4.3 Wire `/admin` router in `apps/api/src/app.ts`

## 5. Tests

- [x] 5.1 Integration tests for `POST /bookings/:id/checkout` (happy path, wrong owner, non-pending status)
- [x] 5.2 Integration tests for `POST /stripe/webhook` (valid event confirms booking, duplicate event ignored, bad signature 400)
- [x] 5.3 Integration tests for `GET /admin/payouts` (happy path, non-admin 403)
- [x] 5.4 Integration tests for `POST /admin/payouts` (happy path, double-settle 409, non-admin 403)

## 6. Open decisions & env

- [x] 6.1 Remove the `payments` fee-rates row from `openspec/project.md §8` and `docs/OPEN-DECISIONS.md`
- [x] 6.2 Remove the `booking` cancellation-policy row from `openspec/project.md §8` and `docs/OPEN-DECISIONS.md`
- [x] 6.3 Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env.example` and `apps/api/.env.example`
