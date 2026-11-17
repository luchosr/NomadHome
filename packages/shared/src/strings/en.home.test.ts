import { describe, it, expect } from "vitest";
import { en } from "./en.js";

// Guards the removal of invented landing content (NH-121): these groups must not return.
const home = en.home as unknown as Record<string, Record<string, unknown>>;

describe("en.home dictionary", () => {
  it("has no stats or testimonial group", () => {
    expect(home).not.toHaveProperty("stats");
    expect(home).not.toHaveProperty("testimonial");
  });

  it("has no featured.cards group", () => {
    expect(home.featured).not.toHaveProperty("cards");
  });

  it("has no co-living example-rate keys", () => {
    const keys = Object.keys(home.coliving ?? {});
    expect(keys.filter((k) => k.startsWith("price_"))).toEqual([]);
  });

  it("has no workspace status-strip keys", () => {
    const keys = Object.keys(home.workspace ?? {});
    expect(keys.filter((k) => k.startsWith("status_"))).toEqual([]);
  });

  it("has the per-night suffix and loading label for real featured rows", () => {
    expect(home.featured).toHaveProperty("price_per_night");
    expect(home.featured).toHaveProperty("loading_label");
  });
});
