import { describe, it, expect } from "vitest";

// Red-phase note (NH-121): money.ts does not exist yet. import.meta.glob resolves to an
// empty record until the module is extracted, so typecheck stays clean now and the real
// export is exercised once it exists. The loader is typed against the intended signature.
type FormatRate = (cents: number, currency: string) => string;

const modules = import.meta.glob<{ formatRate?: FormatRate }>("./money.ts");

async function loadFormatRate(): Promise<FormatRate> {
  const load = modules["./money.ts"];
  if (!load) throw new Error("apps/web/src/lib/money.ts does not exist yet");
  const mod = await load();
  if (typeof mod.formatRate !== "function") throw new Error("lib/money exports no formatRate");
  return mod.formatRate;
}

describe("formatRate", () => {
  it("formats USD cents without conversion", async () => {
    expect((await loadFormatRate())(7500, "USD")).toBe("$75.00");
  });

  it("formats EUR cents in EUR, not USD", async () => {
    expect((await loadFormatRate())(4200, "EUR")).toBe("€42.00");
  });

  it("keeps cents precision and thousands separators", async () => {
    expect((await loadFormatRate())(110050, "USD")).toBe("$1,100.50");
  });
});
