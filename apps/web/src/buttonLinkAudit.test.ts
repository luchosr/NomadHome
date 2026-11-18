import { describe, it, expect } from "vitest";

// NH-138 (button-link-variants): source-level audit. The flat-edge overrides and the per-page CTA
// constants are replaced by the shared Button / buttonVariants primitive, so none may survive.

const sources = import.meta.glob<string>(
  ["./**/*.ts", "./**/*.tsx", "!./**/*.test.ts", "!./**/*.test.tsx"],
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
);

function offenders(pattern: RegExp): string[] {
  return Object.entries(sources)
    .filter(([, text]) => pattern.test(text))
    .map(([file]) => file)
    .sort();
}

describe("button-link-variants source audit", () => {
  it("scans the application sources", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20);
  });

  it("no source defines or uses FLAT_SECONDARY", () => {
    expect(offenders(/FLAT_SECONDARY/)).toEqual([]);
  });

  it("no source defines, imports or uses FLAT_CARD_CLASS", () => {
    expect(offenders(/FLAT_CARD_CLASS/)).toEqual([]);
  });

  it("no source carries the ![box-shadow:none] override", () => {
    expect(offenders(/!\[box-shadow:none\]/)).toEqual([]);
  });

  it("no page or component keeps a local CTA class constant", () => {
    expect(
      offenders(
        /const (?:CTA_BASE|PRIMARY_CTA|SECONDARY_CTA|TERTIARY_CTA|PRIMARY_LINK|SECONDARY_LINK)\b/,
      ),
    ).toEqual([]);
  });

  it("listingFormStyles keeps LABEL_CLASS", () => {
    const text = sources["./components/listingFormStyles.ts"] ?? "";
    expect(text).toMatch(/export const LABEL_CLASS/);
  });
});
