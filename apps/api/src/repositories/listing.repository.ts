import { prisma, type Listing, type ListingType, type ListingStatus } from "@nomadhome/db";

export interface ListingFields {
  title: string;
  description: string;
  type: ListingType;
  city: string;
  country: string;
  addressLine: string;
  capacity: number;
  nightlyRateCents: number;
  currency: string;
}

export type ListingWithAmenities = Listing & { amenities: { amenityCode: string }[] };

const withAmenities = { amenities: { select: { amenityCode: true } } } as const;

/** Persistence for the listings aggregate (Listing + its amenities). */
export class ListingRepository {
  /** How many of the given amenity codes actually exist. */
  countAmenities(codes: string[]): Promise<number> {
    return prisma.amenity.count({ where: { code: { in: codes } } });
  }

  create(
    hostId: string,
    fields: ListingFields,
    amenityCodes: string[],
  ): Promise<ListingWithAmenities> {
    return prisma.listing.create({
      data: {
        hostId,
        ...fields,
        amenities: { create: amenityCodes.map((amenityCode) => ({ amenityCode })) },
      },
      include: withAmenities,
    });
  }

  findById(id: string): Promise<ListingWithAmenities | null> {
    return prisma.listing.findUnique({ where: { id }, include: withAmenities });
  }

  listByHost(hostId: string): Promise<ListingWithAmenities[]> {
    return prisma.listing.findMany({
      where: { hostId },
      include: withAmenities,
      orderBy: { createdAt: "desc" },
    });
  }

  photoCount(id: string): Promise<number> {
    return prisma.listingPhoto.count({ where: { listingId: id } });
  }

  updateStatus(id: string, status: ListingStatus): Promise<ListingWithAmenities> {
    return prisma.listing.update({ where: { id }, data: { status }, include: withAmenities });
  }

  /** Update scalar fields; when amenityCodes is given, replace the amenity set. */
  update(
    id: string,
    fields: Partial<ListingFields>,
    amenityCodes?: string[],
  ): Promise<ListingWithAmenities> {
    return prisma.listing.update({
      where: { id },
      data: {
        ...fields,
        ...(amenityCodes
          ? {
              amenities: {
                deleteMany: {},
                create: amenityCodes.map((amenityCode) => ({ amenityCode })),
              },
            }
          : {}),
      },
      include: withAmenities,
    });
  }
}
