import { type Review } from "@nomadhome/db";
import { ReviewRepository, type PublicReview } from "../repositories/review.repository.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";

export class ReviewNotFoundError extends Error {
  constructor() {
    super("BOOKING_NOT_FOUND");
    this.name = "ReviewNotFoundError";
  }
}

export class BookingNotConfirmedError extends Error {
  constructor() {
    super("BOOKING_NOT_CONFIRMED");
    this.name = "BookingNotConfirmedError";
  }
}

export class CheckoutNotPassedError extends Error {
  constructor() {
    super("CHECKOUT_NOT_PASSED");
    this.name = "CheckoutNotPassedError";
  }
}

export class ReviewAlreadyExistsError extends Error {
  constructor() {
    super("REVIEW_ALREADY_EXISTS");
    this.name = "ReviewAlreadyExistsError";
  }
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && err.message.includes("Unique constraint failed");
}

export class ReviewService {
  constructor(
    private readonly reviews: ReviewRepository,
    private readonly bookings: BookingRepository,
    private readonly listings: ListingRepository,
  ) {}

  async create(
    guestId: string,
    bookingId: string,
    rating: number,
    text: string | undefined,
  ): Promise<Review> {
    const booking = await this.bookings.findById(bookingId);
    if (!booking || booking.guestId !== guestId) throw new ReviewNotFoundError();
    if (booking.status !== "CONFIRMED") throw new BookingNotConfirmedError();

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (booking.checkOut >= today) throw new CheckoutNotPassedError();

    try {
      return await this.reviews.create({
        bookingId,
        listingId: booking.listingId,
        guestId,
        rating,
        text,
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw new ReviewAlreadyExistsError();
      throw err;
    }
  }

  async listForListing(
    listingId: string,
  ): Promise<{ reviews: PublicReview[]; averageRating: number | null; reviewCount: number }> {
    const listing = await this.listings.findById(listingId);
    const reviews = await this.reviews.findByListing(listingId);
    return {
      reviews,
      averageRating: listing?.averageRating ? Number(listing.averageRating) : null,
      reviewCount: listing?.reviewCount ?? 0,
    };
  }
}
