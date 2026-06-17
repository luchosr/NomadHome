import crypto from "node:crypto";
import type { ListingPhoto } from "@nomadhome/db";
import {
  ListingPhotoRepository,
  PhotoPositionConflictError,
} from "../repositories/listing-photo.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import type { StorageService } from "./storage.service.js";

export { PhotoPositionConflictError };

export class PhotoNotFoundError extends Error {
  constructor() {
    super("photo_not_found");
    this.name = "PhotoNotFoundError";
  }
}

export class PhotoForbiddenError extends Error {
  constructor() {
    super("photo_forbidden");
    this.name = "PhotoForbiddenError";
  }
}

export class ListingPhotoService {
  constructor(
    private readonly photos: ListingPhotoRepository,
    private readonly listings: ListingRepository,
    private readonly storage: StorageService,
  ) {}

  async getUploadUrl(
    hostId: string,
    listingId: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    await this.assertOwnership(hostId, listingId);
    const key = `photos/${listingId}/${crypto.randomUUID()}`;
    const uploadUrl = await this.storage.getPresignedUploadUrl(key, contentType);
    return { uploadUrl, key };
  }

  async register(
    hostId: string,
    listingId: string,
    key: string,
    position: number,
  ): Promise<ListingPhoto> {
    await this.assertOwnership(hostId, listingId);
    const url = this.storage.publicUrlFor(key);
    return this.photos.create(listingId, url, position);
  }

  async list(hostId: string, listingId: string): Promise<ListingPhoto[]> {
    await this.assertOwnership(hostId, listingId);
    return this.photos.listByListing(listingId);
  }

  async updatePosition(
    hostId: string,
    listingId: string,
    photoId: string,
    position: number,
  ): Promise<ListingPhoto> {
    await this.assertOwnership(hostId, listingId);
    const photo = await this.photos.findById(photoId);
    if (!photo || photo.listingId !== listingId) throw new PhotoNotFoundError();
    return this.photos.updatePosition(photoId, position);
  }

  async delete(hostId: string, listingId: string, photoId: string): Promise<void> {
    await this.assertOwnership(hostId, listingId);
    const photo = await this.photos.findById(photoId);
    if (!photo || photo.listingId !== listingId) throw new PhotoNotFoundError();
    await this.photos.delete(photoId);
  }

  private async assertOwnership(hostId: string, listingId: string): Promise<void> {
    const listing = await this.listings.findById(listingId);
    if (!listing) throw new PhotoNotFoundError();
    if (listing.hostId !== hostId) throw new PhotoForbiddenError();
  }
}
