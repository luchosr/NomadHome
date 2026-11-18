import { describe, it, expect } from "vitest";
import {
  CHECKBOX_CLASS,
  CONTROL_CLASS,
  ERROR_BAR_CLASS,
  HINT_CLASS,
  LABEL_CLASS,
} from "./listingFormStyles.js";

// NH-122 (host-identity, design D2). listingFormStyles does not exist before the restyle, so this
// file is red because the module is missing (expected: created in the green phase). Tokens are
// asserted, not the exact string, so a reorder does not fail the test.

function tokens(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

describe("listingFormStyles", () => {
  it("LABEL_CLASS is the bold ink FormField label", () => {
    expect(tokens(LABEL_CLASS)).toEqual(
      expect.arrayContaining(["mb-2", "block", "text-sm", "font-bold", "text-fg"]),
    );
  });

  it("CONTROL_CLASS is the 2px ink edge, raised fill, small radius and invalid danger edge", () => {
    const t = tokens(CONTROL_CLASS);
    expect(t).toEqual(
      expect.arrayContaining([
        "w-full",
        "rounded-sm",
        "border-2",
        "border-border",
        "bg-surface-raised",
        "text-fg",
        "aria-[invalid=true]:border-danger",
      ]),
    );
    expect(t).not.toContain("rounded-md");
    expect(t).not.toContain("focus-visible:outline-none");
    expect(t).not.toContain("focus-visible:border-border");
  });

  it("HINT_CLASS is a muted left bar and ERROR_BAR_CLASS a bold danger left bar", () => {
    expect(tokens(HINT_CLASS)).toEqual(
      expect.arrayContaining([
        "border-l-4",
        "border-solid",
        "border-border-muted",
        "text-fg-muted",
      ]),
    );
    expect(tokens(ERROR_BAR_CLASS)).toEqual(
      expect.arrayContaining([
        "break-words",
        "border-l-4",
        "border-solid",
        "border-danger",
        "font-bold",
        "text-danger",
      ]),
    );
  });

  it("CHECKBOX_CLASS is a square 2px ink native checkbox that fills with ink", () => {
    expect(tokens(CHECKBOX_CLASS)).toEqual(
      expect.arrayContaining([
        "peer",
        "h-5",
        "w-5",
        "appearance-none",
        "rounded-none",
        "border-2",
        "border-border",
        "checked:bg-ink",
      ]),
    );
  });

  it("no constant uses the retired radius, shadow, ember or red tokens", () => {
    for (const value of [LABEL_CLASS, CONTROL_CLASS, HINT_CLASS, ERROR_BAR_CLASS, CHECKBOX_CLASS]) {
      expect(value).not.toMatch(
        /rounded-(md|lg|xl|full|pill)|shadow|ember|text-red-600|accent-action/,
      );
    }
  });
});
