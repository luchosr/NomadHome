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

async function createListing(hostId: string, title = "Cozy Studio") {
  return prisma.listing.create({
    data: {
      hostId,
      title,
      description: "A cozy place to stay.",
      type: "PROPERTY",
      city: "Lisbon",
      country: "PT",
      addressLine: "Rua do Sol 10",
      capacity: 2,
      nightlyRateCents: 9000,
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
      checkOut: new Date(checkIn.getTime() + 2 * 86400000),
      nights: 2,
      nightlyRateCents: 9000,
      subtotalCents: 18000,
      guestServiceFeeBps: 1500,
      guestServiceFeeCents: 2700,
      hostCommissionBps: 300,
      hostCommissionCents: 540,
      currency: "USD",
      totalChargedCents: 20700,
      payoutCents: 17460,
      status,
      confirmedAt: status === "CONFIRMED" ? new Date() : null,
    },
  });
}

describe.skipIf(!hasDatabase)("GET /bookings/me — guest dashboard", () => {
  beforeEach(() => resetDatabase());

  it("returns bookings with listing.title populated (200)", async () => {
    const host = await createUser("host-gd1@test.com", ["guest", "host"]);
    const guest = await createUser("guest-gd1@test.com");
    const token = await tokenFor("guest-gd1@test.com");
    const listing = await createListing(host.id, "Cozy Studio");

    const future = new Date();
    future.setDate(future.getDate() + 5);
    await createBooking(guest.id, host.id, listing.id, future);

    const res = await request(app)
      .get("/bookings/me?page=1&limit=20")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].listing).toBeDefined();
    expect(res.body.data[0].listing.title).toBe("Cozy Studio");
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });

  it("returns empty data array when guest has no bookings (200)", async () => {
    await createUser("guest-gd2@test.com");
    const token = await tokenFor("guest-gd2@test.com");

    const res = await request(app)
      .get("/bookings/me?page=1&limit=20")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("returns 401 for unauthenticated request", async () => {
    const res = await request(app).get("/bookings/me");

    expect(res.status).toBe(401);
  });
});
