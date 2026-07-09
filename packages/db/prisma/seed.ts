/**
 * Database seed entrypoint.
 *
 * Idempotent: safe to run repeatedly. Each capability adds its own seed data.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Starter amenity lookup for listings (docs/data-model.md §3.8). */
const AMENITIES: { code: string; label: string }[] = [
  { code: "wifi", label: "Wi-Fi" },
  { code: "kitchen", label: "Kitchen" },
  { code: "workspace_desk", label: "Dedicated desk" },
  { code: "meeting_room", label: "Meeting room" },
  { code: "phone_booth", label: "Phone booth" },
  { code: "laundry", label: "Laundry" },
  { code: "air_conditioning", label: "Air conditioning" },
  { code: "heating", label: "Heating" },
  { code: "parking", label: "Parking" },
  { code: "coffee", label: "Coffee" },
];

/** Test accounts — password is always "Test1234!" */
const TEST_USERS = [
  { email: "guest@nomadhome.test", roles: ["guest"] as string[] },
  { email: "host@nomadhome.test", roles: ["guest", "host"] as string[] },
  { email: "admin@nomadhome.test", roles: ["guest", "admin"] as string[] },
];

async function main(): Promise<void> {
  // Upsert test users
  const passwordHash = await bcrypt.hash("Test1234!", 10);
  for (const u of TEST_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: { email: u.email, passwordHash, roles: u.roles, emailVerifiedAt: new Date() },
      });
      console.warn(`[db:seed] Created test user: ${u.email}`);
    }
  }

  for (const amenity of AMENITIES) {
    await prisma.amenity.upsert({
      where: { code: amenity.code },
      update: { label: amenity.label },
      create: amenity,
    });
  }

  // Ensure host profile exists for host@nomadhome.test
  const hostUser = await prisma.user.findUnique({ where: { email: "host@nomadhome.test" } });
  if (hostUser) {
    await prisma.hostProfile.upsert({
      where: { userId: hostUser.id },
      update: {},
      create: {
        userId: hostUser.id,
        displayName: "Test Host",
        payoutEmail: "host@nomadhome.test",
        acceptedTermsVersion: "2026-01-01",
      },
    });

    // Seed Madrid listings (published, so guests can find them)
    const madridListings = [
      {
        title: "Cozy studio in Malasaña",
        description:
          "Bright studio in the heart of Malasaña, Madrid's creative neighbourhood. Perfect for digital nomads who want to be close to cafés, co-working spaces, and nightlife.",
        type: "PROPERTY" as const,
        city: "Madrid",
        country: "ES",
        addressLine: "Calle del Pez 12, Malasaña",
        capacity: 1,
        nightlyRateCents: 7500,
        currency: "EUR",
        amenities: ["wifi", "workspace_desk", "air_conditioning", "coffee"],
      },
      {
        title: "Shared flat with private room in Lavapiés",
        description:
          "Spacious private room in a 4-bedroom shared flat. Common living room and fully equipped kitchen. 5-minute walk to Atocha train station.",
        type: "PROPERTY" as const,
        city: "Madrid",
        country: "ES",
        addressLine: "Calle de Argumosa 8, Lavapiés",
        capacity: 1,
        nightlyRateCents: 5500,
        currency: "EUR",
        amenities: ["wifi", "kitchen", "laundry", "air_conditioning"],
      },
      {
        title: "Dedicated desk at NomadHub Madrid",
        description:
          "Hot-desk in a modern co-working space in the Salamanca district. Includes meeting room credits, unlimited coffee, and fast fibre internet.",
        type: "WORKSPACE" as const,
        city: "Madrid",
        country: "ES",
        addressLine: "Calle de Serrano 55, Salamanca",
        capacity: 1,
        nightlyRateCents: 3500,
        currency: "EUR",
        amenities: ["wifi", "workspace_desk", "meeting_room", "phone_booth", "coffee"],
      },
      {
        title: "Penthouse with terrace near Retiro",
        description:
          "Stunning penthouse with a private terrace overlooking the city. Two bedrooms, ideal for a couple or two colleagues travelling together.",
        type: "PROPERTY" as const,
        city: "Madrid",
        country: "ES",
        addressLine: "Calle de Ibiza 22, Retiro",
        capacity: 2,
        nightlyRateCents: 14000,
        currency: "EUR",
        amenities: ["wifi", "kitchen", "air_conditioning", "workspace_desk", "laundry"],
      },
    ];

    const existingCount = await prisma.listing.count({
      where: { hostId: hostUser.id, city: "Madrid" },
    });
    if (existingCount === 0) {
      for (const l of madridListings) {
        const { amenities, ...data } = l;
        await prisma.listing.create({
          data: {
            ...data,
            hostId: hostUser.id,
            status: "PUBLISHED",
            amenities: { create: amenities.map((code) => ({ amenityCode: code })) },
          },
        });
      }
      console.warn(`[db:seed] Created ${madridListings.length} Madrid listings.`);
    }
  }

  console.warn(`[db:seed] Upserted ${AMENITIES.length} amenities.`);

  // Seed initial PlatformFeeConfig if none exists yet.
  // Values are placeholders (15% guest fee, 3% host commission in basis points).
  // NH-014 inserts a row with the final agreed values.
  const feeCount = await prisma.platformFeeConfig.count();
  if (feeCount === 0) {
    await prisma.platformFeeConfig.create({
      data: { guestServiceFeeBps: 1500, hostCommissionBps: 300, createdBy: "system" },
    });
    console.warn("[db:seed] Created initial PlatformFeeConfig (1500 bps / 300 bps).");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
