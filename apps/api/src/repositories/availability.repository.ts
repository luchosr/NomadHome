import { prisma, type AvailabilityBlock } from "@nomadhome/db";

export class AvailabilityRepository {
  createHostBlock(listingId: string, startDate: Date, endDate: Date): Promise<AvailabilityBlock> {
    return prisma.availabilityBlock.create({
      data: { listingId, startDate, endDate, source: "HOST_BLOCK" },
    });
  }

  /** Returns the first block on this listing whose range overlaps [startDate, endDate). */
  async findOverlapping(
    listingId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AvailabilityBlock | null> {
    const blocks = await prisma.availabilityBlock.findMany({ where: { listingId } });
    return blocks.find((b) => b.startDate < endDate && b.endDate > startDate) ?? null;
  }

  listByListing(listingId: string): Promise<AvailabilityBlock[]> {
    return prisma.availabilityBlock.findMany({
      where: { listingId },
      orderBy: { startDate: "asc" },
    });
  }

  findById(id: string): Promise<AvailabilityBlock | null> {
    return prisma.availabilityBlock.findUnique({ where: { id } });
  }

  delete(id: string): Promise<AvailabilityBlock> {
    return prisma.availabilityBlock.delete({ where: { id } });
  }
}
