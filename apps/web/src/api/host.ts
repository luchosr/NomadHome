import { apiFetch } from "./client.js";

export interface HostListing {
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
  status: "DRAFT" | "PUBLISHED" | "DISABLED";
  amenities: Array<{ amenityCode: string }>;
  primaryPhotoUrl: string | null;
  _count?: { bookings: number };
}

export interface CreateListingInput {
  title: string;
  description: string;
  type: "PROPERTY" | "WORKSPACE";
  city: string;
  country: string;
  addressLine: string;
  capacity: number;
  nightlyRateCents: number;
  currency: string;
  amenityCodes: string[];
}

export const hostApi = {
  listMine(): Promise<HostListing[]> {
    return apiFetch("/listings/mine");
  },
  getOne(id: string): Promise<HostListing> {
    return apiFetch(`/listings/${id}/manage`);
  },
  create(input: CreateListingInput): Promise<HostListing> {
    return apiFetch("/listings", { method: "POST", body: JSON.stringify(input) });
  },
  update(id: string, input: Partial<CreateListingInput>): Promise<HostListing> {
    return apiFetch(`/listings/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },
  publish(id: string): Promise<HostListing> {
    return apiFetch(`/listings/${id}/publish`, { method: "PATCH" });
  },
  unpublish(id: string): Promise<HostListing> {
    return apiFetch(`/listings/${id}/unpublish`, { method: "PATCH" });
  },
};
