import { describe, it, expect } from "vitest";
import { SearchResultItemSchema } from "./search.js";

const base = {
  id: "l1",
  title: "Room",
  type: "PROPERTY" as const,
  city: "Lisbon",
  country: "PT",
  nightlyRateCents: 8000,
  currency: "USD",
  totalCents: 8000,
  primaryPhotoUrl: null,
};

describe("SearchResultItemSchema amenities", () => {
  it("preserves an amenities array of codes", () => {
    const parsed = SearchResultItemSchema.parse({ ...base, amenities: ["ac", "wifi"] });
    expect(parsed.amenities).toEqual(["ac", "wifi"]);
  });

  it("accepts items without amenities (optional)", () => {
    const parsed = SearchResultItemSchema.parse(base);
    expect(parsed.amenities).toBeUndefined();
  });

  it("rejects non-string amenity entries", () => {
    expect(SearchResultItemSchema.safeParse({ ...base, amenities: [1] }).success).toBe(false);
  });
});
