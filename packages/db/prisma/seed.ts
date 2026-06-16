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
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
