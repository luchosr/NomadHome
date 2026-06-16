import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

const AMENITIES = [
  { code: "wifi", label: "Wi-Fi" },
  { code: "kitchen", label: "Kitchen" },
];

async function seedAmenities() {
  await prisma.amenity.createMany({ data: AMENITIES, skipDuplicates: true });
}

/** Create a user, optionally a host, and return a valid access token. */
async function tokenFor(email: string, opts: { host?: boolean } = {}) {
  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("password123", 12),
      emailVerifiedAt: new Date(),
      roles: opts.host ? ["guest", "host"] : ["guest"],
    },
  });
  const login = await request(createApp())
    .post("/auth/login")
    .send({ email, password: "password123" });
  return (login.body as { accessToken: string }).accessToken;
}

const validListing = {
  title: "Sunny loft",
  description: "A bright room with a desk.",
  type: "PROPERTY",
  city: "Ciudad de México",
  country: "MX",
  addressLine: "Calle Falsa 123",
  capacity: 2,
  nightlyRateCents: 5500,
  amenityCodes: ["wifi", "kitchen"],
};

describe.skipIf(!hasDatabase)("listing CRUD", () => {
  beforeAll(() => {
    process.env.JWT_SECRET ??= "test-secret";
  });
  beforeEach(async () => {
    await resetDatabase();
    await seedAmenities();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a draft listing owned by the host with its amenities", async () => {
    const token = await tokenFor("host@example.com", { host: true });

    const res = await request(createApp())
      .post("/listings")
      .set("Authorization", `Bearer ${token}`)
      .send(validListing);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("DRAFT");
    expect(res.body.amenities).toHaveLength(2);

    const row = await prisma.listing.findUniqueOrThrow({
      where: { id: res.body.id },
      include: { host: true },
    });
    expect(row.host.email).toBe("host@example.com");
  });

  it("rejects creation with missing required fields (400)", async () => {
    const token = await tokenFor("host2@example.com", { host: true });
    const { title: _omitted, ...incomplete } = validListing;

    const res = await request(createApp())
      .post("/listings")
      .set("Authorization", `Bearer ${token}`)
      .send(incomplete);

    expect(res.status).toBe(400);
    expect(await prisma.listing.count()).toBe(0);
  });

  it("rejects an unknown amenity code (422)", async () => {
    const token = await tokenFor("host3@example.com", { host: true });

    const res = await request(createApp())
      .post("/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validListing, amenityCodes: ["wifi", "does_not_exist"] });

    expect(res.status).toBe(422);
    expect(await prisma.listing.count()).toBe(0);
  });

  it("forbids a non-host from creating a listing (403)", async () => {
    const token = await tokenFor("guest@example.com");

    const res = await request(createApp())
      .post("/listings")
      .set("Authorization", `Bearer ${token}`)
      .send(validListing);

    expect(res.status).toBe(403);
    expect(await prisma.listing.count()).toBe(0);
  });

  it("lists only the host's own listings", async () => {
    const tokenA = await tokenFor("a@example.com", { host: true });
    const tokenB = await tokenFor("b@example.com", { host: true });
    await request(createApp())
      .post("/listings")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(validListing);
    await request(createApp())
      .post("/listings")
      .set("Authorization", `Bearer ${tokenB}`)
      .send(validListing);

    const res = await request(createApp())
      .get("/listings/mine")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("forbids editing another host's listing (403)", async () => {
    const tokenA = await tokenFor("owner@example.com", { host: true });
    const tokenB = await tokenFor("other@example.com", { host: true });
    const created = await request(createApp())
      .post("/listings")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(validListing);

    const res = await request(createApp())
      .patch(`/listings/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ title: "Hijacked" });

    expect(res.status).toBe(403);
    const row = await prisma.listing.findUniqueOrThrow({ where: { id: created.body.id } });
    expect(row.title).toBe("Sunny loft");
  });

  it("updates an owned draft, replacing amenities", async () => {
    const token = await tokenFor("editor@example.com", { host: true });
    const created = await request(createApp())
      .post("/listings")
      .set("Authorization", `Bearer ${token}`)
      .send(validListing);

    const res = await request(createApp())
      .patch(`/listings/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Brighter loft", amenityCodes: ["wifi"] });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Brighter loft");
    expect(res.body.amenities).toHaveLength(1);
  });
});
