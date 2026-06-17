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

async function createListing(hostId: string) {
  return prisma.listing.create({
    data: {
      hostId,
      title: "Beach House",
      description: "Nice.",
      type: "PROPERTY",
      city: "Porto",
      country: "PT",
      addressLine: "Rua B 2",
      capacity: 2,
      nightlyRateCents: 8000,
      currency: "USD",
      status: "PUBLISHED",
    },
  });
}

async function createBooking(
  guestId: string,
  hostId: string,
  listingId: string,
  checkIn: Date,
  status = "CONFIRMED",
) {
  return prisma.booking.create({
    data: {
      listingId,
      guestId,
      hostId,
      checkIn,
      checkOut: new Date(checkIn.getTime() + 3 * 86400000),
      nights: 3,
      nightlyRateCents: 8000,
      subtotalCents: 24000,
      guestServiceFeeBps: 1500,
      guestServiceFeeCents: 3600,
      hostCommissionBps: 300,
      hostCommissionCents: 720,
      currency: "USD",
      totalChargedCents: 27600,
      payoutCents: 23280,
      status,
      confirmedAt: status === "CONFIRMED" ? new Date() : null,
    },
  });
}

describe.skipIf(!hasDatabase)("GET /bookings/host-upcoming", () => {
  beforeEach(() => resetDatabase());

  it("returns upcoming confirmed bookings sorted by checkIn (200)", async () => {
    const host = await createUser("host@test.com", ["guest", "host"]);
    const guest = await createUser("guest@test.com");
    const token = await tokenFor("host@test.com");
    const listing = await createListing(host.id);

    const sooner = new Date();
    sooner.setDate(sooner.getDate() + 3);
    const later = new Date();
    later.setDate(later.getDate() + 10);

    await createBooking(guest.id, host.id, listing.id, later);
    await createBooking(guest.id, host.id, listing.id, sooner);

    const res = await request(app)
      .get("/bookings/host-upcoming")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(new Date(res.body[0].checkIn) <= new Date(res.body[1].checkIn)).toBe(true);
    expect(res.body[0].listing.title).toBe("Beach House");
    expect(res.body[0].guest.email).toBe("guest@test.com");
  });

  it("excludes past bookings and non-confirmed bookings", async () => {
    const host = await createUser("host@test.com", ["guest", "host"]);
    const guest = await createUser("guest@test.com");
    const token = await tokenFor("host@test.com");
    const listing = await createListing(host.id);

    const past = new Date();
    past.setDate(past.getDate() - 5);
    const future = new Date();
    future.setDate(future.getDate() + 5);

    await createBooking(guest.id, host.id, listing.id, past); // past
    await createBooking(guest.id, host.id, listing.id, future, "PENDING_PAYMENT"); // not confirmed
    await createBooking(guest.id, host.id, listing.id, future, "CANCELLED"); // cancelled

    const res = await request(app)
      .get("/bookings/host-upcoming")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("returns empty array for a host with no upcoming bookings (200)", async () => {
    await createUser("host@test.com", ["guest", "host"]);
    const token = await tokenFor("host@test.com");

    const res = await request(app)
      .get("/bookings/host-upcoming")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 403 for a guest user", async () => {
    await createUser("guest@test.com");
    const token = await tokenFor("guest@test.com");

    const res = await request(app)
      .get("/bookings/host-upcoming")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
