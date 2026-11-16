import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Spec (warm-palette-swap): "Brand colour pairings meet WCAG 2.1 AA" and
// "Focus ring is visible on every surface". Pairings come from design.md D2 and D7.
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

const css = readFileSync(join(repoRoot, "packages/ui/src/styles/globals.css"), "utf8");

/** Resolve a CSS custom property declared in :root to a hex, following var() chains. */
function cssVar(name: string): string {
  const root = /:root\s*\{[^}]*\}/.exec(css)?.[0] ?? "";
  const m = new RegExp(`--${name}:\\s*([^;]+);`).exec(root);
  if (!m) throw new Error(`--${name} is not declared in :root`);
  const value = m[1]!.trim();
  const ref = /^var\(--([\w-]+)\)$/.exec(value);
  return ref ? cssVar(ref[1]!) : value;
}

describe("approved pairings (WCAG 2.1 AA)", () => {
  it("meet their applicable threshold", async () => {
    const c = await loadColors();
    const fg = c.fg as Dict;
    const surface = c.surface as Dict;
    const border = c.border as Dict;
    const action = c.action as Dict;
    const paper = hexOf(c.paper);
    const stone = hexOf(c.stone);
    const ink = hexOf(c.ink);
    const ember = hexOf(c.ember);
    const sage = hexOf(c.sage);
    const status = (role: string) => c[role] as Dict;

    const pairs: Array<[string, string, string, number]> = [
      ["ink on paper", ink, paper, 4.5],
      ["ink on stone", ink, stone, 4.5],
      ["ink on sage", ink, sage, 4.5],
      ["ink on ember", ink, ember, 4.5],
      ["ink edge on ember", hexOf(border), ember, 3],
      ["paper on ink", paper, ink, 4.5],
      ["ember on ink (accent text)", ember, ink, 4.5],
      ["fg on surface.ember", hexOf(fg), hexOf(surface.ember), 4.5],
      ["fg on surface.sage", hexOf(fg), hexOf(surface.sage), 4.5],
      ["fg-inverse on surface.inverse", hexOf(fg.inverse), hexOf(surface.inverse), 4.5],
      ["fg-muted on paper", hexOf(fg.muted), paper, 4.5],
      ["fg-muted on stone", hexOf(fg.muted), stone, 4.5],
      ["fg-subtle on paper", hexOf(fg.subtle), paper, 4.5],
      ["fg-subtle on stone", hexOf(fg.subtle), stone, 4.5],
      ["border-muted on paper", hexOf(border.muted), paper, 3],
      ["border-muted on stone", hexOf(border.muted), stone, 3],
      ["action-fg on action", hexOf(action.fg), hexOf(action), 4.5],
      ["paper on action-hover", paper, hexOf(action.hover), 4.5],
      ["success on success-bg", hexOf(status("success")), hexOf(status("success").bg), 4.5],
      ["success on paper", hexOf(status("success")), paper, 4.5],
      ["warning on warning-bg", hexOf(status("warning")), hexOf(status("warning").bg), 4.5],
      ["warning on paper", hexOf(status("warning")), paper, 4.5],
      ["danger on danger-bg", hexOf(status("danger")), hexOf(status("danger").bg), 4.5],
      ["danger on paper", hexOf(status("danger")), paper, 4.5],
      ["paper on danger", paper, hexOf(status("danger")), 4.5],
      ["paper on danger-hover", paper, hexOf(status("danger").hover), 4.5],
      ["info on info-bg", hexOf(status("info")), hexOf(status("info").bg), 4.5],
      ["info on paper", hexOf(status("info")), paper, 4.5],
    ];
    for (const [label, a, b, min] of pairs) {
      expect(ratio(a, b), label).toBeGreaterThanOrEqual(min);
    }
  });

  it("pins the computed ratios from design.md D2", async () => {
    const c = await loadColors();
    const ink = hexOf(c.ink);
    expect(ratio(ink, hexOf(c.paper))).toBeCloseTo(15.32, 1);
    expect(ratio(ink, hexOf(c.ember))).toBeCloseTo(4.81, 1);
    expect(ratio(ink, hexOf(c.sage))).toBeCloseTo(6.71, 1);
  });
});

describe("disallowed pairings stay below 4.5:1", () => {
  it("are never approved for text or lines", async () => {
    const c = await loadColors();
    const fg = c.fg as Dict;
    const danger = c.danger as Dict;
    const paper = hexOf(c.paper);
    const stone = hexOf(c.stone);
    const ember = hexOf(c.ember);
    const sage = hexOf(c.sage);

    const pairs: Array<[string, string, string]> = [
      ["paper on ember", paper, ember],
      ["ember on paper", ember, paper],
      ["ember on stone", ember, stone],
      ["stone on ember", stone, ember],
      ["white on ember", "#FFFFFF", ember],
      ["ember on sage", ember, sage],
      ["sage on ember", sage, ember],
      ["sage on paper", sage, paper],
      ["paper on sage", paper, sage],
      ["sage on stone", sage, stone],
      ["fg-muted on ember", hexOf(fg.muted), ember],
      ["fg-subtle on ember", hexOf(fg.subtle), ember],
      ["danger on ember", hexOf(danger), ember],
      ["ember on danger-bg", ember, hexOf(danger.bg)],
      ["fg-muted on sage", hexOf(fg.muted), sage],
      ["paper on stone", paper, stone],
    ];
    for (const [label, a, b] of pairs) {
      expect(ratio(a, b), label).toBeLessThan(4.5);
    }
  });

  it("pins the headline failures from design.md D2", async () => {
    const c = await loadColors();
    expect(ratio(hexOf(c.paper), hexOf(c.ember))).toBeCloseTo(3.19, 1);
    expect(ratio(hexOf((c.fg as Dict).subtle), hexOf(c.ember))).toBeCloseTo(2.2, 1);
  });
});

describe("focus ring (design.md D7)", () => {
  const rule = /:focus-visible\s*\{[^}]*\}/.exec(css)?.[0] ?? "";

  it("is declared with warm tokens, not legacy scales or Gantry names", () => {
    expect(rule).not.toBe("");
    expect(rule).not.toMatch(/forest|sand|terracotta|signal|sign-green|--black|--white/);
    expect(rule).toMatch(/outline:\s*3px solid var\(--focus\)/);
  });

  it("adds a 2px gap layer so it never relies on blur or one colour", () => {
    expect(rule).toMatch(/box-shadow:\s*0 0 0 2px var\(--focus-gap\)/);
    expect(css).toMatch(/--focus-gap:\s*var\(--paper\)/);
    expect(css).toMatch(/--focus:\s*var\(--ink\)/);
  });

  it("resolves an ink outline over a paper gap by default", () => {
    expect(cssVar("focus").toLowerCase()).toBe("#1e1e1e");
    expect(cssVar("focus-gap").toLowerCase()).toBe("#f7f5f2");
  });

  it("keeps the outline at 4.5:1 or better on paper, stone, sage and ember fields", async () => {
    const c = await loadColors();
    const outline = cssVar("focus");
    const gap = cssVar("focus-gap");
    for (const field of [c.paper, c.stone, c.sage, c.ember]) {
      expect(ratio(outline, hexOf(field))).toBeGreaterThanOrEqual(4.5);
    }
    // Outline vs gap layer, and on ember the gap vs field per D7 (3.19).
    expect(ratio(outline, gap)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(gap, hexOf(c.ember))).toBeGreaterThanOrEqual(3);
  });

  it("uses a paper outline over an ink gap on ink fields", async () => {
    const c = await loadColors();
    expect(ratio(hexOf(c.paper), hexOf(c.ink))).toBeGreaterThanOrEqual(4.5);
  });

  it("overrides the ring on ink fields with paper/ink variables, not signal", () => {
    const sources = [
      "apps/web/src/components/Layout.tsx",
      "apps/web/src/pages/home/HomeFooter.tsx",
    ].map((p) => readFileSync(join(repoRoot, p), "utf8"));
    for (const src of sources) {
      expect(src).toContain("[--focus:var(--paper)]");
      expect(src).toContain("[--focus-gap:var(--ink)]");
      expect(src).not.toContain("--signal");
    }
  });
});
