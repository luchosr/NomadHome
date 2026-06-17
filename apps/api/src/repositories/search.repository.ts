import { prisma } from "@nomadhome/db";
import type { SearchQuery, SearchResultItem } from "@nomadhome/shared";

export class SearchRepository {
  async search(params: SearchQuery): Promise<{ rows: SearchResultItem[]; total: number }> {
    const {
      city,
      checkIn,
      checkOut,
      type,
      amenities,
      minPrice,
      maxPrice,
      capacity,
      page,
      pageSize,
    } = params;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86_400_000);

    const where = {
      status: "PUBLISHED" as const,
      city: { equals: city, mode: "insensitive" as const },
      availabilityBlocks: {
        none: {
          startDate: { lt: checkOutDate },
          endDate: { gt: checkInDate },
        },
      },
      ...(type ? { type } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            nightlyRateCents: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(capacity !== undefined ? { capacity: { gte: capacity } } : {}),
      ...(amenities && amenities.length > 0
        ? {
            AND: amenities.map((code) => ({
              amenities: { some: { amenityCode: code } },
            })),
          }
        : {}),
    };

    const [listings, total] = await prisma.$transaction([
      prisma.listing.findMany({
        where,
        include: {
          photos: {
            orderBy: { position: "asc" },
            take: 1,
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    const rows: SearchResultItem[] = listings.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      city: l.city,
      country: l.country,
      nightlyRateCents: l.nightlyRateCents,
      currency: l.currency,
      totalCents: l.nightlyRateCents * nights,
      primaryPhotoUrl: l.photos[0]?.url ?? null,
    }));

    return { rows, total };
  }
}
