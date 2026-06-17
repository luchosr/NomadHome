import { type AvailabilityBlock } from "@nomadhome/db";
import { AvailabilityRepository } from "../repositories/availability.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { ListingNotFoundError, ListingForbiddenError } from "./listing.service.js";

export { ListingNotFoundError, ListingForbiddenError };

export interface ConflictPayload {
  blockId: string;
  source: string;
  startDate: string;
  endDate: string;
  bookingId?: string;
}

export class OverlapConflictError extends Error {
  constructor(public readonly conflict: ConflictPayload) {
    super("overlap_conflict");
    this.name = "OverlapConflictError";
  }
}

export class BlockNotFoundError extends Error {
  constructor() {
    super("block_not_found");
    this.name = "BlockNotFoundError";
  }
}

export class BlockForbiddenError extends Error {
  constructor() {
    super("block_forbidden");
    this.name = "BlockForbiddenError";
  }
}

function isExclusionViolation(err: unknown): boolean {
  // Postgres error code 23P01 — exclusion constraint violation
  if (err instanceof Error) {
    return err.message.includes("23P01") || err.message.includes("availability_no_overlap");
  }
  return false;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class AvailabilityService {
  constructor(
    private readonly availability: AvailabilityRepository,
    private readonly listings: ListingRepository,
  ) {}

  async block(
    hostId: string,
    listingId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AvailabilityBlock> {
    await this.assertOwnership(hostId, listingId);
    try {
      return await this.availability.createHostBlock(listingId, startDate, endDate);
    } catch (err) {
      if (!isExclusionViolation(err)) throw err;
      const conflicting = await this.availability.findOverlapping(listingId, startDate, endDate);
      if (!conflicting) throw err as Error;
      throw new OverlapConflictError({
        blockId: conflicting.id,
        source: conflicting.source,
        startDate: toISODate(conflicting.startDate),
        endDate: toISODate(conflicting.endDate),
        ...(conflicting.bookingId ? { bookingId: conflicting.bookingId } : {}),
      });
    }
  }

  list(hostId: string, listingId: string): Promise<AvailabilityBlock[]> {
    return this.assertOwnership(hostId, listingId).then(() =>
      this.availability.listByListing(listingId),
    );
  }

  async deleteBlock(hostId: string, listingId: string, blockId: string): Promise<void> {
    await this.assertOwnership(hostId, listingId);
    const block = await this.availability.findById(blockId);
    if (!block || block.listingId !== listingId) throw new BlockNotFoundError();
    await this.availability.delete(blockId);
  }

  private async assertOwnership(hostId: string, listingId: string): Promise<void> {
    const listing = await this.listings.findById(listingId);
    if (!listing) throw new ListingNotFoundError();
    if (listing.hostId !== hostId) throw new ListingForbiddenError();
  }
}
