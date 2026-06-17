import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createHostUser(email: string) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("password123", 12),
      emailVerifiedAt: new Date(),
      roles: ["guest", "host"],
    },
  });
}

async function createHostProfile(userId: string, displayName = "Test Host") {
  return prisma.hostProfile.create({
    data: {
      userId,
      displayName,
      payoutEmail: "payout@example.com",
      acceptedTermsVersion: "v1",
    },
  });
}

async function ensureAmenities(codes: string[]) {
  await prisma.amenity.createMany({
    data: codes.map((code) => ({ code, label: code })),
    skipDuplicates: true,
  });
}

interface CreateListingOpts {
  title?: string;
  city?: string;
  country?: string;
  type?: "PROPERTY" | "WORKSPACE";
  status?: "DRAFT" | "PUBLISHED" | "DISABLED";
  nightlyRateCents?: number;
  capacity?: number;
  amenityCodes?: string[];
  photoUrl?: string | null;
}

async function createListing(hostId: string, opts: CreateListingOpts = {}) {
  const {
    title = "Test Listing",
    city = "Lisbon",
    country = "PT",
    type = "PROPERTY",
    status = "PUBLISHED",
    nightlyRateCents = 10_000,
    capacity = 2,
    amenityCodes = [],
    photoUrl = null,
  } = opts;

  const listing = await prisma.listing.create({
    data: {
      hostId,
      title,
      description: "A test listing.",
      type,
      city,
      country,
      addressLine: "Rua Teste 1",
      capacity,
      nightlyRateCents,
      currency: "USD",
      status,
    },
  });

  if (amenityCodes.length > 0) {
    await ensureAmenities(amenityCodes);
    await prisma.listingAmenity.createMany({
      data: amenityCodes.map((amenityCode) => ({ listingId: listing.id, amenityCode })),
      skipDuplicates: true,
    });
  }

  if (photoUrl) {
    await prisma.listingPhoto.create({
      data: { listingId: listing.id, url: photoUrl, position: 0 },
    });
  }

  return listing;
}

async function blockDates(listingId: string, startDate: string, endDate: string) {
  return prisma.availabilityBlock.create({
    data: {
      listingId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      source: "HOST_BLOCK",
    },
  });
}

const app = createApp();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe.skipIf(!hasDatabase)("GET /search", () => {
  let hostId: string;

  beforeAll(() => {
    process.env.JWT_SECRET ??= "test-secret";
  });

  beforeEach(async () => {
    await resetDatabase();
    const host = await createHostUser("host@example.com");
    await createHostProfile(host.id);
    hostId = host.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // 1. Happy path — returns published + available listing with correct fields
  // -------------------------------------------------------------------------
  it("returns only published, available listings with correct fields", async () => {
    const listing = await createListing(hostId, {
      title: "Ocean View Room",
      city: "Lisbon",
      country: "PT",
      type: "PROPERTY",
      nightlyRateCents: 8_000,
      photoUrl: "https://cdn.example.com/photo.jpg",
    });

    const res = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    const item = res.body.data[0];
    expect(item.id).toBe(listing.id);
    expect(item.title).toBe("Ocean View Room");
    expect(item.type).toBe("PROPERTY");
    expect(item.city).toBe("Lisbon");
    expect(item.country).toBe("PT");
    expect(item.nightlyRateCents).toBe(8_000);
    expect(item.currency).toBe("USD");
    expect(item.totalCents).toBe(8_000 * 4); // 4 nights
    expect(item.primaryPhotoUrl).toBe("https://cdn.example.com/photo.jpg");
  });

  // -------------------------------------------------------------------------
  // 2. Listing with overlapping AvailabilityBlock excluded
  // -------------------------------------------------------------------------
  it("excludes a listing with an overlapping availability block", async () => {
    const listing = await createListing(hostId, { city: "Lisbon" });
    await blockDates(listing.id, "2027-07-03", "2027-07-10");

    const res = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 3. DRAFT listing excluded
  // -------------------------------------------------------------------------
  it("excludes DRAFT listings", async () => {
    await createListing(hostId, { city: "Lisbon", status: "DRAFT" });

    const res = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 4. DISABLED listing excluded
  // -------------------------------------------------------------------------
  it("excludes DISABLED listings", async () => {
    await createListing(hostId, { city: "Lisbon", status: "DISABLED" });

    const res = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 5. type filter
  // -------------------------------------------------------------------------
  it("filters by type", async () => {
    await createListing(hostId, { city: "Lisbon", type: "PROPERTY" });
    await createListing(hostId, { city: "Lisbon", type: "WORKSPACE" });

    const res = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05", type: "WORKSPACE" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].type).toBe("WORKSPACE");
  });

  // -------------------------------------------------------------------------
  // 6. amenities AND filter — partial match excluded
  // -------------------------------------------------------------------------
  it("filters by amenities (AND): listing missing one code is excluded", async () => {
    // Listing with wifi only
    await createListing(hostId, { city: "Lisbon", amenityCodes: ["wifi"] });
    // Listing with both wifi and kitchen
    const both = await createListing(hostId, { city: "Lisbon", amenityCodes: ["wifi", "kitchen"] });

    const res = await request(app).get("/search").query({
      city: "Lisbon",
      checkIn: "2027-07-01",
      checkOut: "2027-07-05",
      amenities: "wifi,kitchen",
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(both.id);
  });

  // -------------------------------------------------------------------------
  // 7. minPrice filter
  // -------------------------------------------------------------------------
  it("filters by minPrice: listings below threshold excluded", async () => {
    await createListing(hostId, { city: "Lisbon", nightlyRateCents: 3_000 });
    const expensive = await createListing(hostId, { city: "Lisbon", nightlyRateCents: 10_000 });

    const res = await request(app).get("/search").query({
      city: "Lisbon",
      checkIn: "2027-07-01",
      checkOut: "2027-07-05",
      minPrice: 5_000,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(expensive.id);
  });

  // -------------------------------------------------------------------------
  // 8. maxPrice filter
  // -------------------------------------------------------------------------
  it("filters by maxPrice: listings above threshold excluded", async () => {
    const cheap = await createListing(hostId, { city: "Lisbon", nightlyRateCents: 3_000 });
    await createListing(hostId, { city: "Lisbon", nightlyRateCents: 10_000 });

    const res = await request(app).get("/search").query({
      city: "Lisbon",
      checkIn: "2027-07-01",
      checkOut: "2027-07-05",
      maxPrice: 5_000,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(cheap.id);
  });

  // -------------------------------------------------------------------------
  // 9. capacity filter
  // -------------------------------------------------------------------------
  it("filters by capacity: listings below minimum excluded", async () => {
    await createListing(hostId, { city: "Lisbon", capacity: 1 });
    const big = await createListing(hostId, { city: "Lisbon", capacity: 4 });

    const res = await request(app).get("/search").query({
      city: "Lisbon",
      checkIn: "2027-07-01",
      checkOut: "2027-07-05",
      capacity: 3,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(big.id);
  });

  // -------------------------------------------------------------------------
  // 10. Combined filters — only satisfying listing returned
  // -------------------------------------------------------------------------
  it("applies multiple filters combined (AND semantics)", async () => {
    // Satisfies all: WORKSPACE, wifi, capacity 4, rate 8000
    const target = await createListing(hostId, {
      city: "Lisbon",
      type: "WORKSPACE",
      capacity: 4,
      nightlyRateCents: 8_000,
      amenityCodes: ["wifi"],
    });
    // PROPERTY — fails type filter
    await createListing(hostId, {
      city: "Lisbon",
      type: "PROPERTY",
      capacity: 4,
      nightlyRateCents: 8_000,
      amenityCodes: ["wifi"],
    });
    // Missing wifi — fails amenity filter
    await createListing(hostId, {
      city: "Lisbon",
      type: "WORKSPACE",
      capacity: 4,
      nightlyRateCents: 8_000,
    });

    const res = await request(app).get("/search").query({
      city: "Lisbon",
      checkIn: "2027-07-01",
      checkOut: "2027-07-05",
      type: "WORKSPACE",
      amenities: "wifi",
      capacity: 3,
      minPrice: 5_000,
      maxPrice: 12_000,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(target.id);
  });

  // -------------------------------------------------------------------------
  // 11. Pagination — first page of multi-page set, hasMore true
  // -------------------------------------------------------------------------
  it("returns first page with hasMore=true for multi-page result sets", async () => {
    for (let i = 0; i < 5; i++) {
      await createListing(hostId, { city: "Lisbon", title: `Listing ${i}` });
    }

    const res = await request(app)
      .get("/search")
      .query({
        city: "Lisbon",
        checkIn: "2027-07-01",
        checkOut: "2027-07-05",
        page: 1,
        pageSize: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.pageSize).toBe(3);
    expect(res.body.pagination.hasMore).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 12. Default pagination — page=1, pageSize=20 when not specified
  // -------------------------------------------------------------------------
  it("applies default pagination (page=1, pageSize=20) when omitted", async () => {
    await createListing(hostId, { city: "Lisbon" });

    const res = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05" });

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.pageSize).toBe(20);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.pagination.hasMore).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 13. Last page — hasMore false
  // -------------------------------------------------------------------------
  it("returns hasMore=false on the last page", async () => {
    for (let i = 0; i < 5; i++) {
      await createListing(hostId, { city: "Lisbon", title: `Listing ${i}` });
    }

    // last page for pageSize=3 is page 2 (items 4 and 5)
    const res = await request(app)
      .get("/search")
      .query({
        city: "Lisbon",
        checkIn: "2027-07-01",
        checkOut: "2027-07-05",
        page: 2,
        pageSize: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.hasMore).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 14. Two consecutive pages — disjoint and complete
  // -------------------------------------------------------------------------
  it("consecutive pages are disjoint and their union is complete", async () => {
    for (let i = 0; i < 5; i++) {
      await createListing(hostId, { city: "Lisbon", title: `Listing ${i}` });
    }

    const page1 = await request(app)
      .get("/search")
      .query({
        city: "Lisbon",
        checkIn: "2027-07-01",
        checkOut: "2027-07-05",
        page: 1,
        pageSize: 3,
      });

    const page2 = await request(app)
      .get("/search")
      .query({
        city: "Lisbon",
        checkIn: "2027-07-01",
        checkOut: "2027-07-05",
        page: 2,
        pageSize: 3,
      });

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);

    const ids1 = page1.body.data.map((i: { id: string }) => i.id) as string[];
    const ids2 = page2.body.data.map((i: { id: string }) => i.id) as string[];

    // Disjoint
    const overlap = ids1.filter((id) => ids2.includes(id));
    expect(overlap).toHaveLength(0);

    // Complete (3 + 2 = 5)
    const allIds = new Set([...ids1, ...ids2]);
    expect(allIds.size).toBe(5);
  });

  // -------------------------------------------------------------------------
  // 15. Invalid page (page=0) → 400 with page in error
  // -------------------------------------------------------------------------
  it("returns 400 when page=0", async () => {
    const res = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05", page: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation");
    const fields = Object.keys(res.body.issues.fieldErrors as Record<string, unknown>);
    expect(fields).toContain("page");
  });

  // -------------------------------------------------------------------------
  // 16. Invalid pageSize (pageSize=200) → 400 with pageSize in error
  // -------------------------------------------------------------------------
  it("returns 400 when pageSize=200", async () => {
    const res = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05", pageSize: 200 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation");
    const fields = Object.keys(res.body.issues.fieldErrors as Record<string, unknown>);
    expect(fields).toContain("pageSize");
  });

  // -------------------------------------------------------------------------
  // 17. Sort — createdAt DESC, newest first
  // -------------------------------------------------------------------------
  it("returns results sorted by createdAt DESC (newest first)", async () => {
    const first = await createListing(hostId, { city: "Lisbon", title: "First" });
    // Small delay to ensure distinct createdAt values
    await new Promise((r) => setTimeout(r, 10));
    const second = await createListing(hostId, { city: "Lisbon", title: "Second" });
    await new Promise((r) => setTimeout(r, 10));
    const third = await createListing(hostId, { city: "Lisbon", title: "Third" });

    const res = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05" });

    expect(res.status).toBe(200);
    const ids = res.body.data.map((i: { id: string }) => i.id) as string[];
    expect(ids[0]).toBe(third.id);
    expect(ids[1]).toBe(second.id);
    expect(ids[2]).toBe(first.id);
  });

  // -------------------------------------------------------------------------
  // 18. Tiebreaker: A.id < B.id → A before B when createdAt equal
  // -------------------------------------------------------------------------
  it("uses id ASC as tiebreaker when two listings share the same createdAt", async () => {
    const listingB = await createListing(hostId, { city: "Lisbon", title: "B" });
    const listingA = await createListing(hostId, { city: "Lisbon", title: "A" });

    // Force identical createdAt with raw SQL
    const ts = new Date("2020-01-01T00:00:00.000Z");
    await prisma.$executeRawUnsafe(
      `UPDATE "Listing" SET "createdAt" = $1 WHERE id = $2`,
      ts,
      listingA.id,
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "Listing" SET "createdAt" = $1 WHERE id = $2`,
      ts,
      listingB.id,
    );

    const res = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const ids = res.body.data.map((i: { id: string }) => i.id) as string[];

    // Whichever UUID is lexicographically smaller should come first
    const expectedFirst = listingA.id < listingB.id ? listingA.id : listingB.id;
    const expectedSecond = listingA.id < listingB.id ? listingB.id : listingA.id;
    expect(ids[0]).toBe(expectedFirst);
    expect(ids[1]).toBe(expectedSecond);
  });

  // -------------------------------------------------------------------------
  // 19. ?sort param ignored — same response with and without ?sort=nightlyRate
  // -------------------------------------------------------------------------
  it("ignores an unsupported ?sort parameter (no error, same response)", async () => {
    await createListing(hostId, { city: "Lisbon", nightlyRateCents: 5_000 });
    await createListing(hostId, { city: "Lisbon", nightlyRateCents: 15_000 });

    const withoutSort = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05" });

    const withSort = await request(app)
      .get("/search")
      .query({
        city: "Lisbon",
        checkIn: "2027-07-01",
        checkOut: "2027-07-05",
        sort: "nightlyRate",
      });

    expect(withoutSort.status).toBe(200);
    expect(withSort.status).toBe(200);

    const idsWithout = withoutSort.body.data.map((i: { id: string }) => i.id);
    const idsWith = withSort.body.data.map((i: { id: string }) => i.id);
    expect(idsWith).toEqual(idsWithout);
  });

  // -------------------------------------------------------------------------
  // 20. No auth required — unauthenticated request → 200
  // -------------------------------------------------------------------------
  it("does not require authentication (200 with no Authorization header)", async () => {
    await createListing(hostId, { city: "Lisbon" });

    const res = await request(app)
      .get("/search")
      .query({ city: "Lisbon", checkIn: "2027-07-01", checkOut: "2027-07-05" });
    // No Authorization header set
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
