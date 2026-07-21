import { apiFetch } from "./client.js";

export interface ListingPhoto {
  id: string;
  url: string;
  position: number;
}

export const photoApi = {
  getUploadUrl(
    listingId: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    return apiFetch(`/listings/${listingId}/photos/upload-url`, {
      method: "POST",
      body: JSON.stringify({ contentType }),
    });
  },
  register(listingId: string, key: string, position: number): Promise<ListingPhoto> {
    return apiFetch(`/listings/${listingId}/photos`, {
      method: "POST",
      body: JSON.stringify({ key, position }),
    });
  },
  list(listingId: string): Promise<ListingPhoto[]> {
    return apiFetch(`/listings/${listingId}/photos`);
  },
  deletePhoto(listingId: string, photoId: string): Promise<void> {
    return apiFetch(`/listings/${listingId}/photos/${photoId}`, { method: "DELETE" });
  },
};
