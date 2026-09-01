import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const app = createApp();

async function createUser(email: string, roles: string[] = ["guest"]) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("pass1234567", 12),
      emailVerifiedAt: new Date(),
      roles,
    },
  });
}

async function tokenFor(email: string) {
  const res = await request(app).post("/auth/login").send({ email, password: "pass1234567" });
  return (res.body as { accessToken: string }).accessToken;
}

async function createListing(hostId: string, status: "PUBLISHED" | "DRAFT" = "PUBLISHED") {
  return prisma.listing.create({
    data: {
      hostId,
      title: "Test Listing",
      description: "Nice.",
      type: "PROPERTY",
      city: "Lisbon",
      country: "PT",
      addressLine: "Rua A 1",
      capacity: 2,
      nightlyRateCents: 10000,
      currency: "USD",
      status,
    },
  });
}

async function createConfirmedBooking(
  guestId: string,
  hostId: string,
  listingId: string,
  checkIn: Date,
) {
  return prisma.booking.create({
    data: {
      listingId,
      guestId,
      hostId,
      checkIn,
      checkOut: new Date(checkIn.getTime() + 3 * 86400000),
      nights: 3,
      nightlyRateCents: 10000,
      subtotalCents: 30000,
      guestServiceFeeBps: 1500,
      guestServiceFeeCents: 4500,
      hostCommissionBps: 300,
      hostCommissionCents: 900,
      currency: "USD",
      totalChargedCents: 34500,
      payoutCents: 29100,
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });
}

describe.skipIf(!hasDatabase)("PATCH /admin/users/:id/disable", () => {
  beforeEach(() => resetDatabase());

  it("disables the user, hides listings, and flags upcoming bookings (200)", async () => {
    const admin = await createUser("admin@test.com", ["admin"]);
    const host = await createUser("host@test.com", ["guest", "host"]);
    const guest = await createUser("guest@test.com");
    const adminToken = await tokenFor("admin@test.com");

    const listing = await createListing(host.id);
    const future = new Date();
    future.setDate(future.getDate() + 5);

    // host booking (guest books host's listing — host is affected as host)
    const hostBooking = await createConfirmedBooking(guest.id, host.id, listing.id, future);
    // guest booking (host books another listing as guest)
    const otherListing = await createListing(admin.id);
    const guestBooking = await createConfirmedBooking(host.id, admin.id, otherListing.id, future);

    const res = await request(app)
      .patch(`/admin/users/${host.id}/disable`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.disabledAt).not.toBeNull();

    const updatedListing = await prisma.listing.findUnique({ where: { id: listing.id } });
    expect(updatedListing!.status).toBe("DISABLED");

    const flags = await prisma.bookingFlag.findMany({ orderBy: { reason: "asc" } });
    const reasons = flags.map((f) => f.reason);
    expect(reasons).toContain("GUEST_DISABLED");
    expect(reasons).toContain("HOST_DISABLED");

    const hostFlag = flags.find((f) => f.reason === "HOST_DISABLED");
    expect(hostFlag!.bookingId).toBe(hostBooking.id);
    const guestFlag = flags.find((f) => f.reason === "GUEST_DISABLED");
    expect(guestFlag!.bookingId).toBe(guestBooking.id);
  });

  it("does not flag past confirmed bookings", async () => {
    await createUser("admin@test.com", ["admin"]);
    const host = await createUser("host@test.com", ["guest", "host"]);
    const guest = await createUser("guest@test.com");
    const adminToken = await tokenFor("admin@test.com");

    const listing = await createListing(host.id);
    const past = new Date();
    past.setDate(past.getDate() - 5);
    await createConfirmedBooking(guest.id, host.id, listing.id, past);

    await request(app)
      .patch(`/admin/users/${host.id}/disable`)
      .set("Authorization", `Bearer ${adminToken}`);

    const flags = await prisma.bookingFlag.count();
    expect(flags).toBe(0);
  });

  it("returns 403 for a non-admin user", async () => {
    const host = await createUser("host@test.com", ["guest", "host"]);
    await createUser("guest@test.com");
    const guestToken = await tokenFor("guest@test.com");

    const res = await request(app)
      .patch(`/admin/users/${host.id}/disable`)
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
  });
});

describe.skipIf(!hasDatabase)("PATCH /admin/users/:id/enable", () => {
  beforeEach(() => resetDatabase());

  it("clears disabledAt on the user (200)", async () => {
    await createUser("admin@test.com", ["admin"]);
    const target = await createUser("target@test.com");
    const adminToken = await tokenFor("admin@test.com");

    await prisma.user.update({ where: { id: target.id }, data: { disabledAt: new Date() } });

    const res = await request(app)
      .patch(`/admin/users/${target.id}/enable`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.disabledAt).toBeNull();
  });

  it("returns 403 for a non-admin", async () => {
    const target = await createUser("target@test.com");
    await createUser("other@test.com");
    const otherToken = await tokenFor("other@test.com");

    const res = await request(app)
      .patch(`/admin/users/${target.id}/enable`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

describe.skipIf(!hasDatabase)("PATCH /admin/listings/:id/disable", () => {
  beforeEach(() => resetDatabase());

  it("sets listing status to DISABLED (200)", async () => {
    await createUser("admin@test.com", ["admin"]);
    const host = await createUser("host@test.com", ["guest", "host"]);
    const adminToken = await tokenFor("admin@test.com");
    const listing = await createListing(host.id);

    const res = await request(app)
      .patch(`/admin/listings/${listing.id}/disable`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("DISABLED");
    expect(res.body.disabledAt).not.toBeNull();
  });

  it("returns 403 for a non-admin", async () => {
    const host = await createUser("host@test.com", ["guest", "host"]);
    await createUser("guest@test.com");
    const guestToken = await tokenFor("guest@test.com");
    const listing = await createListing(host.id);

    const res = await request(app)
      .patch(`/admin/listings/${listing.id}/disable`)
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
  });
});

describe.skipIf(!hasDatabase)("PATCH /admin/listings/:id/enable", () => {
  beforeEach(() => resetDatabase());

  it("sets listing status to DRAFT (200)", async () => {
    await createUser("admin@test.com", ["admin"]);
    const host = await createUser("host@test.com", ["guest", "host"]);
    const adminToken = await tokenFor("admin@test.com");
    const listing = await createListing(host.id, "DRAFT");
    await prisma.listing.update({
      where: { id: listing.id },
      data: { status: "DISABLED", disabledAt: new Date() },
    });

    const res = await request(app)
      .patch(`/admin/listings/${listing.id}/enable`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("DRAFT");
    expect(res.body.disabledAt).toBeNull();
  });

  it("returns 403 for a non-admin", async () => {
    const host = await createUser("host@test.com", ["guest", "host"]);
    await createUser("guest@test.com");
    const guestToken = await tokenFor("guest@test.com");
    const listing = await createListing(host.id);

    const res = await request(app)
      .patch(`/admin/listings/${listing.id}/enable`)
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
  });
});
