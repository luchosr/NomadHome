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
      title: "Test Listing",
      description: "Nice place.",
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
}

describe.skipIf(!hasDatabase)("GET /admin/users", () => {
  beforeEach(() => resetDatabase());

  it("returns 200 with data array and total for admin", async () => {
    const admin = await createUser("admin@test.com", ["admin"]);
    await createUser("guest@test.com");
    const adminToken = await tokenFor("admin@test.com");

    const res = await request(app).get("/admin/users").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(50);

    const emails = (res.body.data as { email: string }[]).map((u) => u.email);
    expect(emails).toContain(admin.email);
    expect(emails).toContain("guest@test.com");
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get("/admin/users");
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin user", async () => {
    await createUser("guest@test.com");
    const guestToken = await tokenFor("guest@test.com");

    const res = await request(app).get("/admin/users").set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
  });

  it("respects page and limit query params", async () => {
    await createUser("admin@test.com", ["admin"]);
    await createUser("user1@test.com");
    await createUser("user2@test.com");
    const adminToken = await tokenFor("admin@test.com");

    const res = await request(app)
      .get("/admin/users?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
  });
});

describe.skipIf(!hasDatabase)("GET /admin/listings", () => {
  beforeEach(() => resetDatabase());

  it("returns 200 with data array and host.email for admin", async () => {
    await createUser("admin@test.com", ["admin"]);
    const host = await createUser("host@test.com", ["guest", "host"]);
    const adminToken = await tokenFor("admin@test.com");
    await createListing(host.id);

    const res = await request(app)
      .get("/admin/listings")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(50);

    const listing = (res.body.data as { host: { email: string } }[])[0];
    expect(listing).toBeDefined();
    expect(listing!.host.email).toBe("host@test.com");
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get("/admin/listings");
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin user", async () => {
    await createUser("guest@test.com");
    const guestToken = await tokenFor("guest@test.com");

    const res = await request(app)
      .get("/admin/listings")
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
  });
});
