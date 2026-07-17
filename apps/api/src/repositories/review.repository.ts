import { prisma, type Review } from "@nomadhome/db";

export type PublicReview = Pick<Review, "id" | "listingId" | "rating" | "text" | "createdAt">;

export class ReviewRepository {
  /**
   * Insert a review and atomically recompute the listing's averageRating
   * and reviewCount in a single transaction.
   */
  create(data: {
    bookingId: string;
    listingId: string;
    guestId: string;
    rating: number;
    text?: string;
  }): Promise<Review> {
    return prisma.$transaction(async (tx) => {
      const review = await tx.review.create({ data });

      const agg = await tx.review.aggregate({
        where: { listingId: data.listingId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.listing.update({
        where: { id: data.listingId },
        data: {
          averageRating: agg._avg.rating ?? null,
          reviewCount: agg._count.rating,
        },
      });

      return review;
    });
  }

  findByListing(listingId: string): Promise<PublicReview[]> {
    return prisma.review.findMany({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      select: { id: true, listingId: true, rating: true, text: true, createdAt: true },
    });
  }
}
