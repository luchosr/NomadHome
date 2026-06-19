import { apiFetch } from "./client.js";

export interface AvailabilityBlock {
  id: string;
  startDate: string;
  endDate: string;
}

export const availabilityApi = {
  block(listingId: string, startDate: string, endDate: string): Promise<AvailabilityBlock> {
    return apiFetch(`/listings/${listingId}/availability`, {
      method: "POST",
      body: JSON.stringify({ startDate, endDate }),
    });
  },
  list(listingId: string): Promise<AvailabilityBlock[]> {
    return apiFetch(`/listings/${listingId}/availability`);
  },
  deleteBlock(listingId: string, blockId: string): Promise<void> {
    return apiFetch(`/listings/${listingId}/availability/${blockId}`, { method: "DELETE" });
  },
};
