import { describe, it, expect } from "vitest";
import { CreateListingSchema, UpdateListingSchema } from "./listing.js";

const valid = {
  title: "Sunny loft",
  description: "A bright room with a desk.",
  type: "PROPERTY" as const,
  city: "Ciudad de México",
  country: "MX",
  addressLine: "Calle Falsa 123",
  capacity: 2,
  nightlyRateCents: 5500,
  amenityCodes: ["wifi"],
};

describe("CreateListingSchema", () => {
  it("accepts a complete listing and defaults currency to USD", () => {
    const result = CreateListingSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currency).toBe("USD");
  });

  it("rejects a non-positive nightly rate", () => {
    expect(CreateListingSchema.safeParse({ ...valid, nightlyRateCents: 0 }).success).toBe(false);
  });

  it("rejects capacity below 1", () => {
    expect(CreateListingSchema.safeParse({ ...valid, capacity: 0 }).success).toBe(false);
  });

  it("rejects an empty amenity list", () => {
    expect(CreateListingSchema.safeParse({ ...valid, amenityCodes: [] }).success).toBe(false);
  });

  it("rejects an invalid type", () => {
    expect(CreateListingSchema.safeParse({ ...valid, type: "HOUSE" }).success).toBe(false);
  });
});

describe("UpdateListingSchema", () => {
  it("accepts a partial update", () => {
    expect(UpdateListingSchema.safeParse({ title: "New title" }).success).toBe(true);
  });

  it("still rejects an invalid field when present", () => {
    expect(UpdateListingSchema.safeParse({ capacity: 0 }).success).toBe(false);
  });
});
