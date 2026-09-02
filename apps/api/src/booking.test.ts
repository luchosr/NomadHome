import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const app = createApp();

async function createUser(email: string, opts: { host?: boolean; emailVerified?: boolean } = {}) {
  const emailVerified = opts.emailVerified ?? true;
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("pass1234567", 12),
      emailVerifiedAt: emailVerified ? new Date() : null,
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

async function seedFeeConfig() {
  return prisma.platformFeeConfig.create({
    data: { guestServiceFeeBps: 1500, hostCommissionBps: 300, createdBy: "system" },
  });
}

async function createPublishedListing(hostId: string) {
  await prisma.amenity.createMany({
    data: [{ code: "wifi", label: "Wi-Fi" }],
    skipDuplicates: true,
  });
  const listing = await prisma.listing.create({
    data: {
      hostId,
      title: "Test Listing",
      description: "A great place.",
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

describe.skipIf(!hasDatabase)("POST /bookings", () => {
  beforeEach(() => resetDatabase());

  it("creates a booking with correct fee snapshot and BOOKING_HOLD (201)", async () => {
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ listingId: listing.id, checkIn: "2027-01-10", checkOut: "2027-01-15" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING_PAYMENT");
    expect(res.body.nights).toBe(5);
    expect(res.body.subtotalCents).toBe(50000);
    expect(res.body.guestServiceFeeBps).toBe(1500);
    expect(res.body.guestServiceFeeCents).toBe(7500);
    expect(res.body.totalChargedCents).toBe(57500);
    expect(res.body.hostCommissionBps).toBe(300);
    expect(res.body.hostCommissionCents).toBe(1500);
    expect(res.body.payoutCents).toBe(48500);

    const hold = await prisma.availabilityBlock.findFirst({ where: { bookingId: res.body.id } });
    expect(hold?.source).toBe("BOOKING_HOLD");
  });

  it("returns 409 OVERLAP_CONFLICT when dates overlap an existing block", async () => {
    const host = await createUser("host2@test.com", { host: true });
    const guest = await createUser("guest2@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    await prisma.availabilityBlock.create({
      data: {
        listingId: listing.id,
        startDate: new Date("2027-01-12"),
        endDate: new Date("2027-01-14"),
        source: "HOST_BLOCK",
      },
    });

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ listingId: listing.id, checkIn: "2027-01-10", checkOut: "2027-01-15" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("OVERLAP_CONFLICT");
    expect(typeof res.body.message).toBe("string");
    expect(res.body.message.length).toBeGreaterThan(0);
  });

  it("returns 422 SELF_BOOKING_NOT_ALLOWED when guest books own listing", async () => {
    const host = await createUser("host3@test.com", { host: true });
    const hostToken = await tokenFor(host.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ listingId: listing.id, checkIn: "2027-01-10", checkOut: "2027-01-15" });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("SELF_BOOKING_NOT_ALLOWED");
  });

  it("returns 404 when listing is not PUBLISHED", async () => {
    const host = await createUser("host4@test.com", { host: true });
    const guest = await createUser("guest4@test.com");
    const guestToken = await tokenFor(guest.id);
    await seedFeeConfig();
    const listing = await prisma.listing.create({
      data: {
        hostId: host.id,
        title: "Draft",
        description: "d",
        type: "PROPERTY",
        city: "Porto",
        country: "PT",
        addressLine: "X",
        capacity: 1,
        nightlyRateCents: 5000,
        currency: "USD",
        status: "DRAFT",
      },
    });

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ listingId: listing.id, checkIn: "2027-01-10", checkOut: "2027-01-15" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("LISTING_NOT_AVAILABLE");
    expect(typeof res.body.message).toBe("string");
    expect(res.body.message.length).toBeGreaterThan(0);
  });

  it("returns 422 when checkOut is not after checkIn", async () => {
    const host = await createUser("host5@test.com", { host: true });
    const guest = await createUser("guest5@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ listingId: listing.id, checkIn: "2027-01-15", checkOut: "2027-01-10" });

    expect(res.status).toBe(422);
  });

  it("returns 401 for unauthenticated request", async () => {
    const res = await request(app)
      .post("/bookings")
      .send({ listingId: "any", checkIn: "2027-01-10", checkOut: "2027-01-15" });
    expect(res.status).toBe(401);
  });

  it("returns 403 EMAIL_NOT_VERIFIED when guest email is not verified", async () => {
    const host = await createUser("host6@test.com", { host: true });
    const guest = await createUser("guest6@test.com", { emailVerified: false });
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ listingId: listing.id, checkIn: "2027-01-10", checkOut: "2027-01-15" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("EMAIL_NOT_VERIFIED");
    expect(await prisma.booking.count()).toBe(0);
  });
});

describe.skipIf(!hasDatabase)("GET /bookings/:id", () => {
  beforeEach(() => resetDatabase());

  it("returns own booking (200)", async () => {
    const host = await createUser("host-g1@test.com", { host: true });
    const guest = await createUser("guest-g1@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    const createRes = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ listingId: listing.id, checkIn: "2027-02-01", checkOut: "2027-02-03" });

    const res = await request(app)
      .get(`/bookings/${createRes.body.id}`)
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createRes.body.id);
    expect(res.body.guestServiceFeeBps).toBe(1500);
  });

  it("returns 404 for another guest's booking", async () => {
    const host = await createUser("host-g2@test.com", { host: true });
    const guest1 = await createUser("guest-g2a@test.com");
    const guest2 = await createUser("guest-g2b@test.com");
    const token1 = await tokenFor(guest1.id);
    const token2 = await tokenFor(guest2.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    const createRes = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ listingId: listing.id, checkIn: "2027-03-01", checkOut: "2027-03-03" });

    const res = await request(app)
      .get(`/bookings/${createRes.body.id}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(404);
  });
});

describe.skipIf(!hasDatabase)("GET /bookings/me", () => {
  beforeEach(() => resetDatabase());

  it("returns paginated list of own bookings ordered by createdAt desc", async () => {
    const host = await createUser("host-m1@test.com", { host: true });
    const guest = await createUser("guest-m1@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ listingId: listing.id, checkIn: "2027-04-01", checkOut: "2027-04-03" });
    await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ listingId: listing.id, checkIn: "2027-05-01", checkOut: "2027-05-03" });

    const res = await request(app)
      .get("/bookings/me?page=1&limit=20")
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });
});

describe.skipIf(!hasDatabase)("POST /bookings/:id/cancel", () => {
  beforeEach(() => resetDatabase());

  it("cancels a CONFIRMED booking before check-in; removes hold; creates RefundRequest (200)", async () => {
    const host = await createUser("host-c1@test.com", { host: true });
    const guest = await createUser("guest-c1@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    const createRes = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ listingId: listing.id, checkIn: "2027-06-01", checkOut: "2027-06-05" });

    // Force to CONFIRMED so cancellation is allowed
    await prisma.booking.update({
      where: { id: createRes.body.id },
      data: { status: "CONFIRMED" },
    });

    const res = await request(app)
      .post(`/bookings/${createRes.body.id}/cancel`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ cancellationReason: "Change of plans" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELLED");
    expect(res.body.cancelledAt).toBeTruthy();

    const hold = await prisma.availabilityBlock.findFirst({
      where: { bookingId: createRes.body.id },
    });
    expect(hold).toBeNull();

    const refund = await prisma.refundRequest.findFirst({
      where: { bookingId: createRes.body.id },
    });
    expect(refund?.status).toBe("PENDING_ADMIN");
    expect(refund?.amountCents).toBe(createRes.body.totalChargedCents);
  });

  it("returns 422 CHECKIN_ALREADY_PASSED when checkIn is in the past", async () => {
    const host = await createUser("host-c2@test.com", { host: true });
    const guest = await createUser("guest-c2@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    // Insert a confirmed booking with a past checkIn directly
    const booking = await prisma.booking.create({
      data: {
        listingId: listing.id,
        guestId: guest.id,
        hostId: host.id,
        checkIn: new Date("2020-01-01"),
        checkOut: new Date("2020-01-05"),
        nights: 4,
        nightlyRateCents: 10000,
        subtotalCents: 40000,
        guestServiceFeeBps: 1500,
        guestServiceFeeCents: 6000,
        hostCommissionBps: 300,
        hostCommissionCents: 1200,
        currency: "USD",
        totalChargedCents: 46000,
        payoutCents: 38800,
        status: "CONFIRMED",
      },
    });

    const res = await request(app)
      .post(`/bookings/${booking.id}/cancel`)
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("CHECKIN_ALREADY_PASSED");
  });

  it("returns 404 when cancelling another guest's booking", async () => {
    const host = await createUser("host-c3@test.com", { host: true });
    const guest1 = await createUser("guest-c3a@test.com");
    const guest2 = await createUser("guest-c3b@test.com");
    const token1 = await tokenFor(guest1.id);
    const token2 = await tokenFor(guest2.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    const createRes = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ listingId: listing.id, checkIn: "2027-07-01", checkOut: "2027-07-03" });
    await prisma.booking.update({
      where: { id: createRes.body.id },
      data: { status: "CONFIRMED" },
    });

    const res = await request(app)
      .post(`/bookings/${createRes.body.id}/cancel`)
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(404);
  });

  it("returns 422 BOOKING_NOT_CANCELLABLE when booking is PENDING_PAYMENT", async () => {
    const host = await createUser("host-c4@test.com", { host: true });
    const guest = await createUser("guest-c4@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    const createRes = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ listingId: listing.id, checkIn: "2027-08-01", checkOut: "2027-08-05" });

    const res = await request(app)
      .post(`/bookings/${createRes.body.id}/cancel`)
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("BOOKING_NOT_CANCELLABLE");
  });
});
