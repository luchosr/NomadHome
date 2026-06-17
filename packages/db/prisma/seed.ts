/**
 * Database seed entrypoint.
 *
 * Idempotent: safe to run repeatedly. Each capability adds its own seed data.
 */
import { PrismaClient } from "@prisma/client";

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

async function main(): Promise<void> {
  for (const amenity of AMENITIES) {
    await prisma.amenity.upsert({
      where: { code: amenity.code },
      update: { label: amenity.label },
      create: amenity,
    });
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
