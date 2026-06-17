import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

async function tokenFor(email: string, opts: { host?: boolean } = {}) {
  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("password123", 12),
      emailVerifiedAt: new Date(),
      roles: opts.host ? ["guest", "host"] : ["guest"],
    },
  });
  const res = await request(createApp())
    .post("/auth/login")
    .send({ email, password: "password123" });
  return (res.body as { accessToken: string }).accessToken;
}

async function createListing(token: string) {
  await prisma.amenity.createMany({
    data: [{ code: "wifi", label: "Wi-Fi" }],
    skipDuplicates: true,
  });
  const res = await request(createApp())
    .post("/listings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Availability test listing",
      description: "Used for availability tests.",
      type: "PROPERTY",
      city: "Lisbon",
      country: "PT",
      addressLine: "Rua Teste 2",
      capacity: 2,
      nightlyRateCents: 5000,
      amenityCodes: ["wifi"],
    });
  return res.body as { id: string };
}

describe.skipIf(!hasDatabase)("listing availability", () => {
  beforeAll(() => {
    process.env.JWT_SECRET ??= "test-secret";
  });
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a HOST_BLOCK for an available range (201)", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);

    const res = await request(createApp())
      .post(`/listings/${listing.id}/availability`)
      .set("Authorization", `Bearer ${token}`)
      .send({ startDate: "2026-08-01", endDate: "2026-08-07" });

    expect(res.status).toBe(201);
    expect(res.body.source).toBe("HOST_BLOCK");
    expect(await prisma.availabilityBlock.count()).toBe(1);
  });

  it("returns 409 OVERLAP_CONFLICT when a HOST_BLOCK overlaps an existing HOST_BLOCK", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);
    await request(createApp())
      .post(`/listings/${listing.id}/availability`)
      .set("Authorization", `Bearer ${token}`)
      .send({ startDate: "2026-08-01", endDate: "2026-08-10" });

    const res = await request(createApp())
      .post(`/listings/${listing.id}/availability`)
      .set("Authorization", `Bearer ${token}`)
      .send({ startDate: "2026-08-05", endDate: "2026-08-12" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("OVERLAP_CONFLICT");
    expect(res.body.conflict.source).toBe("HOST_BLOCK");
    expect(res.body.conflict).toHaveProperty("blockId");
    expect(res.body.conflict).not.toHaveProperty("bookingId");
    expect(await prisma.availabilityBlock.count()).toBe(1);
  });

  it("returns 409 OVERLAP_CONFLICT with bookingId when overlapping a BOOKING_HOLD", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);

    // Create a real guest and booking so the FK constraint is satisfied
    const guest = await prisma.user.create({
      data: {
        email: "guest-hold@example.com",
        passwordHash: await bcrypt.hash("password123", 12),
        emailVerifiedAt: new Date(),
        roles: ["guest"],
      },
    });
    const booking = await prisma.booking.create({
      data: {
        listingId: listing.id,
        guestId: guest.id,
        hostId: listing.hostId,
        checkIn: new Date("2026-09-01"),
        checkOut: new Date("2026-09-10"),
        nights: 9,
        nightlyRateCents: 5000,
        subtotalCents: 45000,
        guestServiceFeeBps: 1500,
        guestServiceFeeCents: 6750,
        hostCommissionBps: 300,
        hostCommissionCents: 1350,
        currency: "USD",
        totalChargedCents: 51750,
        payoutCents: 43650,
        status: "CONFIRMED",
      },
    });
    await prisma.availabilityBlock.create({
      data: {
        listingId: listing.id,
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-09-10"),
        source: "BOOKING_HOLD",
        bookingId: booking.id,
      },
    });

    const res = await request(createApp())
      .post(`/listings/${listing.id}/availability`)
      .set("Authorization", `Bearer ${token}`)
      .send({ startDate: "2026-09-05", endDate: "2026-09-15" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("OVERLAP_CONFLICT");
    expect(res.body.conflict.source).toBe("BOOKING_HOLD");
    expect(res.body.conflict.bookingId).toBe(booking.id);
    expect(await prisma.availabilityBlock.count()).toBe(1);
  });

  it("lists availability blocks ordered by startDate", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);
    await request(createApp())
      .post(`/listings/${listing.id}/availability`)
      .set("Authorization", `Bearer ${token}`)
      .send({ startDate: "2026-10-15", endDate: "2026-10-20" });
    await request(createApp())
      .post(`/listings/${listing.id}/availability`)
      .set("Authorization", `Bearer ${token}`)
      .send({ startDate: "2026-10-01", endDate: "2026-10-05" });

    const res = await request(createApp())
      .get(`/listings/${listing.id}/availability`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(new Date(res.body[0].startDate) < new Date(res.body[1].startDate)).toBe(true);
  });

  it("deletes a HOST_BLOCK and returns 204", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);
    const created = await request(createApp())
      .post(`/listings/${listing.id}/availability`)
      .set("Authorization", `Bearer ${token}`)
      .send({ startDate: "2026-11-01", endDate: "2026-11-05" });

    const res = await request(createApp())
      .delete(`/listings/${listing.id}/availability/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(await prisma.availabilityBlock.count()).toBe(0);
  });

  it("returns 403 when a non-owner tries to block availability", async () => {
    const tokenOwner = await tokenFor("owner@example.com", { host: true });
    const tokenOther = await tokenFor("other@example.com", { host: true });
    const listing = await createListing(tokenOwner);

    const res = await request(createApp())
      .post(`/listings/${listing.id}/availability`)
      .set("Authorization", `Bearer ${tokenOther}`)
      .send({ startDate: "2026-08-01", endDate: "2026-08-07" });

    expect(res.status).toBe(403);
    expect(await prisma.availabilityBlock.count()).toBe(0);
  });
});
