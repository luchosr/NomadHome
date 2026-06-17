import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { prisma, resetDatabase } from "@nomadhome/db";
import { createApp } from "./app.js";

// All Stripe instances in the app share these spies via vi.hoisted
const mockConstructEvent = vi.hoisted(() => vi.fn());
const mockSessionCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    id: "cs_test_session_123",
    url: "https://checkout.stripe.com/test",
    status: "open",
    payment_intent: "pi_test_123",
  }),
);
const mockSessionRetrieve = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    id: "cs_test_session_123",
    url: "https://checkout.stripe.com/test",
    status: "open",
    payment_intent: "pi_test_123",
  }),
);

vi.mock("stripe", () => {
  const mockStripe = vi.fn(() => ({
    checkout: {
      sessions: { create: mockSessionCreate, retrieve: mockSessionRetrieve },
    },
    webhooks: { constructEvent: mockConstructEvent },
  }));
  return { default: mockStripe };
});

const hasDatabase = Boolean(process.env.DATABASE_URL);
const app = createApp();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createUser(email: string, opts: { host?: boolean; admin?: boolean } = {}) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("pass1234567", 12),
      emailVerifiedAt: new Date(),
      roles: opts.admin ? ["guest", "admin"] : opts.host ? ["guest", "host"] : ["guest"],
    },
  });
}

async function tokenFor(userId: string) {
  const res = await request(app)
    .post("/auth/login")
    .send({
      email: (await prisma.user.findUnique({ where: { id: userId } }))!.email,
      password: "pass1234567",
    });
  return (res.body as { accessToken: string }).accessToken;
}

async function seedFeeConfig() {
  return prisma.platformFeeConfig.create({
    data: { guestServiceFeeBps: 1500, hostCommissionBps: 300, createdBy: "system" },
  });
}

async function createPublishedListing(hostId: string) {
  await prisma.amenity.createMany({
    data: [{ code: "wifi", label: "Wi-Fi" }],
    skipDuplicates: true,
  });
  const listing = await prisma.listing.create({
    data: {
      hostId,
      title: "Test Listing",
      description: "A great place.",
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
  await prisma.listingPhoto.create({
    data: { listingId: listing.id, url: "https://example.com/photo.jpg", position: 0 },
  });
  return listing;
}

async function createPendingBooking(guestId: string, listingId: string, hostId: string) {
  const feeConfig = await prisma.platformFeeConfig.findFirst({
    orderBy: { createdAt: "desc" },
  });
  const nights = 5;
  const nightlyRateCents = 10000;
  const subtotalCents = nightlyRateCents * nights;
  const guestServiceFeeCents = Math.floor(
    (subtotalCents * (feeConfig?.guestServiceFeeBps ?? 1500)) / 10000,
  );
  const hostCommissionCents = Math.floor(
    (subtotalCents * (feeConfig?.hostCommissionBps ?? 300)) / 10000,
  );

  const booking = await prisma.booking.create({
    data: {
      listingId,
      guestId,
      hostId,
      checkIn: new Date("2027-01-10"),
      checkOut: new Date("2027-01-15"),
      nights,
      nightlyRateCents,
      subtotalCents,
      guestServiceFeeBps: feeConfig?.guestServiceFeeBps ?? 1500,
      guestServiceFeeCents,
      hostCommissionBps: feeConfig?.hostCommissionBps ?? 300,
      hostCommissionCents,
      currency: "USD",
      totalChargedCents: subtotalCents + guestServiceFeeCents,
      payoutCents: subtotalCents - hostCommissionCents,
      status: "PENDING_PAYMENT",
    },
  });
  await prisma.availabilityBlock.create({
    data: {
      listingId,
      startDate: new Date("2027-01-10"),
      endDate: new Date("2027-01-15"),
      source: "BOOKING_HOLD",
      bookingId: booking.id,
    },
  });
  return booking;
}

// ---------------------------------------------------------------------------
// POST /bookings/:id/checkout
// ---------------------------------------------------------------------------

describe.skipIf(!hasDatabase)("POST /bookings/:id/checkout", () => {
  beforeEach(() => resetDatabase());

  it("returns 200 with Stripe URL for a PENDING_PAYMENT booking (200)", async () => {
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();
    const booking = await createPendingBooking(guest.id, listing.id, host.id);

    const res = await request(app)
      .post(`/bookings/${booking.id}/checkout`)
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(200);
    expect(res.body.url).toBe("https://checkout.stripe.com/test");
    expect(res.body.sessionId).toBe("cs_test_session_123");

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated?.stripeCheckoutSessionId).toBe("cs_test_session_123");
  });

  it("returns 404 when booking belongs to another guest", async () => {
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const other = await createUser("other@test.com");
    const otherToken = await tokenFor(other.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();
    const booking = await createPendingBooking(guest.id, listing.id, host.id);

    const res = await request(app)
      .post(`/bookings/${booking.id}/checkout`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 422 BOOKING_NOT_PENDING when booking is CONFIRMED", async () => {
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const guestToken = await tokenFor(guest.id);
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();
    const booking = await createPendingBooking(guest.id, listing.id, host.id);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    const res = await request(app)
      .post(`/bookings/${booking.id}/checkout`)
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("BOOKING_NOT_PENDING");
  });
});

// ---------------------------------------------------------------------------
// POST /stripe/webhook
// ---------------------------------------------------------------------------

describe.skipIf(!hasDatabase)("POST /stripe/webhook", () => {
  beforeEach(() => resetDatabase());

  it("confirms the booking on checkout.session.completed (200)", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_test_001",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_session_123", payment_intent: "pi_test_123" } },
    });

    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();
    const booking = await createPendingBooking(guest.id, listing.id, host.id);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeCheckoutSessionId: "cs_test_session_123" },
    });

    const res = await request(app)
      .post("/stripe/webhook")
      .set("stripe-signature", "t=1,v1=sig")
      .set("Content-Type", "application/json")
      .send(Buffer.from("{}"));

    expect(res.status).toBe(200);
    const confirmed = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(confirmed?.status).toBe("CONFIRMED");
    expect(confirmed?.stripePaymentIntentId).toBe("pi_test_123");
  });

  it("ignores a duplicate webhook event (200)", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_dup_001",
      type: "checkout.session.completed",
      data: { object: { id: "cs_dup", payment_intent: "pi_dup" } },
    });

    await prisma.stripeProcessedEvent.create({
      data: { stripeEventId: "evt_dup_001", eventType: "checkout.session.completed" },
    });

    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();
    const booking = await createPendingBooking(guest.id, listing.id, host.id);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeCheckoutSessionId: "cs_dup" },
    });

    const res = await request(app)
      .post("/stripe/webhook")
      .set("stripe-signature", "t=1,v1=sig")
      .set("Content-Type", "application/json")
      .send(Buffer.from("{}"));

    expect(res.status).toBe(200);
    const unchanged = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(unchanged?.status).toBe("PENDING_PAYMENT");
  });

  it("returns 400 on invalid Stripe signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });

    const res = await request(app)
      .post("/stripe/webhook")
      .set("stripe-signature", "bad")
      .set("Content-Type", "application/json")
      .send(Buffer.from("{}"));

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /admin/payouts
// ---------------------------------------------------------------------------

describe.skipIf(!hasDatabase)("GET /admin/payouts", () => {
  beforeEach(() => resetDatabase());

  it("returns amounts owed per host (200)", async () => {
    const admin = await createUser("admin@test.com", { admin: true });
    const adminToken = await tokenFor(admin.id);
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();
    const booking = await createPendingBooking(guest.id, listing.id, host.id);
    // Mark confirmed + checkOut in the past
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", confirmedAt: new Date(), checkOut: new Date("2025-01-01") },
    });

    const res = await request(app)
      .get("/admin/payouts")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].hostId).toBe(host.id);
    expect(res.body[0].totalOwedCents).toBeGreaterThan(0);
  });

  it("returns 403 for a non-admin user", async () => {
    const guest = await createUser("guest@test.com");
    const guestToken = await tokenFor(guest.id);

    const res = await request(app)
      .get("/admin/payouts")
      .set("Authorization", `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /admin/payouts
// ---------------------------------------------------------------------------

describe.skipIf(!hasDatabase)("POST /admin/payouts", () => {
  beforeEach(() => resetDatabase());

  it("records a payout and settles the bookings (201)", async () => {
    const admin = await createUser("admin@test.com", { admin: true });
    const adminToken = await tokenFor(admin.id);
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();
    const booking = await createPendingBooking(guest.id, listing.id, host.id);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", confirmedAt: new Date(), checkOut: new Date("2025-01-01") },
    });

    const res = await request(app)
      .post("/admin/payouts")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        hostId: host.id,
        amountCents: booking.payoutCents,
        currency: "USD",
        method: "bank_transfer",
        externalReference: "REF-001",
        bookingIds: [booking.id],
      });

    expect(res.status).toBe(201);
    expect(res.body.hostId).toBe(host.id);

    // Booking should no longer appear in payouts view
    const summary = await request(app)
      .get("/admin/payouts")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(summary.body).toHaveLength(0);
  });

  it("returns 409 on double-payout of the same booking", async () => {
    const admin = await createUser("admin@test.com", { admin: true });
    const adminToken = await tokenFor(admin.id);
    const host = await createUser("host@test.com", { host: true });
    const guest = await createUser("guest@test.com");
    const listing = await createPublishedListing(host.id);
    await seedFeeConfig();
    const booking = await createPendingBooking(guest.id, listing.id, host.id);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", confirmedAt: new Date(), checkOut: new Date("2025-01-01") },
    });

    const body = {
      hostId: host.id,
      amountCents: booking.payoutCents,
      currency: "USD",
      method: "bank_transfer",
      externalReference: "REF-002",
      bookingIds: [booking.id],
    };

    await request(app)
      .post("/admin/payouts")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(body);

    const res = await request(app)
      .post("/admin/payouts")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...body, externalReference: "REF-003" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("DOUBLE_PAYOUT");
  });

  it("returns 403 for a non-admin user", async () => {
    const guest = await createUser("guest@test.com");
    const guestToken = await tokenFor(guest.id);

    const res = await request(app)
      .post("/admin/payouts")
      .set("Authorization", `Bearer ${guestToken}`)
      .send({
        hostId: "some-id",
        amountCents: 1000,
        currency: "USD",
        method: "bank_transfer",
        externalReference: "REF-X",
        bookingIds: ["00000000-0000-0000-0000-000000000001"],
      });

    expect(res.status).toBe(403);
  });
});
