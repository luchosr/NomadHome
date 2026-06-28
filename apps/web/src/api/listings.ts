import { apiFetch } from "./client.js";

export interface ListingDetail {
  id: string;
  title: string;
  type: "PROPERTY" | "WORKSPACE";
  city: string;
  country: string;
  addressLine: string;
  description: string;
  capacity: number;
  nightlyRateCents: number;
  currency: string;
  amenities: Array<{ amenityCode: string }>;
  photos: Array<{ id: string; url: string; position: number }>;
  _count: { reviews: number };
  avgRating: number | null;
}

export interface BlockedRange {
  startDate: string;
  endDate: string;
}

export const listingsApi = {
  getDetail(id: string): Promise<ListingDetail> {
    return apiFetch(`/listings/${id}`);
  },
  getBlockedDates(id: string): Promise<BlockedRange[]> {
    return apiFetch(`/listings/${id}/blocked-dates`);
  },
};
