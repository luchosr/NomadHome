import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

// Computed-colour checks for the warm palette (NH-129, design.md D5/D7): the hero placeholder,
// the two-layer focus ring on orange and ink fields, ink-on-orange hover fill, and reduced motion.
// Ratios come from packages/ui/src/contrast.test.ts; these assert the real computed styles.

const API = "http://localhost:3000";
const EMBER_RGB = "rgb(230, 95, 53)";
const INK_RGB = "rgb(30, 30, 30)";
const PAPER_RGB = "rgb(247, 245, 242)";

// One real-shaped listing so the landing featured section (NH-121, API-driven) renders a row.
const LISTING = {
  id: "listing-1",
  title: "Lisbon Studio",
  type: "PROPERTY",
  city: "Lisbon",
  country: "PT",
  nightlyRateCents: 7500,
  currency: "USD",
  totalCents: 7500,
  primaryPhotoUrl: null,
  amenities: ["wifi"],
};

async function mockSearch(page: Page) {
  await page.route(`${API}/**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [LISTING],
        pagination: { total: 1, page: 1, pageSize: 3, hasMore: false },
      }),
    }),
  );
}

async function ring(page: Page) {
  return page.evaluate(() => {
    const cs = getComputedStyle(document.activeElement as Element);
    return {
      width: cs.outlineWidth,
      style: cs.outlineStyle,
      color: cs.outlineColor,
      shadow: cs.boxShadow,
    };
  });
}

test.describe("Focus, hover and motion (NH-129)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("hero city placeholder is ink on the orange panel", async ({ page }) => {
    await mockSearch(page);
    await page.goto("/");
    const city = page.locator("#city-search");
    await expect(city).toBeVisible();
    const placeholder = await city.evaluate((el) => getComputedStyle(el, "::placeholder").color);
    expect(placeholder).toBe(INK_RGB);
    await expect(page.locator('section[aria-labelledby="hero-title"]')).toHaveCSS(
      "background-color",
      EMBER_RGB,
    );
  });

  test("focus ring: ink outline with paper gap on orange, paper outline with ink gap on ink", async ({
    page,
  }) => {
    await mockSearch(page);
    await page.goto("/");
    await page.locator("#city-search").focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(page.locator("#city-search")).toBeFocused();
    const onOrange = await ring(page);
    expect(onOrange.style).toBe("solid");
    expect(onOrange.width).toBe("3px");
    expect(onOrange.color).toBe(INK_RGB);
    expect(onOrange.shadow).toContain(PAPER_RGB);

    await page.getByRole("link", { name: "Cookies" }).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const onInk = await ring(page);
    expect(onInk.width).toBe("3px");
    expect(onInk.color).toBe(PAPER_RGB);
    expect(onInk.shadow).toContain(INK_RGB);
  });

  test("departure-board row hover fills orange with ink text", async ({ page }) => {
    await mockSearch(page);
    await page.goto("/");
    const row = page.locator('a[href="/listings/listing-1"]').filter({ hasText: "Lisbon Studio" });
    await expect(row).toBeVisible();
    await row.hover();
    await expect(row).toHaveCSS("background-color", EMBER_RGB);
    await expect(row).toHaveCSS("color", INK_RGB);
  });

  test("prefers-reduced-motion removes every transition and animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockSearch(page);
    await page.goto("/");
    const offenders = await page.evaluate(() => {
      const ms = (v: string) =>
        Math.max(
          ...v
            .split(",")
            .map((x) => (x.trim().endsWith("ms") ? parseFloat(x) : parseFloat(x) * 1000)),
        );
      return [...document.querySelectorAll("*")]
        .filter((el) => {
          const cs = getComputedStyle(el);
          return ms(cs.transitionDuration) > 0.011 || ms(cs.animationDuration) > 0.011;
        })
        .map((el) => el.tagName);
    });
    expect(offenders).toEqual([]);
  });
});
