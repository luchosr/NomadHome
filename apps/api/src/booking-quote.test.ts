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

describe.skipIf(!hasDatabase)("GET /bookings/quote", () => {
  beforeEach(() => resetDatabase());

  it("returns the exact price breakdown for a valid listing/dates (200)", async () => {
    const host = await createUser("host-q1@test.com", { host: true });
    const guest = await createUser("guest-q1@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    const res = await request(app)
      .get("/bookings/quote")
      .query({ listingId: listing.id, checkIn: "2027-01-10", checkOut: "2027-01-15" })
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(200);
    expect(res.body.nights).toBe(5);
    expect(res.body.nightlyRateCents).toBe(10000);
    expect(res.body.subtotalCents).toBe(50000);
    expect(res.body.guestServiceFeeBps).toBe(1500);
    expect(res.body.guestServiceFeeCents).toBe(7500);
    expect(res.body.totalChargedCents).toBe(57500);
    expect(res.body.currency).toBe("USD");

    // Quote must not create a booking.
    expect(await prisma.booking.count()).toBe(0);
  });

  it("succeeds for a guest with emailVerified: false (unlike POST /bookings)", async () => {
    const host = await createUser("host-q2@test.com", { host: true });
    const guest = await createUser("guest-q2@test.com", { emailVerified: false });
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    const res = await request(app)
      .get("/bookings/quote")
      .query({ listingId: listing.id, checkIn: "2027-01-10", checkOut: "2027-01-15" })
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(200);
    expect(res.body.error).not.toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 404 for a nonexistent listing", async () => {
    const guest = await createUser("guest-q3@test.com");
    const guestToken = await tokenFor(guest.id);

    const res = await request(app)
      .get("/bookings/quote")
      .query({
        listingId: "00000000-0000-0000-0000-000000000000",
        checkIn: "2027-01-10",
        checkOut: "2027-01-15",
      })
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 for an unpublished (DRAFT) listing", async () => {
    const host = await createUser("host-q4@test.com", { host: true });
    const guest = await createUser("guest-q4@test.com");
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
      .get("/bookings/quote")
      .query({ listingId: listing.id, checkIn: "2027-01-10", checkOut: "2027-01-15" })
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(404);
  });

  it("returns totalChargedCents matching a booking subsequently created with the same listing/dates", async () => {
    const host = await createUser("host-q5@test.com", { host: true });
    const guest = await createUser("guest-q5@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();

    const quoteRes = await request(app)
      .get("/bookings/quote")
      .query({ listingId: listing.id, checkIn: "2027-01-10", checkOut: "2027-01-15" })
      .set("Authorization", `Bearer ${guestToken}`);
    expect(quoteRes.status).toBe(200);

    const createRes = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({ listingId: listing.id, checkIn: "2027-01-10", checkOut: "2027-01-15" });
    expect(createRes.status).toBe(201);

    expect(quoteRes.body.totalChargedCents).toBe(createRes.body.totalChargedCents);
  });

  it("returns 401 for unauthenticated request", async () => {
    const res = await request(app)
      .get("/bookings/quote")
      .query({ listingId: "any", checkIn: "2027-01-10", checkOut: "2027-01-15" });
    expect(res.status).toBe(401);
  });
});
