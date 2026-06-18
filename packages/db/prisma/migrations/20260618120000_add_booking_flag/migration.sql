CREATE TYPE "BookingFlagReason" AS ENUM ('HOST_DISABLED', 'GUEST_DISABLED');

CREATE TABLE "BookingFlag" (
    "id"        TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "reason"    "BookingFlagReason" NOT NULL,
    "adminId"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingFlag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingFlag_bookingId_idx" ON "BookingFlag"("bookingId");

ALTER TABLE "BookingFlag" ADD CONSTRAINT "BookingFlag_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
