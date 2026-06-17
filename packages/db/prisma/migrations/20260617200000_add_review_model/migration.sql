-- Migration: add_review_model
-- Adds the Review table for NH-015.

CREATE TABLE "Review" (
  "id"        TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "guestId"   TEXT NOT NULL,
  "rating"    INTEGER NOT NULL,
  "text"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");
CREATE INDEX "Review_listingId_idx" ON "Review"("listingId");
CREATE INDEX "Review_guestId_idx" ON "Review"("guestId");

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_guestId_fkey"
  FOREIGN KEY ("guestId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
