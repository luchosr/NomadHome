import { test, expect } from "@playwright/test";
import type { Locator, Page, TestInfo } from "@playwright/test";

// Layout checks for the visual-identity refresh (NH-118, design.md D6) and the warm palette (NH-129).
// Deliberately NOT toHaveScreenshot(): pixel baselines recorded on macOS differ from
// Linux CI (fonts, antialiasing). These assertions fail on structural breakage instead:
// overflow, overlap, missing font, wrong orange colour. Screenshots are attached to the
// report as artifacts and never compared.

const API = "http://localhost:3000";
const EMBER_RGB = "rgb(230, 95, 53)";
const INK_RGB = "rgb(30, 30, 30)";

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-360", width: 360, height: 800 },
] as const;

const LISTING = {
  id: "listing-1",
  title: "Lisbon Studio",
  type: "PROPERTY",
  city: "Lisbon",
  country: "PT",
  nightlyRateCents: 7500,
  currency: "USD",
  totalCents: 52500,
  primaryPhotoUrl: null,
  amenities: ["ac", "kitchen", "wifi"],
};

const RESULTS = {
  data: [
    { ...LISTING, amenities: [] },
    {
      ...LISTING,
      id: "listing-2",
      title: "Porto Desk Suite with a long title that wraps onto a second line",
      type: "WORKSPACE",
      amenities: ["wifi", "ac"],
    },
  ],
  pagination: { total: 2, page: 1, pageSize: 20, hasMore: false },
};

async function mockSearch(page: Page) {
  await page.route(`${API}/search*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(RESULTS),
    }),
  );
}

async function box(locator: Locator) {
  await expect(locator).toBeVisible();
  const b = await locator.boundingBox();
  if (!b) throw new Error("element has no bounding box");
  return b;
}

type Box = { x: number; y: number; width: number; height: number };

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function expectNoHorizontalOverflow(page: Page) {
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(m.scrollWidth).toBeLessThanOrEqual(m.innerWidth);
}

async function expectInsideViewport(page: Page, b: Box) {
  const width = page.viewportSize()?.width ?? 0;
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(width);
}

async function expectOverpass(locator: Locator) {
  const family = await locator.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain("Overpass");
}

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string) {
  const body = await page.screenshot({ fullPage: true });
  await testInfo.attach(name, { body, contentType: "image/png" });
}

for (const vp of VIEWPORTS) {
  test.describe(`Layout at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("landing: hero is orange, in Overpass, without overflow or overlap", async ({
      page,
    }, testInfo) => {
      await mockSearch(page);
      await page.goto("/");

      const hero = page.locator('section[aria-labelledby="hero-title"]');
      await expect(hero).toBeVisible();
      await expect(hero).toHaveCSS("background-color", EMBER_RGB);
      await expect(hero).toHaveCSS("color", INK_RGB);
      await expectOverpass(page.locator("#hero-title"));

      const city = await box(page.locator("#city-search"));
      const numeral = await box(page.getByTestId("stay-length"));
      const action = await box(hero.locator('button[type="submit"]'));

      for (const b of [city, numeral, action]) await expectInsideViewport(page, b);
      expect(overlaps(city, numeral)).toBe(false);
      expect(overlaps(city, action)).toBe(false);
      expect(overlaps(numeral, action)).toBe(false);

      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `landing-${vp.name}`);
    });

    test("search: header band is orange, results render as non-overlapping cards", async ({
      page,
    }, testInfo) => {
      await mockSearch(page);
      await page.goto("/search?city=Lisbon");

      const band = page.locator("section.bg-ember").first();
      await expect(band).toHaveCSS("background-color", EMBER_RGB);
      await expect(band).toHaveCSS("color", INK_RGB);
      await expectOverpass(page.getByRole("heading", { level: 1 }));

      const cards = page.locator('a[href^="/listings/"]');
      await expect(cards).toHaveCount(2);
      await expect(cards.first()).toContainText("Lisbon Studio");
      await expect(cards.first()).toContainText("$75");
      await expect(cards.nth(1)).toContainText(/wi-?fi/i);

      const city = await box(page.locator("#city"));
      const action = await box(page.locator('form button[type="submit"]'));
      const first = await box(cards.first());
      const second = await box(cards.nth(1));

      for (const b of [city, action, first, second]) await expectInsideViewport(page, b);
      expect(overlaps(city, action)).toBe(false);
      expect(overlaps(first, second)).toBe(false);
      expect(overlaps(city, first)).toBe(false);
      expect(overlaps(action, first)).toBe(false);

      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `search-${vp.name}`);
    });
  });
}
