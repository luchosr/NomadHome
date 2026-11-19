import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as ui from "./index.js";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

describe("@nomadhome/ui entry point (NH-138)", () => {
  it("exports buttonVariants next to Button", () => {
    expect(typeof ui.buttonVariants).toBe("function");
    expect(ui.buttonVariants({ variant: "secondary" })).toContain("border-2");
  });

  it("exports the ButtonVariantProps type from the entry point", () => {
    const src = readFileSync(here("./index.ts"), "utf8");
    expect(src).toMatch(/ButtonVariantProps/);
    expect(src).toMatch(/buttonVariants/);
  });

  it("gains no react-router import or dependency", () => {
    const pkg = readFileSync(here("../package.json"), "utf8");
    expect(pkg).not.toMatch(/react-router/);
    for (const f of ["./index.ts", "./components/button.tsx"]) {
      expect(readFileSync(here(f), "utf8")).not.toMatch(/react-router/);
    }
  });
});
