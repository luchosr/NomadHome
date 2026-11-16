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

/** Resolve `signal` / `signal.DEFAULT` style entries to a hex string. */
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

describe("tailwind preset: Gantry tokens", () => {
  it("defines the brand palette", async () => {
    const colors = (await loadExtend()).colors as Dict;
    expect(hexOf(colors.signal)).toBe("#ffc700");
    expect(hexOf(colors["sign-green"])).toBe("#00704a");
    expect(hexOf(colors.black)).toMatch(/^#[0-9a-f]{6}$/);
    expect(hexOf(colors.white)).toBe("#ffffff");
  });

  it("defines semantic roles", async () => {
    const ext = await loadExtend();
    const colors = ext.colors as Dict;
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

  it("defines flat (non-blurred) elevations", async () => {
    const shadows = (await loadExtend()).boxShadow as Record<string, string>;
    expect(Object.keys(shadows).length).toBeGreaterThan(0);
    for (const value of Object.values(shadows)) {
      // offset-x offset-y 0-blur [spread] colour
      expect(value).toMatch(/^-?\d+(px)?\s+-?\d+(px)?\s+0(px)?(\s|$)/);
    }
  });

  it("removes the legacy sand/ink/forest/terracotta scales", async () => {
    const colors = (await loadExtend()).colors as Dict;
    for (const legacy of ["sand", "ink", "forest", "terracotta"]) {
      expect(colors, `colors.${legacy}`).not.toHaveProperty(legacy);
    }
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
