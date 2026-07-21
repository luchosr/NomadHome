import { apiFetch } from "./client.js";
import type { SearchResponse } from "@nomadhome/shared";

export interface SearchParams {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  page?: number;
  type?: "PROPERTY" | "WORKSPACE";
  amenities?: string[];
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
}

export const searchApi = {
  search(params: SearchParams): Promise<SearchResponse> {
    const q = new URLSearchParams({ page: String(params.page ?? 1) });
    if (params.city) q.set("city", params.city);
    if (params.checkIn) q.set("checkIn", params.checkIn);
    if (params.checkOut) q.set("checkOut", params.checkOut);
    if (params.type) q.set("type", params.type);
    if (params.amenities?.length) q.set("amenities", params.amenities.join(","));
    if (params.minPrice !== undefined) q.set("minPrice", String(params.minPrice));
    if (params.maxPrice !== undefined) q.set("maxPrice", String(params.maxPrice));
    if (params.capacity !== undefined) q.set("capacity", String(params.capacity));
    return apiFetch(`/search?${q.toString()}`);
  },
};
