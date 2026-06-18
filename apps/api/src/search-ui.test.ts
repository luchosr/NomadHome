import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const app = createApp();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createHostUser(email: string) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("pass1234567", 12),
      emailVerifiedAt: new Date(),
      roles: ["guest", "host"],
    },
  });
}

interface CreateListingOpts {
  status?: "DRAFT" | "PUBLISHED" | "DISABLED";
  amenityCodes?: string[];
}

async function createListing(hostId: string, opts: CreateListingOpts = {}) {
  const { status = "PUBLISHED", amenityCodes = [] } = opts;

  const listing = await prisma.listing.create({
    data: {
      hostId,
      title: "Sunny Studio",
      description: "A bright studio in the city centre.",
      type: "PROPERTY",
      city: "Lisbon",
      country: "PT",
      addressLine: "Rua Nova 1",
      capacity: 2,
      nightlyRateCents: 8000,
      currency: "USD",
      status,
    },
  });

  if (amenityCodes.length > 0) {
    await prisma.amenity.createMany({
      data: amenityCodes.map((code) => ({ code, label: code })),
      skipDuplicates: true,
    });
    await prisma.listingAmenity.createMany({
      data: amenityCodes.map((amenityCode) => ({ listingId: listing.id, amenityCode })),
      skipDuplicates: true,
    });
  }

  return listing;
}

async function addPhoto(listingId: string, position: number, url: string) {
  return prisma.listingPhoto.create({
    data: { listingId, url, position },
  });
}

// ---------------------------------------------------------------------------
// GET /listings/:id — public listing detail
// ---------------------------------------------------------------------------

describe.skipIf(!hasDatabase)("GET /listings/:id", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("returns 200 with full listing detail for a PUBLISHED listing", async () => {
    const host = await createHostUser("host@detail.com");
    const listing = await createListing(host.id, { amenityCodes: ["wifi", "kitchen"] });
    await addPhoto(listing.id, 0, "https://example.com/photo-a.jpg");
    await addPhoto(listing.id, 1, "https://example.com/photo-b.jpg");

    const res = await request(app).get(`/listings/${listing.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(listing.id);
    expect(res.body.title).toBe("Sunny Studio");
    expect(res.body.type).toBe("PROPERTY");
    expect(res.body.city).toBe("Lisbon");
    expect(res.body.status).toBe("PUBLISHED");

    // Amenities
    expect(Array.isArray(res.body.amenities)).toBe(true);
    const amenityCodes = (res.body.amenities as { amenityCode: string }[]).map(
      (a) => a.amenityCode,
    );
    expect(amenityCodes).toContain("wifi");
    expect(amenityCodes).toContain("kitchen");

    // Photos sorted by position
    expect(Array.isArray(res.body.photos)).toBe(true);
    expect(res.body.photos).toHaveLength(2);
    expect(res.body.photos[0].position).toBe(0);
    expect(res.body.photos[0].url).toBe("https://example.com/photo-a.jpg");
    expect(res.body.photos[1].position).toBe(1);
    expect(res.body.photos[1].url).toBe("https://example.com/photo-b.jpg");

    // No raw reviews array on the response
    expect(res.body.reviews).toBeUndefined();
  });

  it("returns avgRating null when the listing has no reviews", async () => {
    const host = await createHostUser("host@noreviews.com");
    const listing = await createListing(host.id);

    const res = await request(app).get(`/listings/${listing.id}`);

    expect(res.status).toBe(200);
    expect(res.body.avgRating).toBeNull();
    expect(res.body._count.reviews).toBe(0);
  });

  it("returns correct avgRating when the listing has reviews", async () => {
    const host = await createHostUser("host@rated.com");
    const listing = await createListing(host.id);

    const guest = await prisma.user.create({
      data: {
        email: "guest@rated.com",
        passwordHash: await bcrypt.hash("pass1234567", 12),
        emailVerifiedAt: new Date(),
        roles: ["guest"],
      },
    });

    // Create two confirmed bookings and their reviews
    for (const [idx, rating] of ([4, 2] as const).entries()) {
      const booking = await prisma.booking.create({
        data: {
          listingId: listing.id,
          guestId: guest.id,
          hostId: host.id,
          checkIn: new Date(`2024-0${idx + 1}-01`),
          checkOut: new Date(`2024-0${idx + 1}-04`),
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
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });
      await prisma.review.create({
        data: { bookingId: booking.id, listingId: listing.id, guestId: guest.id, rating },
      });
    }

    const res = await request(app).get(`/listings/${listing.id}`);

    expect(res.status).toBe(200);
    expect(res.body.avgRating).toBeCloseTo(3, 1);
    expect(res.body._count.reviews).toBe(2);
  });

  it("returns 404 for a DRAFT listing", async () => {
    const host = await createHostUser("host@draft.com");
    const listing = await createListing(host.id, { status: "DRAFT" });

    const res = await request(app).get(`/listings/${listing.id}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 for a DISABLED listing", async () => {
    const host = await createHostUser("host@disabled.com");
    const listing = await createListing(host.id, { status: "DISABLED" });

    const res = await request(app).get(`/listings/${listing.id}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 for a non-existent listing id", async () => {
    const res = await request(app).get("/listings/00000000-0000-0000-0000-000000000000");

    expect(res.status).toBe(404);
  });

  it("does not require authentication", async () => {
    const host = await createHostUser("host@public.com");
    const listing = await createListing(host.id);

    // No Authorization header — should still succeed
    const res = await request(app).get(`/listings/${listing.id}`);

    expect(res.status).toBe(200);
  });
});
