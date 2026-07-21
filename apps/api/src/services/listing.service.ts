import type { CreateListingInput, UpdateListingInput } from "@nomadhome/shared";
import {
  ListingRepository,
  type ListingPublicDetail,
  type ListingWithAmenities,
} from "../repositories/listing.repository.js";

export class ListingNotFoundError extends Error {
  constructor() {
    super("listing_not_found");
    this.name = "ListingNotFoundError";
  }
}

export class ListingForbiddenError extends Error {
  constructor() {
    super("listing_forbidden");
    this.name = "ListingForbiddenError";
  }
}

export class UnknownAmenityError extends Error {
  constructor() {
    super("unknown_amenity");
    this.name = "UnknownAmenityError";
  }
}

export class ListingNoPhotoError extends Error {
  constructor() {
    super("listing_no_photo");
    this.name = "ListingNoPhotoError";
  }
}

export class ListingService {
  constructor(private readonly listings: ListingRepository) {}

  async create(hostId: string, input: CreateListingInput): Promise<ListingWithAmenities> {
    await this.assertAmenitiesExist(input.amenityCodes);
    const { amenityCodes, ...fields } = input;
    return this.listings.create(hostId, fields, amenityCodes);
  }

  /** Fetch a listing, ensuring the caller owns it. */
  async getOwned(hostId: string, id: string): Promise<ListingWithAmenities> {
    const listing = await this.listings.findById(id);
    if (!listing) throw new ListingNotFoundError();
    if (listing.hostId !== hostId) throw new ListingForbiddenError();
    return listing;
  }

  listOwn(hostId: string) {
    return this.listings.listByHost(hostId);
  }

  async update(
    hostId: string,
    id: string,
    input: UpdateListingInput,
  ): Promise<ListingWithAmenities> {
    await this.getOwned(hostId, id); // existence + ownership
    const { amenityCodes, ...fields } = input;
    if (amenityCodes) await this.assertAmenitiesExist(amenityCodes);
    return this.listings.update(id, fields, amenityCodes);
  }

  async publish(hostId: string, id: string): Promise<ListingWithAmenities> {
    await this.getOwned(hostId, id);
    if ((await this.listings.photoCount(id)) === 0) throw new ListingNoPhotoError();
    return this.listings.updateStatus(id, "PUBLISHED");
  }

  async unpublish(hostId: string, id: string): Promise<ListingWithAmenities> {
    await this.getOwned(hostId, id);
    return this.listings.updateStatus(id, "DRAFT");
  }

  async getPublic(
    id: string,
  ): Promise<Omit<ListingPublicDetail, "reviews"> & { avgRating: number | null }> {
    const listing = await this.listings.findPublished(id);
    if (!listing) throw new ListingNotFoundError();
    const avgRating =
      listing.reviews.length > 0
        ? listing.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
          listing.reviews.length
        : null;
    const { reviews: _reviews, ...rest } = listing;
    return { ...rest, avgRating };
  }

  private async assertAmenitiesExist(codes: string[]): Promise<void> {
    const unique = [...new Set(codes)];
    const found = await this.listings.countAmenities(unique);
    if (found !== unique.length) throw new UnknownAmenityError();
  }
}
