import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const app = createApp();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createUser(email: string, opts: { host?: boolean } = {}) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("pass1234567", 12),
      emailVerifiedAt: new Date(),
      roles: opts.host ? ["guest", "host"] : ["guest"],
    },
  });
}

async function tokenFor(userId: string) {
  const res = await request(app)
    .post("/auth/login")
    .send({
      email: (await prisma.user.findUnique({ where: { id: userId } }))!.email,
      password: "pass1234567",
    });
  return (res.body as { accessToken: string }).accessToken;
}

async function createListing(hostId: string) {
  await prisma.amenity.createMany({
    data: [{ code: "wifi", label: "Wi-Fi" }],
    skipDuplicates: true,
  });
  const listing = await prisma.listing.create({
    data: {
      hostId,
      title: "Test Listing",
      description: "A place.",
      type: "PROPERTY",
      city: "Lisbon",
      country: "PT",
      addressLine: "Rua A 1",
      capacity: 2,
      nightlyRateCents: 10000,
      currency: "USD",
      status: "PUBLISHED",
    },
  });
  await prisma.listingPhoto.create({
    data: { listingId: listing.id, url: "https://example.com/photo.jpg", position: 0 },
  });
  return listing;
}

async function createConfirmedBooking(
  guestId: string,
  listingId: string,
  hostId: string,
  checkOut: Date,
) {
  const feeConfig = await prisma.platformFeeConfig.findFirst({ orderBy: { createdAt: "desc" } });
  const nights = 3;
  const nightlyRateCents = 10000;
  const subtotalCents = nightlyRateCents * nights;
  const guestServiceFeeCents = Math.floor(
    (subtotalCents * (feeConfig?.guestServiceFeeBps ?? 1500)) / 10000,
  );
  const hostCommissionCents = Math.floor(
    (subtotalCents * (feeConfig?.hostCommissionBps ?? 300)) / 10000,
  );

  return prisma.booking.create({
    data: {
      listingId,
      guestId,
      hostId,
      checkIn: new Date("2025-01-01"),
      checkOut,
      nights,
      nightlyRateCents,
      subtotalCents,
      guestServiceFeeBps: feeConfig?.guestServiceFeeBps ?? 1500,
      guestServiceFeeCents,
      hostCommissionBps: feeConfig?.hostCommissionBps ?? 300,
      hostCommissionCents,
      currency: "USD",
      totalChargedCents: subtotalCents + guestServiceFeeCents,
      payoutCents: subtotalCents - hostCommissionCents,
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });
}

// ---------------------------------------------------------------------------
// POST /bookings/:id/review
// ---------------------------------------------------------------------------

describe.skipIf(!hasDatabase)("POST /bookings/:id/review", () => {
  beforeEach(async () => {
    await resetDatabase();
    await prisma.platformFeeConfig.create({
      data: { guestServiceFeeBps: 1500, hostCommissionBps: 300, createdBy: "system" },
    });
  });

  it("creates a review and updates listing aggregate (201)", async () => {
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createListing(host.id);
    // checkOut in the past
    await createConfirmedBooking(guest.id, listing.id, host.id, new Date("2025-06-01"));

    const booking = await prisma.booking.findFirst({ where: { guestId: guest.id } });

    const res = await request(app)
      .post(`/bookings/${booking!.id}/review`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ rating: 4, text: "Great stay!" });

    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(4);
    expect(res.body.bookingId).toBe(booking!.id);

    const updated = await prisma.listing.findUnique({ where: { id: listing.id } });
    expect(updated!.reviewCount).toBe(1);
    expect(Number(updated!.averageRating)).toBeCloseTo(4, 1);
  });

  it("returns 409 REVIEW_ALREADY_EXISTS on duplicate review", async () => {
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createListing(host.id);
    await createConfirmedBooking(guest.id, listing.id, host.id, new Date("2025-06-01"));
    const booking = await prisma.booking.findFirst({ where: { guestId: guest.id } });

    await request(app)
      .post(`/bookings/${booking!.id}/review`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ rating: 5 });

    const res = await request(app)
      .post(`/bookings/${booking!.id}/review`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ rating: 3 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("REVIEW_ALREADY_EXISTS");
  });

  it("returns 422 CHECKOUT_NOT_PASSED when checkOut is today or future", async () => {
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createListing(host.id);
    const future = new Date();
    future.setDate(future.getDate() + 5);
    await createConfirmedBooking(guest.id, listing.id, host.id, future);
    const booking = await prisma.booking.findFirst({ where: { guestId: guest.id } });

    const res = await request(app)
      .post(`/bookings/${booking!.id}/review`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ rating: 4 });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("CHECKOUT_NOT_PASSED");
  });

  it("returns 404 when booking belongs to another guest", async () => {
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const other = await createUser("other@test.com");
    const otherToken = await tokenFor(other.id);
    const listing = await createListing(host.id);
    await createConfirmedBooking(guest.id, listing.id, host.id, new Date("2025-06-01"));
    const booking = await prisma.booking.findFirst({ where: { guestId: guest.id } });

    const res = await request(app)
      .post(`/bookings/${booking!.id}/review`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ rating: 4 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("BOOKING_NOT_FOUND");
    expect(typeof res.body.message).toBe("string");
    expect(res.body.message.length).toBeGreaterThan(0);
  });

  it("returns 422 BOOKING_NOT_CONFIRMED for a PENDING_PAYMENT booking", async () => {
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createListing(host.id);
    await createConfirmedBooking(guest.id, listing.id, host.id, new Date("2025-06-01"));
    const booking = await prisma.booking.findFirst({ where: { guestId: guest.id } });
    await prisma.booking.update({
      where: { id: booking!.id },
      data: { status: "PENDING_PAYMENT", confirmedAt: null },
    });

    const res = await request(app)
      .post(`/bookings/${booking!.id}/review`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ rating: 4 });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("BOOKING_NOT_CONFIRMED");
  });

  it("returns 422 validation error for rating out of range", async () => {
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createListing(host.id);
    await createConfirmedBooking(guest.id, listing.id, host.id, new Date("2025-06-01"));
    const booking = await prisma.booking.findFirst({ where: { guestId: guest.id } });

    const res = await request(app)
      .post(`/bookings/${booking!.id}/review`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ rating: 6 });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("validation");
  });
});

// ---------------------------------------------------------------------------
// GET /listings/:id/reviews
// ---------------------------------------------------------------------------

describe.skipIf(!hasDatabase)("GET /listings/:id/reviews", () => {
  beforeEach(async () => {
    await resetDatabase();
    await prisma.platformFeeConfig.create({
      data: { guestServiceFeeBps: 1500, hostCommissionBps: 300, createdBy: "system" },
    });
  });

  it("returns reviews and aggregate for a listing with reviews (200)", async () => {
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createListing(host.id);
    await createConfirmedBooking(guest.id, listing.id, host.id, new Date("2025-06-01"));
    const booking = await prisma.booking.findFirst({ where: { guestId: guest.id } });

    await request(app)
      .post(`/bookings/${booking!.id}/review`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ rating: 5, text: "Perfect!" });

    const res = await request(app).get(`/listings/${listing.id}/reviews`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.reviews[0].rating).toBe(5);
    expect(res.body.averageRating).toBeCloseTo(5, 1);
    expect(res.body.reviewCount).toBe(1);
  });

  it("returns empty list and null aggregate for a listing with no reviews (200)", async () => {
    const host = await createUser("host@test.com", { host: true });
    const listing = await createListing(host.id);

    const res = await request(app).get(`/listings/${listing.id}/reviews`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(0);
    expect(res.body.averageRating).toBeNull();
    expect(res.body.reviewCount).toBe(0);
  });
});
