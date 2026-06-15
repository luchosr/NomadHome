import { describe, it, expect, vi } from "vitest";
import { t } from "./t.js";
import { en } from "./strings/en.js";

describe("t()", () => {
  it("resolves a known key to its English value", () => {
    expect(t("common.app.name")).toBe(en.common.app.name);
  });

  it("conforms keys to the snake_case-dot format", () => {
    const KEY = "common.app.tagline";
    expect(KEY).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
    expect(t("common.app.tagline")).toBe(en.common.app.tagline);
  });

  it("always ships the reserved top-level domains", () => {
    expect(en).toHaveProperty("common");
    expect(en).toHaveProperty("error");
    expect(en).toHaveProperty("validation");
  });

  it("returns the marker string and warns for a missing key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // @ts-expect-error deliberately passing an unknown key
    const result = t("booking.does_not_exist");
    expect(result).toBe("<key-not-found: booking.does_not_exist>");
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("never throws on a missing key", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // @ts-expect-error deliberately passing an unknown key
    expect(() => t("nope.nope")).not.toThrow();
  });
});
