import { prisma, Prisma, type ListingPhoto } from "@nomadhome/db";

export class PhotoPositionConflictError extends Error {
  constructor() {
    super("photo_position_conflict");
    this.name = "PhotoPositionConflictError";
  }
}

export class ListingPhotoRepository {
  create(listingId: string, url: string, position: number): Promise<ListingPhoto> {
    return prisma.listingPhoto.create({ data: { listingId, url, position } }).catch((err) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new PhotoPositionConflictError();
      }
      throw err;
    });
  }

  findById(id: string): Promise<ListingPhoto | null> {
    return prisma.listingPhoto.findUnique({ where: { id } });
  }

  listByListing(listingId: string): Promise<ListingPhoto[]> {
    return prisma.listingPhoto.findMany({
      where: { listingId },
      orderBy: { position: "asc" },
    });
  }

  updatePosition(id: string, position: number): Promise<ListingPhoto> {
    return prisma.listingPhoto.update({ where: { id }, data: { position } });
  }

  delete(id: string): Promise<ListingPhoto> {
    return prisma.listingPhoto.delete({ where: { id } });
  }
}
