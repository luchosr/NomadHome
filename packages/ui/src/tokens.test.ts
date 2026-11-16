import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Spec: "Shared design tokens expose the NomadHome brand to Tailwind".
const repoRoot = resolve(__dirname, "../../..");
const presetPath = join(repoRoot, "packages/config/tailwind.preset.js");

type Dict = Record<string, unknown>;

async function loadExtend(): Promise<Dict> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(presetPath).href)) as {
    default: { theme: { extend: Dict } };
  };
  return mod.default.theme.extend;
}

/** Resolve `ember` / `ember.DEFAULT` style entries to a hex string. */
function hexOf(entry: unknown): string | undefined {
  if (typeof entry === "string") return entry.toLowerCase();
  if (entry && typeof entry === "object" && "DEFAULT" in entry) {
    return hexOf((entry as Dict).DEFAULT);
  }
  return undefined;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

// Spec (warm-palette-swap): "Shared design tokens expose the NomadHome brand to Tailwind".
const WARM_PALETTE = ["#e65f35", "#96a8a6", "#f7f5f2", "#e5e2dd", "#1e1e1e"];

describe("tailwind preset: warm palette tokens", () => {
  it("defines the brand palette with exact hex values", async () => {
    const colors = (await loadExtend()).colors as Dict;
    expect(hexOf(colors.ember)).toBe("#e65f35");
    expect(hexOf(colors.sage)).toBe("#96a8a6");
    expect(hexOf(colors.paper)).toBe("#f7f5f2");
    expect(hexOf(colors.stone)).toBe("#e5e2dd");
    expect(hexOf(colors.ink)).toBe("#1e1e1e");
  });

  it("points the surface roles at the warm palette", async () => {
    const surface = (await loadExtend()).colors as Dict;
    const s = surface.surface as Dict;
    expect(hexOf(s.DEFAULT)).toBe("#f7f5f2");
    expect(hexOf(s.inset)).toBe("#e5e2dd");
    expect(hexOf(s.ember)).toBe("#e65f35");
    expect(hexOf(s.sage)).toBe("#96a8a6");
    expect(hexOf(s.inverse)).toBe("#1e1e1e");
  });

  it("points text, border and action roles at the warm neutrals", async () => {
    const c = (await loadExtend()).colors as Dict;
    const fg = c.fg as Dict;
    const border = c.border as Dict;
    const action = c.action as Dict;
    expect(hexOf(fg.DEFAULT)).toBe("#1e1e1e");
    expect(hexOf(fg.muted)).toBe("#3f3b37");
    expect(hexOf(fg.subtle)).toBe("#57534e");
    expect(hexOf(fg.inverse)).toBe("#f7f5f2");
    expect(hexOf(border.DEFAULT)).toBe("#1e1e1e");
    expect(hexOf(border.muted)).toBe("#6f6a63");
    expect(hexOf(action.DEFAULT)).toBe("#1e1e1e");
    expect(hexOf(action.hover)).toBe("#333333");
    expect(hexOf(action.fg)).toBe("#f7f5f2");
  });

  it("redefines the status roles inside the warm palette", async () => {
    const c = (await loadExtend()).colors as Dict;
    const expected: Record<string, [string, string]> = {
      success: ["#2f5f3e", "#e4eee5"],
      warning: ["#7a4a00", "#f6e7c1"],
      danger: ["#9b1c2e", "#f8e1e0"],
      info: ["#1f4e79", "#e1ebf3"],
    };
    for (const [role, [fg, bg]] of Object.entries(expected)) {
      const entry = c[role] as Dict;
      expect(hexOf(entry.DEFAULT), `${role}`).toBe(fg);
      expect(hexOf(entry.bg), `${role}.bg`).toBe(bg);
    }
    expect(hexOf((c.danger as Dict).hover)).toBe("#7e1625");
  });

  it("removes the Gantry yellow/green names from the palette and roles", async () => {
    const colors = (await loadExtend()).colors as Dict;
    for (const gone of ["signal", "sign-green", "black", "white"]) {
      expect(colors, `colors.${gone}`).not.toHaveProperty(gone);
    }
    const surface = colors.surface as Dict;
    for (const gone of ["signal", "green"]) {
      expect(surface, `surface.${gone}`).not.toHaveProperty(gone);
    }
  });

  it("defines semantic roles", async () => {
    const colors = (await loadExtend()).colors as Dict;
    for (const role of ["surface", "fg", "border", "action", "success"]) {
      expect(colors, `colors.${role}`).toHaveProperty(role);
    }
  });

  it("defines display, sans and mono font families", async () => {
    const fonts = (await loadExtend()).fontFamily as Dict;
    for (const family of ["display", "sans", "mono"]) {
      expect(fonts, `fontFamily.${family}`).toHaveProperty(family);
    }
  });

  it("defines flat (non-blurred) elevations in ink", async () => {
    const shadows = (await loadExtend()).boxShadow as Record<string, string>;
    expect(Object.keys(shadows).length).toBeGreaterThan(0);
    for (const value of Object.values(shadows)) {
      // offset-x offset-y 0-blur [spread] colour
      expect(value).toMatch(/^-?\d+(px)?\s+-?\d+(px)?\s+0(px)?(\s|$)/);
      expect(value.toLowerCase()).toContain("#1e1e1e");
    }
  });

  it("removes the legacy sand/forest/terracotta scales and the numeric ink scale", async () => {
    const colors = (await loadExtend()).colors as Dict;
    for (const legacy of ["sand", "forest", "terracotta"]) {
      expect(colors, `colors.${legacy}`).not.toHaveProperty(legacy);
    }
    // `ink` is a bare colour now, never the old numeric scale.
    expect(typeof colors.ink).toBe("string");
  });
});

describe("css custom properties", () => {
  const css = readFileSync(join(repoRoot, "packages/ui/src/styles/globals.css"), "utf8");
  const root = /:root\s*\{[^}]*\}/.exec(css)?.[0] ?? "";

  it("declares the warm palette variables and drops the Gantry ones", () => {
    expect(root).not.toBe("");
    for (const [name, hex] of [
      ["ember", "#e65f35"],
      ["sage", "#96a8a6"],
      ["paper", "#f7f5f2"],
      ["stone", "#e5e2dd"],
      ["ink", "#1e1e1e"],
    ] as const) {
      expect(root.toLowerCase(), `--${name}`).toMatch(new RegExp(`--${name}:\\s*${hex}`));
    }
    for (const gone of ["signal", "sign-green", "black", "white"]) {
      expect(root, `--${gone}`).not.toMatch(new RegExp(`--${gone}\\s*:`));
    }
  });

  it("selects text with ink on ember and paints the canvas paper", () => {
    const selection = /::selection\s*\{[^}]*\}/.exec(css)?.[0] ?? "";
    expect(selection).toMatch(/background:\s*var\(--ember\)/);
    expect(selection).toMatch(/color:\s*var\(--ink\)/);
    expect(root).toMatch(/--surface:\s*var\(--paper\)/);
    expect(root).toMatch(/--surface-inset:\s*var\(--stone\)/);
  });
});

describe("legacy scale usage", () => {
  it("finds no sand-/forest-/terracotta-/ink- utilities in apps/web/src or packages/ui/src", () => {
    const re = /\b(?:sand|forest|terracotta|ink)-(?:50|100|200|300|400|500|700|900)\b/;
    const offenders = [
      ...walk(join(repoRoot, "apps/web/src")),
      ...walk(join(repoRoot, "packages/ui/src")),
    ].filter((f) => re.test(readFileSync(f, "utf8")));
    expect(offenders.map((f) => f.replace(repoRoot, ""))).toEqual([]);
  });
});

describe("old Gantry palette usage", () => {
  const sources = () => [
    ...walk(join(repoRoot, "apps/web/src")),
    ...walk(join(repoRoot, "packages/ui/src")),
  ];
  const rel = (f: string) => f.replace(repoRoot, "");

  it("finds no signal, sign-green, surface-green or surface-signal tokens in source", () => {
    const re = /(?:--|\b)(?:signal|sign-green|surface-green|surface-signal)\b|\bsignalButton\b/;
    const offenders = sources().filter((f) => re.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("finds no -black or -white colour utilities or --black/--white variables in source", () => {
    const re =
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|to|via|divide|placeholder|decoration|shadow|accent|caret)-(?:black|white)\b|var\(--(?:black|white)\)/;
    const offenders = sources().filter((f) => re.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("finds no hex literal outside the warm palette (the preset and the :root block are exempt)", () => {
    const offenders: string[] = [];
    for (const f of sources()) {
      let text = readFileSync(f, "utf8");
      if (f.endsWith("globals.css")) text = text.replace(/:root\s*\{[^}]*\}/, "");
      const hexes = (text.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((h) => h.toLowerCase());
      const stray = hexes.filter((h) => !WARM_PALETTE.includes(h));
      if (stray.length) offenders.push(`${rel(f)}: ${[...new Set(stray)].join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });

  it("finds no old palette hex in the logo and favicon assets", () => {
    const assets = [
      ...readdirSync(join(repoRoot, "packages/ui/src/assets"))
        .filter((n) => n.endsWith(".svg"))
        .map((n) => join(repoRoot, "packages/ui/src/assets", n)),
      join(repoRoot, "apps/web/public/favicon.svg"),
    ];
    const old = /#(?:FFC700|0A0A0A|00704A|FFFFFF)\b/i;
    const offenders = assets.filter((f) => old.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
    for (const f of assets) {
      const hexes = (readFileSync(f, "utf8").match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((h) =>
        h.toLowerCase(),
      );
      expect(
        hexes.every((h) => WARM_PALETTE.includes(h)),
        rel(f),
      ).toBe(true);
    }
  });
});
