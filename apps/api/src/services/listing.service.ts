import type { CreateListingInput, UpdateListingInput } from "@nomadhome/shared";
import {
  ListingRepository,
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

  listOwn(hostId: string): Promise<ListingWithAmenities[]> {
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

  private async assertAmenitiesExist(codes: string[]): Promise<void> {
    const unique = [...new Set(codes)];
    const found = await this.listings.countAmenities(unique);
    if (found !== unique.length) throw new UnknownAmenityError();
  }
}
