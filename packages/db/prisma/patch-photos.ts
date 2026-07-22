/**
 * One-off patch: attach curated Unsplash photos to the seeded Madrid listings.
 * Safe to re-run — skips listings that already have photos.
 *
 * Usage:
 *   DATABASE_URL="..." pnpm tsx packages/db/prisma/patch-photos.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UNSPLASH = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&fit=crop`;

const PHOTO_MAP: Record<string, string[]> = {
  "Cozy studio in Malasaña": [
    UNSPLASH("1502672260266-1c1ef2d93688"), // bright apartment interior
    UNSPLASH("1560448204-e02f11c3d0e2"), // living room
    UNSPLASH("1484154218962-a197022b5858"), // kitchen counter
  ],
  "Shared flat with private room in Lavapiés": [
    UNSPLASH("1586023492125-27b2c045efd7"), // cozy bedroom
    UNSPLASH("1522708323590-d24dbb6b0267"), // private room
    UNSPLASH("1493809842364-78817add7ffb"), // common area
  ],
  "Dedicated desk at NomadHub Madrid": [
    UNSPLASH("1497366216548-37526070297c"), // co-working open space
    UNSPLASH("1497366754035-f200968a6e72"), // desks and monitors
    UNSPLASH("1524758631624-e2822e304c36"), // modern workspace
  ],
  "Penthouse with terrace near Retiro": [
    UNSPLASH("1512917774080-9991f1c4c750"), // rooftop terrace
    UNSPLASH("1536376072261-38c75010e6c9"), // penthouse living room
    UNSPLASH("1505873242700-f289a29e1884"), // city view terrace
  ],
};

async function main(): Promise<void> {
  const host = await prisma.user.findUnique({ where: { email: "host@nomadhome.test" } });
  if (!host) {
    console.error("host@nomadhome.test not found — run the seed first.");
    process.exit(1);
  }

  const listings = await prisma.listing.findMany({
    where: { hostId: host.id, city: "Madrid" },
    include: { photos: true },
  });

  if (listings.length === 0) {
    console.log("No Madrid listings found — run the seed first.");
    return;
  }

  for (const listing of listings) {
    if (listing.photos.length > 0) {
      console.log(`  skip  "${listing.title}" (already has ${listing.photos.length} photo(s))`);
      continue;
    }

    const urls = PHOTO_MAP[listing.title];
    if (!urls) {
      console.log(`  skip  "${listing.title}" (no photo map entry)`);
      continue;
    }

    await prisma.listingPhoto.createMany({
      data: urls.map((url, position) => ({ listingId: listing.id, url, position })),
    });
    console.log(`  added ${urls.length} photos → "${listing.title}"`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
