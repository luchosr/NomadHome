import { useQuery } from "@tanstack/react-query";
import { searchApi } from "../../api/search.js";

const FEATURED_COUNT = 3;

/**
 * The newest published listings (the API's default order), via the public search endpoint.
 * `retry: false` so an outage hides the section quickly instead of showing skeletons
 * through backoff retries (design.md D1).
 */
export function useFeaturedStays() {
  return useQuery({
    queryKey: ["home", "featured-stays"],
    queryFn: () => searchApi.search({ page: 1, pageSize: FEATURED_COUNT }),
    staleTime: 60_000,
    retry: false,
  });
}
