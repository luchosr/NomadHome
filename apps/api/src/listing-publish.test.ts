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
      title: "Publish test listing",
      description: "A listing for publish tests.",
      type: "PROPERTY",
      city: "Lisbon",
      country: "PT",
      addressLine: "Rua Teste 1",
      capacity: 2,
      nightlyRateCents: 5000,
      amenityCodes: ["wifi"],
    });
  return res.body as { id: string; status: string };
}

describe.skipIf(!hasDatabase)("listing publish/unpublish", () => {
  beforeAll(() => {
    process.env.JWT_SECRET ??= "test-secret";
  });
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("publishes a draft listing that has at least one photo (200)", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);
    await prisma.listingPhoto.create({
      data: { listingId: listing.id, url: "https://r2.example.com/photo.jpg", position: 0 },
    });

    const res = await request(createApp())
      .patch(`/listings/${listing.id}/publish`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("PUBLISHED");
  });

  it("rejects publish when the listing has no photos (422)", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);

    const res = await request(createApp())
      .patch(`/listings/${listing.id}/publish`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(422);
    const row = await prisma.listing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(row.status).toBe("DRAFT");
  });

  it("unpublishes a published listing (200)", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);
    await prisma.listingPhoto.create({
      data: { listingId: listing.id, url: "https://r2.example.com/photo.jpg", position: 0 },
    });
    await request(createApp())
      .patch(`/listings/${listing.id}/publish`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(createApp())
      .patch(`/listings/${listing.id}/unpublish`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("DRAFT");
  });

  it("returns 403 when a non-owner tries to publish", async () => {
    const tokenOwner = await tokenFor("owner@example.com", { host: true });
    const tokenOther = await tokenFor("other@example.com", { host: true });
    const listing = await createListing(tokenOwner);

    const res = await request(createApp())
      .patch(`/listings/${listing.id}/publish`)
      .set("Authorization", `Bearer ${tokenOther}`);

    expect(res.status).toBe(403);
  });
});
