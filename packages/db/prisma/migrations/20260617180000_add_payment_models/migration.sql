-- Migration: add_payment_models
-- Adds StripeProcessedEvent, Payout, and PayoutBooking tables for NH-014.

CREATE TABLE "StripeProcessedEvent" (
  "id"            TEXT NOT NULL,
  "stripeEventId" TEXT NOT NULL,
  "eventType"     TEXT NOT NULL,
  "bookingId"     TEXT,
  "processedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StripeProcessedEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StripeProcessedEvent_stripeEventId_key"
  ON "StripeProcessedEvent"("stripeEventId");

CREATE TABLE "Payout" (
  "id"                TEXT NOT NULL,
  "hostId"            TEXT NOT NULL,
  "amountCents"       INTEGER NOT NULL,
  "currency"          TEXT NOT NULL,
  "method"            TEXT NOT NULL,
  "externalReference" TEXT NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy"         TEXT NOT NULL,

  CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Payout_hostId_idx" ON "Payout"("hostId");

ALTER TABLE "Payout"
  ADD CONSTRAINT "Payout_hostId_fkey"
  FOREIGN KEY ("hostId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PayoutBooking" (
  "id"        TEXT NOT NULL,
  "payoutId"  TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,

  CONSTRAINT "PayoutBooking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayoutBooking_bookingId_key" ON "PayoutBooking"("bookingId");
CREATE INDEX "PayoutBooking_payoutId_idx" ON "PayoutBooking"("payoutId");

ALTER TABLE "PayoutBooking"
  ADD CONSTRAINT "PayoutBooking_payoutId_fkey"
  FOREIGN KEY ("payoutId") REFERENCES "Payout"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PayoutBooking"
  ADD CONSTRAINT "PayoutBooking_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
