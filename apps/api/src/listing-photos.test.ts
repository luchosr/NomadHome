import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

vi.mock("./services/storage.service.js", () => ({
  StorageService: vi.fn().mockImplementation(() => ({
    getPresignedUploadUrl: vi.fn().mockResolvedValue("https://fake.r2.url/upload"),
    publicUrlFor: vi.fn().mockImplementation((key: string) => `https://fake.r2.dev/${key}`),
  })),
}));

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
  const login = await request(createApp())
    .post("/auth/login")
    .send({ email, password: "password123" });
  return (login.body as { accessToken: string }).accessToken;
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
      title: "Photo test listing",
      description: "A listing used to test photo endpoints.",
      type: "PROPERTY",
      city: "Lisbon",
      country: "PT",
      addressLine: "Rua de Exemplo 1",
      capacity: 2,
      nightlyRateCents: 5000,
      amenityCodes: ["wifi"],
    });
  return res.body as { id: string };
}

describe.skipIf(!hasDatabase)("listing photos", () => {
  beforeAll(() => {
    process.env.JWT_SECRET ??= "test-secret";
  });
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns a presigned upload URL for the listing owner (200)", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);

    const res = await request(createApp())
      .post(`/listings/${listing.id}/photos/upload-url`)
      .set("Authorization", `Bearer ${token}`)
      .send({ contentType: "image/jpeg" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("uploadUrl");
    expect(res.body).toHaveProperty("key");
  });

  it("registers an uploaded photo and returns 201", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);

    const res = await request(createApp())
      .post(`/listings/${listing.id}/photos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ key: "photos/test.jpg", position: 0 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ position: 0 });
    expect(res.body.url).toContain("test.jpg");
  });

  it("returns 409 on position conflict", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);

    await request(createApp())
      .post(`/listings/${listing.id}/photos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ key: "photos/first.jpg", position: 0 });

    const res = await request(createApp())
      .post(`/listings/${listing.id}/photos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ key: "photos/second.jpg", position: 0 });

    expect(res.status).toBe(409);
    expect(await prisma.listingPhoto.count()).toBe(1);
  });

  it("lists photos ordered ascending by position", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);
    await request(createApp())
      .post(`/listings/${listing.id}/photos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ key: "photos/b.jpg", position: 1 });
    await request(createApp())
      .post(`/listings/${listing.id}/photos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ key: "photos/a.jpg", position: 0 });

    const res = await request(createApp())
      .get(`/listings/${listing.id}/photos`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].position).toBe(0);
    expect(res.body[1].position).toBe(1);
  });

  it("updates a photo's position and returns 200", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);
    const created = await request(createApp())
      .post(`/listings/${listing.id}/photos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ key: "photos/x.jpg", position: 0 });

    const res = await request(createApp())
      .patch(`/listings/${listing.id}/photos/${created.body.id}/position`)
      .set("Authorization", `Bearer ${token}`)
      .send({ position: 2 });

    expect(res.status).toBe(200);
    expect(res.body.position).toBe(2);
  });

  it("deletes a photo and returns 204", async () => {
    const token = await tokenFor("host@example.com", { host: true });
    const listing = await createListing(token);
    const created = await request(createApp())
      .post(`/listings/${listing.id}/photos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ key: "photos/del.jpg", position: 0 });

    const res = await request(createApp())
      .delete(`/listings/${listing.id}/photos/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(await prisma.listingPhoto.count()).toBe(0);
  });

  it("returns 403 when a non-owner calls photo endpoints", async () => {
    const tokenOwner = await tokenFor("owner@example.com", { host: true });
    const tokenOther = await tokenFor("other@example.com", { host: true });
    const listing = await createListing(tokenOwner);

    const res = await request(createApp())
      .post(`/listings/${listing.id}/photos/upload-url`)
      .set("Authorization", `Bearer ${tokenOther}`)
      .send({ contentType: "image/jpeg" });

    expect(res.status).toBe(403);
  });
});
