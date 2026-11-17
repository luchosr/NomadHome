import { test, expect } from "@playwright/test";
import type { Locator, Page, TestInfo } from "@playwright/test";
import { mockSession } from "./helpers/auth";

// Identity checks for the listing detail page (NH-126, listing-detail-identity design.md D11).
// Same policy as layout.spec.ts and auth-identity.spec.ts: computed styles and geometry are
// asserted, screenshots are attached as artifacts and never compared. Every API call is mocked.
//
// Selector assumptions (the page has no test ids beyond the skeleton):
//  - primary photo = first <img> whose alt is the listing title; thumbnails = the others;
//  - type tag = the element whose own text is "Property";
//  - amenity tags = the <li> items under the "Amenities" h2's parent;
//  - no-photo placeholder = the only element in <main> with a dashed border (visitor view);
//  - price band = nearest ancestor of the price text with the ember background, and the
//    booking panel = that band's parent;
//  - the nav is the sticky <header>.

const API = "http://localhost:3000";
const EMBER_RGB = "rgb(230, 95, 53)";
const INK_RGB = "rgb(30, 30, 30)";
const PAPER_RGB = "rgb(247, 245, 242)";
const STONE_RGB = "rgb(229, 226, 221)";
const DANGER_RGB = "rgb(155, 28, 46)";
const DANGER_BG_RGB = "rgb(248, 225, 224)";

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-360", width: 360, height: 800 },
] as const;

const PHOTO = (fill: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="${fill}"/></svg>`,
  )}`;

const LISTING_ID = "listing-1";
const TITLE = "Sunny Lisbon Apartment";
const PRICE = "$90.00";
const SENTENCE = "A bright apartment in the heart of Lisbon with a long sunny terrace. ";

const LISTING = {
  id: LISTING_ID,
  title: TITLE,
  type: "PROPERTY",
  city: "Lisbon",
  country: "PT",
  addressLine: "Rua Augusta 1, 1100-053 Lisboa",
  description: SENTENCE.repeat(60),
  capacity: 4,
  nightlyRateCents: 9000,
  currency: "USD",
  amenities: [{ amenityCode: "WIFI" }, { amenityCode: "KITCHEN" }],
  photos: [
    { id: "p1", url: PHOTO("#8a9a98"), position: 0 },
    { id: "p2", url: PHOTO("#c9b8a6"), position: 1 },
    { id: "p3", url: PHOTO("#a6b8c9"), position: 2 },
  ],
  _count: { reviews: 3 },
  avgRating: 4.5,
};

const LONG_WORD = "Verylongunbrokenword".repeat(6);
const LONG_LISTING = {
  ...LISTING,
  title: `${LONG_WORD} ${LONG_WORD}`,
  city: LONG_WORD,
  country: "PT",
  addressLine: `${LONG_WORD} ${LONG_WORD}`,
  description: `${LONG_WORD} ${LONG_WORD}`,
  amenities: [{ amenityCode: `${LONG_WORD}${LONG_WORD}` }, { amenityCode: "WIFI" }],
};

type Box = { x: number; y: number; width: number; height: number };

async function mockListing(page: Page, listing: object, status = 200) {
  await page.route(`${API}/listings/${LISTING_ID}`, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(
        status === 200 ? listing : { error: status === 404 ? "NOT_FOUND" : "SERVER_ERROR" },
      ),
    }),
  );
  await page.route(`${API}/listings/${LISTING_ID}/blocked-dates`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
}

async function box(locator: Locator): Promise<Box> {
  await expect(locator).toBeVisible();
  const b = await locator.boundingBox();
  if (!b) throw new Error("element has no bounding box");
  return b;
}

async function expectNoHorizontalOverflow(page: Page) {
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(m.scrollWidth).toBeLessThanOrEqual(m.innerWidth);
}

function expectInsideViewport(page: Page, b: Box) {
  const width = page.viewportSize()?.width ?? 0;
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(width);
}

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string) {
  const body = await page.screenshot({ fullPage: true });
  await testInfo.attach(name, { body, contentType: "image/png" });
}

async function expectEdge(locator: Locator, style: string) {
  for (const side of ["top", "right", "bottom", "left"]) {
    await expect(locator).toHaveCSS(`border-${side}-width`, "2px");
    await expect(locator).toHaveCSS(`border-${side}-style`, style);
    await expect(locator).toHaveCSS(`border-${side}-color`, INK_RGB);
  }
}

async function expectNoRadius(locator: Locator) {
  for (const corner of ["top-left", "top-right", "bottom-right", "bottom-left"]) {
    await expect(locator).toHaveCSS(`border-${corner}-radius`, "0px");
  }
}

/** Largest corner radius in px of an element (percentages count as pill-like: 9999). */
async function maxRadius(locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    const cs = getComputedStyle(el);
    const values = [
      cs.borderTopLeftRadius,
      cs.borderTopRightRadius,
      cs.borderBottomRightRadius,
      cs.borderBottomLeftRadius,
    ];
    return Math.max(...values.map((v) => (v.includes("%") ? 9999 : parseFloat(v))));
  });
}

async function focusUntil(page: Page, label: string): Promise<void> {
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab");
    const text = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    if (text === label) return;
  }
  throw new Error(`never focused "${label}"`);
}

async function focusRing(page: Page) {
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

/** Resolve the ember price band, its panel and its text colours from the price text. */
async function inspectBooking(page: Page) {
  return page
    .getByText(PRICE)
    .first()
    .evaluate((priceEl) => {
      let band: Element | null = priceEl;
      while (band && getComputedStyle(band).backgroundColor !== "rgb(230, 95, 53)") {
        band = band.parentElement;
      }
      if (!band) return null;
      const bandCs = getComputedStyle(band);
      const panel = band.parentElement as Element;
      const panelCs = getComputedStyle(panel);
      const colors: string[] = [];
      const walker = document.createTreeWalker(band, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.textContent && n.textContent.trim() && n.parentElement) {
          colors.push(getComputedStyle(n.parentElement).color);
        }
      }
      return {
        bandBg: bandCs.backgroundColor,
        bandBorderBottomWidth: bandCs.borderBottomWidth,
        bandBorderBottomColor: bandCs.borderBottomColor,
        bandBorderBottomStyle: bandCs.borderBottomStyle,
        bandText: band.textContent ?? "",
        colors,
        controls: band.querySelectorAll("input, button, a, select, textarea").length,
        panelBg: panelCs.backgroundColor,
        panelShadow: panelCs.boxShadow,
        panelPosition: panelCs.position,
        panelBorders: [
          panelCs.borderTopWidth,
          panelCs.borderRightWidth,
          panelCs.borderBottomWidth,
          panelCs.borderLeftWidth,
        ],
        panelBorderColor: panelCs.borderTopColor,
        panelBorderStyle: panelCs.borderTopStyle,
        panelMaxRadius: Math.max(
          ...[
            panelCs.borderTopLeftRadius,
            panelCs.borderTopRightRadius,
            panelCs.borderBottomRightRadius,
            panelCs.borderBottomLeftRadius,
          ].map((v) => parseFloat(v)),
        ),
      };
    });
}

/** The panel element (parent of the ember band) as a locator-free handle for geometry. */
async function panelTop(page: Page): Promise<number> {
  return page
    .getByText(PRICE)
    .first()
    .evaluate((priceEl) => {
      let band: Element | null = priceEl;
      while (band && getComputedStyle(band).backgroundColor !== "rgb(230, 95, 53)") {
        band = band.parentElement;
      }
      if (!band?.parentElement) throw new Error("no ember band");
      return band.parentElement.getBoundingClientRect().top;
    });
}

async function mainSurfacesOutsideSystem(page: Page) {
  return page.evaluate(() => {
    const offenders: string[] = [];
    for (const el of Array.from(document.querySelectorAll("main, main *"))) {
      const cs = getComputedStyle(el);
      const radii = [
        cs.borderTopLeftRadius,
        cs.borderTopRightRadius,
        cs.borderBottomRightRadius,
        cs.borderBottomLeftRadius,
      ].map((v) => (v.includes("%") ? 9999 : parseFloat(v)));
      const label = `${el.tagName.toLowerCase()}.${String(el.getAttribute("class") ?? "")}`;
      if (cs.boxShadow !== "none") offenders.push(`shadow ${label}`);
      if (cs.backgroundImage !== "none") offenders.push(`gradient/image ${label}`);
      if (Math.max(...radii) > 4) offenders.push(`radius ${label}`);
    }
    return offenders;
  });
}

async function dashedElements(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("main, main *"))
      .filter((el) => getComputedStyle(el).borderTopStyle === "dashed")
      .map((el) => {
        const cs = getComputedStyle(el);
        return {
          width: cs.borderTopWidth,
          bg: cs.backgroundColor,
          color: cs.borderTopColor,
          radius: cs.borderTopLeftRadius,
          text: (el.textContent ?? "").trim(),
        };
      }),
  );
}

for (const vp of VIEWPORTS) {
  test.describe(`Listing detail identity at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("loaded: framed photos, square tags, Overpass 900 title, no shadow or gradient", async ({
      page,
    }, testInfo) => {
      await mockListing(page, LISTING);
      await page.goto(`/listings/${LISTING_ID}`);

      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(TITLE);
      expect(await h1.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Overpass");
      await expect(h1).toHaveCSS("font-weight", "900");

      const photos = page.getByAltText(TITLE);
      await expect(photos).toHaveCount(3);
      const primary = photos.first();
      await expectEdge(primary, "solid");
      await expectNoRadius(primary);
      for (const i of [1, 2]) {
        await expectEdge(photos.nth(i), "solid");
        await expectNoRadius(photos.nth(i));
        expect(await photos.nth(i).evaluate((el) => el.closest("a, button") === null)).toBe(true);
      }

      const typeTag = page.getByText("Property", { exact: true });
      await expect(typeTag).toHaveCount(1);
      await expectEdge(typeTag, "solid");
      expect(await maxRadius(typeTag)).toBeLessThanOrEqual(4);

      const amenities = page
        .getByRole("heading", { level: 2, name: "Amenities" })
        .locator("xpath=..")
        .locator("li");
      await expect(amenities).toHaveCount(2);
      for (let i = 0; i < 2; i += 1) {
        await expectEdge(amenities.nth(i), "solid");
        expect(await maxRadius(amenities.nth(i))).toBeLessThanOrEqual(4);
      }

      expect(await mainSurfacesOutsideSystem(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `loaded-${vp.name}`);
    });

    test("loaded: price band is ink on ember inside a paper panel with an ink edge", async ({
      page,
    }) => {
      await mockListing(page, LISTING);
      await page.goto(`/listings/${LISTING_ID}`);
      await expect(page.getByText(PRICE).first()).toBeVisible();

      const info = await inspectBooking(page);
      expect(info).not.toBeNull();
      expect(info!.bandBg).toBe(EMBER_RGB);
      expect(info!.bandBorderBottomWidth).toBe("2px");
      expect(info!.bandBorderBottomStyle).toBe("solid");
      expect(info!.bandBorderBottomColor).toBe(INK_RGB);
      expect(info!.bandText).toContain("per night");
      expect(info!.colors.length).toBeGreaterThanOrEqual(2);
      expect(info!.colors.every((c) => c === INK_RGB)).toBe(true);
      expect(info!.controls).toBe(0);
      expect(info!.panelBorders).toEqual(["2px", "2px", "2px", "2px"]);
      expect(info!.panelBorderStyle).toBe("solid");
      expect(info!.panelBorderColor).toBe(INK_RGB);
      expect(info!.panelBg).toBe(PAPER_RGB);
      expect(info!.panelShadow).toBe("none");
      expect(info!.panelMaxRadius).toBeLessThanOrEqual(4);
    });

    test("no-photo listing: dashed stone placeholder with no radius and no overflow", async ({
      page,
    }, testInfo) => {
      await mockListing(page, { ...LISTING, photos: [] });
      await page.goto(`/listings/${LISTING_ID}`);
      await expect(page.locator("h1")).toHaveText(TITLE);

      const dashed = await dashedElements(page);
      expect(dashed).toHaveLength(1);
      expect(dashed[0]).toEqual({
        width: "2px",
        bg: STONE_RGB,
        color: INK_RGB,
        radius: "0px",
        text: "",
      });
      expect(await mainSurfacesOutsideSystem(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `no-photo-${vp.name}`);
    });

    test("not-found: one h1, no alert, no overflow", async ({ page }, testInfo) => {
      await mockListing(page, {}, 404);
      await page.goto(`/listings/${LISTING_ID}`);

      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText("Listing not found.");
      await expect(page.getByRole("alert")).toHaveCount(0);
      expectInsideViewport(page, await box(h1));
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `not-found-${vp.name}`);
    });

    test("error (500): one alert holding one h1 with a solid danger edge and tint", async ({
      page,
    }, testInfo) => {
      await mockListing(page, {}, 500);
      await page.goto(`/listings/${LISTING_ID}`);

      // The page retries a non-404 failure twice (1s and 2s back-off) before settling.
      const alert = page.getByRole("alert");
      await expect(alert).toHaveCount(1, { timeout: 15_000 });
      await expect(alert.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(alert.locator("h1")).toHaveText("Something went wrong. Please try again.");
      for (const side of ["top", "right", "bottom", "left"]) {
        await expect(alert).toHaveCSS(`border-${side}-width`, "2px");
        await expect(alert).toHaveCSS(`border-${side}-style`, "solid");
        await expect(alert).toHaveCSS(`border-${side}-color`, DANGER_RGB);
      }
      await expect(alert).toHaveCSS("background-color", DANGER_BG_RGB);
      expectInsideViewport(page, await box(alert));
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `error-${vp.name}`);
    });
  });
}

test.describe("Listing detail identity at desktop-1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("booking panel is sticky and stays below the nav while the page scrolls", async ({
    page,
  }) => {
    await mockListing(page, LISTING);
    await page.goto(`/listings/${LISTING_ID}`);
    await expect(page.getByText(PRICE).first()).toBeVisible();

    const info = await inspectBooking(page);
    expect(info, "ember price band is present").not.toBeNull();
    expect(info!.panelPosition).toBe("sticky");

    const nav = await box(page.locator("header").first());
    await page.evaluate(() => window.scrollTo(0, 500));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const top = await panelTop(page);
    expect(top).toBeGreaterThanOrEqual(nav.y + nav.height);
    expect(top).toBeLessThan(900);
  });
});

test.describe("Listing detail identity at mobile-360", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("booking panel is static and sits after the amenities and rating", async ({ page }) => {
    await mockListing(page, LISTING);
    await page.goto(`/listings/${LISTING_ID}`);
    await expect(page.getByText(PRICE).first()).toBeVisible();

    const info = await inspectBooking(page);
    expect(info, "ember price band is present").not.toBeNull();
    expect(info!.panelPosition).toBe("static");

    const rating = await box(
      page.getByRole("heading", { level: 2, name: "Rating" }).locator("xpath=.."),
    );
    const amenities = await box(
      page.getByRole("heading", { level: 2, name: "Amenities" }).locator("xpath=.."),
    );
    // All three boxes are read at the same scroll position, so viewport coordinates compare.
    const top = await panelTop(page);
    expect(top).toBeGreaterThanOrEqual(rating.y + rating.height);
    expect(top).toBeGreaterThanOrEqual(amenities.y + amenities.height);
  });

  test("very long strings do not overflow and the login action stays inside", async ({
    page,
  }, testInfo) => {
    await mockListing(page, LONG_LISTING);
    await page.goto(`/listings/${LISTING_ID}`);
    await expect(page.locator("h1")).toBeVisible();

    await expectNoHorizontalOverflow(page);
    expectInsideViewport(page, await box(page.locator("h1")));
    expectInsideViewport(page, await box(page.getByRole("link", { name: "Log in to book" })));
    await attachScreenshot(page, testInfo, "long-strings-mobile-360");
  });

  test("a guest's Book now action stays inside the viewport", async ({ page }) => {
    await mockSession(page, { email: "guest@test.com", roles: ["guest"] });
    await mockListing(page, LONG_LISTING);
    await page.goto(`/listings/${LISTING_ID}?checkIn=2099-07-10&checkOut=2099-07-12`);

    const action = page.getByRole("link", { name: "Book now" });
    expectInsideViewport(page, await box(action));
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("Listing detail keyboard focus", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("guest with valid dates tabs to Book now and sees the 3px ink ring", async ({ page }) => {
    await mockSession(page, { email: "guest@test.com", roles: ["guest"] });
    await mockListing(page, LISTING);
    await page.goto(`/listings/${LISTING_ID}?checkIn=2099-07-10&checkOut=2099-07-12`);
    await expect(page.getByRole("link", { name: "Book now" })).toBeVisible();

    await focusUntil(page, "Book now");
    const ring = await focusRing(page);
    expect(ring.style).toBe("solid");
    expect(ring.width).toBe("3px");
    expect(ring.color).toBe(INK_RGB);
    expect(ring.shadow).toContain(PAPER_RGB);
  });

  test("visitor tabs to Log in to book and sees the 3px ink ring", async ({ page }) => {
    await mockListing(page, LISTING);
    await page.goto(`/listings/${LISTING_ID}`);
    await expect(page.getByRole("link", { name: "Log in to book" })).toBeVisible();

    await focusUntil(page, "Log in to book");
    const ring = await focusRing(page);
    expect(ring.style).toBe("solid");
    expect(ring.width).toBe("3px");
    expect(ring.color).toBe(INK_RGB);
    expect(ring.shadow).toContain(PAPER_RGB);
  });
});
