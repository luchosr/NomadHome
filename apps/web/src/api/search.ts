import { apiFetch } from "./client.js";
import type { SearchResponse } from "@nomadhome/shared";

export interface SearchParams {
  city: string;
  checkIn?: string;
  checkOut?: string;
  page?: number;
}

export const searchApi = {
  search(params: SearchParams): Promise<SearchResponse> {
    const q = new URLSearchParams({ city: params.city, page: String(params.page ?? 1) });
    if (params.checkIn) q.set("checkIn", params.checkIn);
    if (params.checkOut) q.set("checkOut", params.checkOut);
    return apiFetch(`/search?${q.toString()}`);
  },
};
