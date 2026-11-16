import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Spec: "Brand colour pairings meet WCAG 2.1 AA" and "Focus ring is visible on every surface".
const repoRoot = resolve(__dirname, "../../..");

type Dict = Record<string, unknown>;

async function loadColors(): Promise<Dict> {
  const href = pathToFileURL(join(repoRoot, "packages/config/tailwind.preset.js")).href;
  const mod = (await import(/* @vite-ignore */ href)) as {
    default: { theme: { extend: { colors: Dict } } };
  };
  return mod.default.theme.extend.colors;
}

function hexOf(entry: unknown): string {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry === "object" && "DEFAULT" in entry)
    return hexOf((entry as Dict).DEFAULT);
  throw new Error(`token not resolvable to a hex colour: ${JSON.stringify(entry)}`);
}

function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe("token pairing contrast (WCAG 2.1 AA)", () => {
  it("black on signal yellow meets 4.5:1", async () => {
    const c = await loadColors();
    expect(ratio(hexOf(c.black), hexOf(c.signal))).toBeGreaterThanOrEqual(4.5);
  });

  it("white on sign green meets 4.5:1", async () => {
    const c = await loadColors();
    expect(ratio(hexOf(c.white), hexOf(c["sign-green"]))).toBeGreaterThanOrEqual(4.5);
  });

  it("black on white meets 4.5:1", async () => {
    const c = await loadColors();
    expect(ratio(hexOf(c.black), hexOf(c.white))).toBeGreaterThanOrEqual(4.5);
  });

  it("the focus ring is declared with brand tokens, not legacy scales", () => {
    const css = readFileSync(join(repoRoot, "packages/ui/src/styles/globals.css"), "utf8");
    const rule = /:focus-visible\s*\{[^}]*\}/.exec(css)?.[0] ?? "";
    expect(rule).not.toBe("");
    expect(rule).not.toMatch(/forest|sand|terracotta|ink/);
  });

  it("a black or white focus ring reaches 3:1 on signal, white and green surfaces", async () => {
    const c = await loadColors();
    for (const surface of [c.signal, c.white, c["sign-green"]]) {
      const best = Math.max(
        ratio(hexOf(c.black), hexOf(surface)),
        ratio(hexOf(c.white), hexOf(surface)),
      );
      expect(best).toBeGreaterThanOrEqual(3);
    }
  });
});
