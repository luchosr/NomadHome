import { test, expect } from "@playwright/test";
import type { Locator, Page, Route, TestInfo } from "@playwright/test";
import { mockSession } from "./helpers/auth";

// Identity checks for the booking and payment screens (NH-124, booking-payment-identity design.md
// D12). Same policy as layout.spec.ts and listing-detail-identity.spec.ts: computed styles and
// geometry are asserted, screenshots are attached as artifacts and never compared. Every API call
// is mocked through one catch-all route on the API origin (the page itself is reached with relative
// URLs, so the spec runs on any port).
//
// Selector assumptions (the pages have no test ids):
//  - summary panel = nearest ancestor-or-self of the listing title whose top border is 2px;
//  - photo = the only <img> whose alt is the listing title;
//  - total band = nearest ancestor-or-self of the "Total" label with the ember background;
//  - "text on the ember surface" = every non-empty text node in <main> whose nearest non-transparent
//    background is ember (so a paper foot inside the success panel is not part of it);
//  - success panel = nearest ancestor-or-self of the h1 with the ember background;
//  - waiting panel = the only role="status" element; error panel = the only role="alert" element;
//  - status tag = the element whose own text is exactly the status label;
//  - cards = main .rounded-card (the class the older e2e specs locate);
//  - dialog surface = the first element child of the role="dialog" element;
//  - stars = buttons named "1 star" to "5 stars", each holding an svg.

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

const PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#8a9a98"/></svg>`,
)}`;

const LISTING_ID = "listing-1";
const BOOKING_ID = "booking-1";
const TITLE = "Sunny Lisbon Apartment";
const FORM_URL = `/listings/${LISTING_ID}/book?checkIn=2026-08-01&checkOut=2026-08-04`;
const TOTAL = "$297.00";

const LISTING = {
  id: LISTING_ID,
  title: TITLE,
  type: "PROPERTY",
  city: "Lisbon",
  country: "PT",
  addressLine: "Rua Augusta 1, 1100-053 Lisboa",
  description: "A bright apartment.",
  capacity: 4,
  nightlyRateCents: 9000,
  currency: "USD",
  amenities: [],
  photos: [{ id: "p1", url: PHOTO, position: 0 }],
  _count: { reviews: 0 },
  avgRating: null,
};

const QUOTE = {
  nights: 3,
  nightlyRateCents: 9000,
  subtotalCents: 27000,
  guestServiceFeeBps: 1000,
  guestServiceFeeCents: 2700,
  totalChargedCents: 29700,
  currency: "USD",
};

const LONG_WORD = "Verylongunbrokenword".repeat(6);
const LONG_LISTING = {
  ...LISTING,
  title: `${LONG_WORD} ${LONG_WORD}`,
  city: LONG_WORD,
  nightlyRateCents: 99_999_999_999,
};
const LONG_QUOTE = {
  ...QUOTE,
  nightlyRateCents: 99_999_999_999,
  subtotalCents: 299_999_999_997,
  guestServiceFeeCents: 29_999_999_999,
  totalChargedCents: 329_999_999_996,
};

type Booking = {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  listing: { title: string };
  checkIn: string;
  checkOut: string;
  nightlyRateCents: number;
  totalCents: number;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  cancellationReason: string | null;
  createdAt: string;
};

function makeBooking(
  id: string,
  status: Booking["status"],
  title: string,
  checkIn = "2099-08-01",
  checkOut = "2099-08-04",
): Booking {
  return {
    id,
    listingId: LISTING_ID,
    guestId: "guest-1",
    hostId: "host-1",
    listing: { title },
    checkIn,
    checkOut,
    nightlyRateCents: 9000,
    totalCents: 27000,
    status,
    cancellationReason: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

const ONE_PER_STATUS: Booking[] = [
  makeBooking("b-pending", "PENDING_PAYMENT", "Pending Loft"),
  makeBooking("b-confirmed", "CONFIRMED", "Confirmed Loft"),
  makeBooking("b-cancelled", "CANCELLED", "Cancelled Loft"),
  makeBooking("b-completed", "COMPLETED", "Completed Loft", "2024-01-10", "2024-01-15"),
];

type Reply = "hang" | { status: number; body: unknown };
const ok = (body: unknown): Reply => ({ status: 200, body });
const fail = (status: number, body: unknown = { error: "SERVER_ERROR" }): Reply => ({
  status,
  body,
});

type Api = {
  listing?: Reply;
  quote?: Reply;
  create?: Reply;
  bookings?: Reply;
  booking?: Reply;
  cancel?: Reply;
  review?: Reply;
};

async function reply(route: Route, r: Reply) {
  if (r === "hang") return;
  await route.fulfill({
    status: r.status,
    contentType: "application/json",
    body: JSON.stringify(r.body),
  });
}

/** One catch-all route on the API origin; /auth/refresh falls back to mockSession's handler. */
async function mockApi(page: Page, api: Api = {}) {
  await page.route(`${API}/**`, (route) => {
    const method = route.request().method();
    const path = new URL(route.request().url()).pathname;
    if (path === "/auth/refresh") return route.fallback();
    if (path === `/listings/${LISTING_ID}`) return reply(route, api.listing ?? ok(LISTING));
    if (path === "/bookings/quote") return reply(route, api.quote ?? ok(QUOTE));
    if (path === "/bookings/me") {
      const bookings = api.bookings ?? ok([]);
      if (bookings === "hang" || bookings.status !== 200) return reply(route, bookings);
      const data = bookings.body as unknown[];
      return reply(route, ok({ data, total: data.length, page: 1, limit: 20 }));
    }
    if (method === "POST" && path === "/bookings") {
      return reply(route, api.create ?? { status: 201, body: { id: BOOKING_ID } });
    }
    if (path.endsWith("/sync-payment")) return reply(route, ok({}));
    if (path.endsWith("/cancel")) return reply(route, api.cancel ?? ok({}));
    if (path.endsWith("/review")) return reply(route, api.review ?? { status: 201, body: {} });
    if (method === "GET" && /^\/bookings\/[^/]+$/.test(path)) {
      return reply(route, api.booking ?? ok({ id: BOOKING_ID, status: "CONFIRMED" }));
    }
    return reply(route, fail(404, { error: "NOT_FOUND" }));
  });
}

async function guest(page: Page, api: Api = {}) {
  await mockSession(page, { email: "guest@test.com", roles: ["guest"] });
  await mockApi(page, api);
}

type Box = { x: number; y: number; width: number; height: number };

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

async function expectEdge(locator: Locator, style: string, color = INK_RGB) {
  for (const side of ["top", "right", "bottom", "left"]) {
    await expect(locator).toHaveCSS(`border-${side}-width`, "2px");
    await expect(locator).toHaveCSS(`border-${side}-style`, style);
    await expect(locator).toHaveCSS(`border-${side}-color`, color);
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

type BoxInfo = {
  bg: string;
  widths: string[];
  styles: string[];
  colors: string[];
  shadow: string;
  maxRadius: number;
  controls: number;
  text: string;
};

/**
 * Computed style of an element or of its nearest ancestor-or-self matching `mode`:
 * "self" = the element, "panel" = first with a 2px top border, "ember" = first with the ember background.
 * Returns null when no element matches (missing structure).
 */
async function boxInfo(
  locator: Locator,
  mode: "self" | "panel" | "ember",
): Promise<BoxInfo | null> {
  await expect(locator.first()).toBeVisible();
  return locator.first().evaluate(
    (start, args) => {
      let el: Element | null = start;
      while (el) {
        const cs = getComputedStyle(el);
        const hit =
          args.mode === "self" ||
          (args.mode === "panel" && cs.borderTopWidth === "2px" && cs.borderTopStyle !== "none") ||
          (args.mode === "ember" && cs.backgroundColor === args.ember);
        if (hit) {
          const sides = ["Top", "Right", "Bottom", "Left"] as const;
          const radii = [
            cs.borderTopLeftRadius,
            cs.borderTopRightRadius,
            cs.borderBottomRightRadius,
            cs.borderBottomLeftRadius,
          ].map((v) => (v.includes("%") ? 9999 : parseFloat(v)));
          return {
            bg: cs.backgroundColor,
            widths: sides.map((s) => cs.getPropertyValue(`border-${s.toLowerCase()}-width`)),
            styles: sides.map((s) => cs.getPropertyValue(`border-${s.toLowerCase()}-style`)),
            colors: sides.map((s) => cs.getPropertyValue(`border-${s.toLowerCase()}-color`)),
            shadow: cs.boxShadow,
            maxRadius: Math.max(...radii),
            controls: el.querySelectorAll("input, button, a, select, textarea").length,
            text: el.textContent ?? "",
          };
        }
        el = el.parentElement;
      }
      return null;
    },
    { mode, ember: EMBER_RGB },
  );
}

function expectInkEdgedPanel(info: BoxInfo | null, bg: string, style = "solid") {
  if (!info) throw new Error("missing structure: panel with a 2px border");
  expect(info.widths).toEqual(["2px", "2px", "2px", "2px"]);
  expect(info.styles).toEqual([style, style, style, style]);
  expect(info.colors).toEqual([INK_RGB, INK_RGB, INK_RGB, INK_RGB]);
  expect(info.bg).toBe(bg);
  expect(info.shadow).toBe("none");
  expect(info.maxRadius).toBeLessThanOrEqual(4);
}

/** Text colours of every text node in <main> whose nearest non-transparent background is ember. */
async function emberTexts(page: Page): Promise<{ text: string; color: string }[]> {
  return page.evaluate((ember) => {
    const out: { text: string; color: string }[] = [];
    const main = document.querySelector("main");
    if (!main) return out;
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const parent = n.parentElement;
      if (!n.textContent?.trim() || !parent) continue;
      let el: Element | null = parent;
      let bg = "rgba(0, 0, 0, 0)";
      while (el) {
        bg = getComputedStyle(el).backgroundColor;
        if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") break;
        el = el.parentElement;
      }
      if (bg === ember)
        out.push({ text: n.textContent.trim(), color: getComputedStyle(parent).color });
    }
    return out;
  }, EMBER_RGB);
}

async function expectInkOnEmber(page: Page, minNodes: number) {
  const texts = await emberTexts(page);
  expect(texts.length).toBeGreaterThanOrEqual(minNodes);
  expect(texts.filter((t) => t.color !== INK_RGB)).toEqual([]);
}

/** Box shadows and gradients anywhere inside <main> (focus rings are outlines, not shadows). */
async function shadowsAndGradients(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const offenders: string[] = [];
    for (const el of Array.from(document.querySelectorAll("main, main *"))) {
      const cs = getComputedStyle(el);
      const label = `${el.tagName.toLowerCase()}.${String(el.getAttribute("class") ?? "")}`;
      if (cs.boxShadow !== "none") offenders.push(`shadow ${label}`);
      if (cs.backgroundImage !== "none") offenders.push(`gradient/image ${label}`);
    }
    return offenders;
  });
}

async function expectDangerPanel(alert: Locator) {
  await expectEdge(alert, "solid", DANGER_RGB);
  await expect(alert).toHaveCSS("background-color", DANGER_BG_RGB);
}

async function focusUntil(page: Page, label: string): Promise<void> {
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab");
    const text = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    if (text === label) return;
  }
  throw new Error(`never focused "${label}"`);
}

/** The CTA is one focusable element: Tab lands on it once, the next Tab leaves it. */
async function expectSingleTabStop(page: Page, label: string) {
  const link = page.getByRole("link", { name: label });
  expect(await link.evaluate((el) => el.tagName)).toBe("A");
  expect(await link.locator("button").count()).toBe(0);
  expect(await link.locator("a, button, input, select, textarea, [tabindex]").count()).toBe(0);
  await focusUntil(page, label);
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("A");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).not.toBe(label);
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe(label);
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).not.toBe(label);
  await page.keyboard.press("Tab");
}

async function expectInkFocusRing(page: Page) {
  const ring = await page.evaluate(() => {
    const cs = getComputedStyle(document.activeElement as Element);
    return {
      width: cs.outlineWidth,
      style: cs.outlineStyle,
      color: cs.outlineColor,
      shadow: cs.boxShadow,
    };
  });
  expect(ring.style).toBe("solid");
  expect(ring.width).toBe("3px");
  expect(ring.color).toBe(INK_RGB);
  expect(ring.shadow).toContain(PAPER_RGB);
}

async function expectLinkHeightAtLeast44(link: Locator) {
  expect(await link.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
}

async function openCancelDialog(page: Page) {
  await page.goto("/bookings");
  const card = page.locator("main .rounded-card", { hasText: "Confirmed Loft" });
  await card.getByRole("button", { name: /^cancel$/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

async function openReviewDialog(page: Page) {
  await page.goto("/bookings");
  const card = page.locator("main .rounded-card", { hasText: "Completed Loft" });
  await card.getByRole("button", { name: /leave a review/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

for (const vp of VIEWPORTS) {
  test.describe(`Booking form identity at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("loaded: ink-edged flat summary panel, framed photo, plain dates and fee, one h1", async ({
      page,
    }, testInfo) => {
      await guest(page);
      await page.goto(FORM_URL);
      await expect(page.getByText(TITLE, { exact: true })).toBeVisible();
      await expect(page.getByText(TOTAL).first()).toBeVisible();

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText("Confirm your booking");
      expect(await page.locator("h1").evaluate((el) => getComputedStyle(el).fontFamily)).toContain(
        "Overpass",
      );

      const panel = await boxInfo(page.getByText(TITLE, { exact: true }), "panel");
      expectInkEdgedPanel(panel, PAPER_RGB);

      const photo = page.getByAltText(TITLE);
      await expect(photo).toHaveCount(1);
      await expectEdge(photo, "solid");
      await expectNoRadius(photo);

      await expect(page.getByText("Aug 1, 2026", { exact: true })).toBeVisible();
      await expect(page.getByText("Aug 4, 2026", { exact: true })).toBeVisible();
      await expect(page.getByText("2026-08-01", { exact: true })).toHaveCount(0);
      await expect(page.getByText(/service fee/i)).toBeVisible();

      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `form-loaded-${vp.name}`);
    });

    test("loaded: total band is ink on ember with no control inside and Pay now outside", async ({
      page,
    }) => {
      await guest(page);
      await page.goto(FORM_URL);
      await expect(page.getByText(TOTAL).first()).toBeVisible();

      const label = page.getByText(/^total$/i);
      await expect(label).toHaveCount(1);
      const band = await boxInfo(label, "ember");
      if (!band) throw new Error("missing structure: ember total band");
      expect(band.bg).toBe(EMBER_RGB);
      expect(band.text).toContain("Total");
      expect(band.text).toContain(TOTAL);
      expect(band.controls).toBe(0);
      const rule = await label.evaluate((el, ember) => {
        let node: Element | null = el;
        while (node && getComputedStyle(node).backgroundColor !== ember) node = node.parentElement;
        if (!node) return [];
        const cs = getComputedStyle(node);
        return [
          [cs.borderTopWidth, cs.borderTopStyle, cs.borderTopColor],
          [cs.borderBottomWidth, cs.borderBottomStyle, cs.borderBottomColor],
        ];
      }, EMBER_RGB);
      expect(rule).toContainEqual(["2px", "solid", INK_RGB]);

      await expectInkOnEmber(page, 2);

      const pay = page.getByRole("button", { name: /pay now/i });
      expect(await pay.evaluate((el) => el.closest("a") !== null)).toBe(false);
      const payInsideBand = await pay.evaluate((el, ember) => {
        for (let n: Element | null = el; n; n = n.parentElement) {
          if (getComputedStyle(n).backgroundColor === ember) return true;
        }
        return false;
      }, EMBER_RGB);
      expect(payInsideBand).toBe(false);
      expectInsideViewport(page, await box(pay));
    });

    test("loaded: the back action is one link with no button inside", async ({ page }) => {
      await guest(page);
      await page.goto(FORM_URL);
      const back = page.getByRole("link", { name: "Back to listing" });
      await expect(back).toHaveCount(1);
      await expect(back).toHaveAttribute("href", `/listings/${LISTING_ID}`);
      expect(await back.locator("button").count()).toBe(0);
      expectInsideViewport(page, await box(back));
      await expectLinkHeightAtLeast44(back);
    });

    test("no dates: one h1 in a solid ink-edged paper panel, a single back link, no alert", async ({
      page,
    }, testInfo) => {
      await guest(page);
      await page.goto(`/listings/${LISTING_ID}/book`);

      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText("Select check-in and check-out dates to book.");
      expectInkEdgedPanel(await boxInfo(h1, "panel"), PAPER_RGB);
      await expect(page.getByRole("alert")).toHaveCount(0);
      const back = page.getByRole("link", { name: "Back to listing" });
      await expect(back).toHaveCount(1);
      expect(await back.locator("button").count()).toBe(0);
      expectInsideViewport(page, await box(back));
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `form-no-dates-${vp.name}`);
    });

    test("loading: a busy flat skeleton with no h1, no shadow and no gradient", async ({
      page,
    }, testInfo) => {
      await guest(page, { listing: "hang", quote: "hang" });
      await page.goto(FORM_URL);

      const busy = page.locator('main [aria-busy="true"]');
      await expect(busy).toHaveCount(1);
      await expect(page.locator("h1")).toHaveCount(0);
      expect(await shadowsAndGradients(page)).toEqual([]);
      const radii = await busy.evaluate((el) =>
        [el, ...Array.from(el.querySelectorAll("*"))].map((n) => {
          const cs = getComputedStyle(n);
          return Math.max(
            ...[
              cs.borderTopLeftRadius,
              cs.borderTopRightRadius,
              cs.borderBottomRightRadius,
              cs.borderBottomLeftRadius,
            ].map((v) => (v.includes("%") ? 9999 : parseFloat(v))),
          );
        }),
      );
      expect(Math.max(...radii)).toBeLessThanOrEqual(2);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `form-loading-${vp.name}`);
    });

    test("listing not found: one alert holding one h1 with a solid danger edge and tint", async ({
      page,
    }, testInfo) => {
      await guest(page, { listing: fail(404, { error: "NOT_FOUND" }) });
      await page.goto(FORM_URL);

      const alert = page.getByRole("alert");
      await expect(alert).toHaveCount(1);
      await expect(alert.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(alert.locator("h1")).toHaveText("Listing not found.");
      await expectDangerPanel(alert);
      expect(await alert.locator('[aria-hidden="true"]').count()).toBeGreaterThan(0);
      expectInsideViewport(page, await box(alert));
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `form-404-${vp.name}`);
    });

    test("quote error: one alert holding one h1 with the generic text and a danger edge", async ({
      page,
    }, testInfo) => {
      await guest(page, { quote: fail(404, { error: "NOT_FOUND" }) });
      await page.goto(FORM_URL);

      const alert = page.getByRole("alert");
      await expect(alert).toHaveCount(1);
      await expect(alert.locator("h1")).toHaveCount(1);
      await expect(alert.locator("h1")).toHaveText("Something went wrong. Please try again.");
      await expectDangerPanel(alert);
      expect(await alert.locator('[aria-hidden="true"]').count()).toBeGreaterThan(0);
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `form-quote-error-${vp.name}`);
    });

    test("server error: one shared alert with the message, a danger edge and no shadow", async ({
      page,
    }, testInfo) => {
      await guest(page, {
        create: fail(409, {
          error: "OVERLAP_CONFLICT",
          message: "These dates are no longer available.",
        }),
      });
      await page.goto(FORM_URL);
      await expect(page.getByText(TOTAL).first()).toBeVisible();
      await page.getByRole("button", { name: /pay now/i }).click();

      const alert = page.getByRole("alert");
      await expect(alert).toHaveCount(1);
      await expect(alert).toContainText("These dates are no longer available.");
      await expectDangerPanel(alert);
      expect(await alert.locator('[aria-hidden="true"]').count()).toBeGreaterThan(0);
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `form-server-error-${vp.name}`);
    });
  });

  test.describe(`Booking success and cancel identity at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("success: ember panel with a 2px ink edge, every text node on ember is ink, one h1", async ({
      page,
    }, testInfo) => {
      await guest(page);
      await page.goto(`/booking/success?bookingId=${BOOKING_ID}`);

      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText("Booking confirmed!");
      const panel = await boxInfo(h1, "ember");
      expectInkEdgedPanel(panel, EMBER_RGB);
      await expectInkOnEmber(page, 3);
      await expect(page.getByText(`#${BOOKING_ID}`, { exact: true })).toHaveCount(1);

      const link = page.getByRole("link", { name: "View my bookings" });
      await expect(link).toHaveAttribute("href", "/bookings");
      expect(await link.locator("button").count()).toBe(0);
      expectInsideViewport(page, await box(link));
      await expectLinkHeightAtLeast44(link);
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `success-${vp.name}`);
    });

    test("success without a booking id: a neutral not-found panel, no ember, no confirmation", async ({
      page,
    }, testInfo) => {
      await guest(page);
      await page.goto("/booking/success");

      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText("We could not find your booking");
      await expect(page.getByText("Booking confirmed!")).toHaveCount(0);
      await expect(page.getByRole("status")).toContainText(
        "Open My bookings to see your reservations.",
      );
      expectInkEdgedPanel(await boxInfo(h1, "panel"), STONE_RGB);
      expect(await emberTexts(page)).toEqual([]);
      const link = page.getByRole("link", { name: "View my bookings" });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", "/bookings");
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `success-no-booking-id-${vp.name}`);
    });

    test("success that never confirms: a neutral Still processing panel after the timeout", async ({
      page,
    }, testInfo) => {
      await page.clock.install();
      await guest(page, { booking: ok({ id: BOOKING_ID, status: "PENDING_PAYMENT" }) });
      await page.goto(`/booking/success?bookingId=${BOOKING_ID}`);
      await expect(page.getByRole("status")).toContainText("Processing your payment");

      for (let i = 0; i < 20 && (await page.locator("h1").count()) === 0; i++) {
        await page.clock.runFor(2000);
        await page.waitForTimeout(50);
      }

      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText("Still processing");
      await expect(page.getByText("Booking confirmed!")).toHaveCount(0);
      expectInkEdgedPanel(await boxInfo(h1, "panel"), STONE_RGB);
      expect(await emberTexts(page)).toEqual([]);
      const link = page.getByRole("link", { name: "View my bookings" });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", "/bookings");
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `success-still-processing-${vp.name}`);
    });

    test("waiting: a dashed 2px ink stone status panel, busy, with a flat skeleton", async ({
      page,
    }, testInfo) => {
      await guest(page, { booking: ok({ id: BOOKING_ID, status: "PENDING_PAYMENT" }) });
      await page.goto(`/booking/success?bookingId=${BOOKING_ID}`);

      const status = page.getByRole("status");
      await expect(status).toHaveCount(1);
      await expect(status).toHaveAttribute("aria-busy", "true");
      await expect(status).toContainText("Processing your payment");
      await expectEdge(status, "dashed");
      await expect(status).toHaveCSS("background-color", STONE_RGB);
      await expect(page.locator("h1")).toHaveCount(0);
      const barRadii = await status.evaluate((el) =>
        Array.from(el.querySelectorAll(".animate-pulse")).map((n) =>
          parseFloat(getComputedStyle(n).borderTopLeftRadius),
        ),
      );
      expect(barRadii.length).toBeGreaterThan(0);
      expect(Math.max(...barRadii)).toBeLessThanOrEqual(2);
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `waiting-${vp.name}`);
    });

    test("cancel: a paper panel with no ember descendant and one link action", async ({
      page,
    }, testInfo) => {
      await page.goto(`/booking/cancel?listingId=${LISTING_ID}`);

      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText("Payment cancelled");
      expectInkEdgedPanel(await boxInfo(h1, "panel"), PAPER_RGB);
      expect(await emberTexts(page)).toEqual([]);
      const emberBackgrounds = await page.evaluate(
        (ember) =>
          Array.from(document.querySelectorAll("main *")).filter(
            (el) => getComputedStyle(el).backgroundColor === ember,
          ).length,
        EMBER_RGB,
      );
      expect(emberBackgrounds).toBe(0);

      const link = page.getByRole("link", { name: "Back to listing" });
      await expect(link).toHaveAttribute("href", `/listings/${LISTING_ID}`);
      expect(await link.locator("button").count()).toBe(0);
      expectInsideViewport(page, await box(link));
      await expectLinkHeightAtLeast44(link);
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `cancel-${vp.name}`);
    });

    test("cancel without a listing: one link to search", async ({ page }) => {
      await page.goto("/booking/cancel");
      const link = page.getByRole("link", { name: "Back to search" });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", "/search");
      expect(await link.locator("button").count()).toBe(0);
      expectInsideViewport(page, await box(link));
    });
  });

  test.describe(`My bookings identity at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("cards keep .rounded-card with a 2px ink edge and no shadow", async ({
      page,
    }, testInfo) => {
      await guest(page, { bookings: ok(ONE_PER_STATUS) });
      await page.goto("/bookings");

      const cards = page.locator("main .rounded-card");
      await expect(cards).toHaveCount(4);
      for (let i = 0; i < 4; i += 1) {
        await expectEdge(cards.nth(i), "solid");
        await expect(cards.nth(i)).toHaveCSS("box-shadow", "none");
        expect(await maxRadius(cards.nth(i))).toBeLessThanOrEqual(4);
      }
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `bookings-${vp.name}`);
    });

    test("status tags: dashed pending, solid others, struck cancelled, no pill", async ({
      page,
    }) => {
      await guest(page, { bookings: ok(ONE_PER_STATUS) });
      await page.goto("/bookings");

      const pending = page.getByText("Pending Payment", { exact: true });
      const confirmed = page.getByText("Confirmed", { exact: true });
      const cancelled = page.getByText("Cancelled", { exact: true });
      const completed = page.getByText("Completed", { exact: true });
      for (const tag of [pending, confirmed, cancelled, completed]) {
        await expect(tag).toHaveCount(1);
        expect(await maxRadius(tag)).toBeLessThanOrEqual(4);
        await expect(tag).toHaveCSS("border-top-width", "2px");
      }
      await expect(pending).toHaveCSS("border-top-style", "dashed");
      for (const tag of [confirmed, cancelled, completed]) {
        await expect(tag).toHaveCSS("border-top-style", "solid");
      }
      await expect(cancelled).toHaveCSS("text-decoration-line", "line-through");
      for (const tag of [pending, confirmed, completed]) {
        await expect(tag).not.toHaveCSS("text-decoration-line", "line-through");
      }
    });

    test("the cancellable booking exposes exactly one cancel button inside the viewport", async ({
      page,
    }) => {
      await guest(page, { bookings: ok(ONE_PER_STATUS) });
      await page.goto("/bookings");
      const cancel = page.getByRole("button", { name: /cancel/i });
      await expect(cancel).toHaveCount(1);
      expectInsideViewport(page, await box(cancel));
    });

    test("empty: a dashed 2px ink panel with the message and the link to search", async ({
      page,
    }, testInfo) => {
      await guest(page, { bookings: ok([]) });
      await page.goto("/bookings");

      const message = page.getByText("You have no bookings yet.");
      await expect(message).toBeVisible();
      const panel = await boxInfo(message, "panel");
      expectInkEdgedPanel(panel, PAPER_RGB, "dashed");
      const link = page.getByRole("link", { name: "Browse listings" });
      await expect(link).toHaveAttribute("href", "/search");
      expectInsideViewport(page, await box(link));
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `bookings-empty-${vp.name}`);
    });

    test("loading: a busy skeleton with no pill block, no shadow and no gradient", async ({
      page,
    }, testInfo) => {
      await guest(page, { bookings: "hang" });
      await page.goto("/bookings");

      const busy = page.locator('main [aria-busy="true"]');
      await expect(busy).toHaveCount(1);
      const radii = await busy.evaluate((el) =>
        Array.from(el.querySelectorAll("*")).map((n) => {
          const cs = getComputedStyle(n);
          return Math.max(
            ...[
              cs.borderTopLeftRadius,
              cs.borderTopRightRadius,
              cs.borderBottomRightRadius,
              cs.borderBottomLeftRadius,
            ].map((v) => (v.includes("%") ? 9999 : parseFloat(v))),
          );
        }),
      );
      expect(Math.max(...radii)).toBeLessThanOrEqual(4);
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `bookings-loading-${vp.name}`);
    });

    test("failure: one alert with a solid danger edge, tint fill and the generic text", async ({
      page,
    }, testInfo) => {
      await guest(page, { bookings: fail(500) });
      await page.goto("/bookings");

      // The query client retries a failed request three times (1s, 2s, 4s) before settling.
      const alert = page.getByRole("alert");
      await expect(alert).toHaveCount(1, { timeout: 20_000 });
      await expect(alert).toContainText("Something went wrong. Please try again.");
      await expectDangerPanel(alert);
      expect(await alert.locator('[aria-hidden="true"]').count()).toBeGreaterThan(0);
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `bookings-error-${vp.name}`);
    });
  });

  test.describe(`Booking dialogs identity at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("cancel dialog: 2px ink flat surface, 2px textarea, one danger alert on failure", async ({
      page,
    }, testInfo) => {
      await guest(page, {
        bookings: ok(ONE_PER_STATUS),
        cancel: fail(422, { error: "NOT_CANCELLABLE", message: "Past the cancellation window." }),
      });
      await openCancelDialog(page);

      const dialog = page.getByRole("dialog");
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      const surface = dialog.locator(":scope > *").first();
      await expectEdge(surface, "solid");
      await expect(surface).toHaveCSS("box-shadow", "none");
      expect(await maxRadius(surface)).toBeLessThanOrEqual(4);
      await expect(dialog).toHaveCSS("backdrop-filter", "none");
      await expectEdge(dialog.getByRole("textbox"), "solid");
      await expect(page.getByText("Reason (optional)")).toHaveCSS("font-weight", "700");

      await page.getByRole("button", { name: /yes, cancel/i }).click();
      const alert = page.getByRole("alert");
      await expect(alert).toHaveCount(1);
      await expect(alert).toContainText("Past the cancellation window.");
      await expectDangerPanel(alert);
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      expectInsideViewport(page, await box(page.getByRole("button", { name: /yes, cancel/i })));
      await attachScreenshot(page, testInfo, `cancel-dialog-${vp.name}`);
    });

    test("review dialog: drawn svg stars named 1 to 5 stars, 2px textarea, flat surface", async ({
      page,
    }, testInfo) => {
      await guest(page, { bookings: ok(ONE_PER_STATUS) });
      await openReviewDialog(page);

      const dialog = page.getByRole("dialog");
      const surface = dialog.locator(":scope > *").first();
      await expectEdge(surface, "solid");
      await expect(surface).toHaveCSS("box-shadow", "none");
      await expectEdge(dialog.getByRole("textbox"), "solid");

      const names = ["1 star", "2 stars", "3 stars", "4 stars", "5 stars"];
      for (const name of names) {
        const star = dialog.getByRole("button", { name, exact: true });
        await expect(star).toHaveCount(1);
        await expect(star.locator("svg")).toHaveCount(1);
        const box44 = await box(star);
        expect(box44.width).toBeGreaterThanOrEqual(44);
        expect(box44.height).toBeGreaterThanOrEqual(44);
      }
      expect(await dialog.evaluate((el) => /[★☆]/.test(el.textContent ?? ""))).toBe(false);

      await dialog.getByRole("button", { name: "4 stars", exact: true }).click();
      await expect(dialog.getByRole("button", { name: "4 stars", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `review-dialog-${vp.name}`);
    });

    test("review success: a flat 2px ink panel shows the existing text", async ({
      page,
    }, testInfo) => {
      await guest(page, { bookings: ok(ONE_PER_STATUS) });
      await openReviewDialog(page);
      await page.getByRole("button", { name: "5 stars", exact: true }).click();
      await page.getByRole("button", { name: /submit review/i }).click();

      const text = page.getByText("Review submitted!");
      await expect(text).toBeVisible();
      expectInkEdgedPanel(await boxInfo(text, "panel"), PAPER_RGB);
      await attachScreenshot(page, testInfo, `review-success-${vp.name}`);
    });
  });
}

test.describe("Booking screens at mobile-360: long strings and every state", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("form with a long title, city and currency amount does not overflow", async ({
    page,
  }, testInfo) => {
    await guest(page, { listing: ok(LONG_LISTING), quote: ok(LONG_QUOTE) });
    await page.goto(FORM_URL);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText(/^total$/i)).toBeVisible();

    await expectNoHorizontalOverflow(page);
    expectInsideViewport(page, await box(page.getByRole("button", { name: /pay now/i })));
    expectInsideViewport(page, await box(page.getByRole("link", { name: "Back to listing" })));
    await attachScreenshot(page, testInfo, "form-long-strings-mobile-360");
  });

  test("success with a long booking id does not overflow", async ({ page }) => {
    const longId = `${LONG_WORD}${LONG_WORD}`;
    await guest(page, { booking: ok({ id: longId, status: "CONFIRMED" }) });
    await page.goto(`/booking/success?bookingId=${longId}`);
    await expect(page.locator("h1")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expectInsideViewport(page, await box(page.getByRole("link", { name: "View my bookings" })));
  });

  test("cancel with a long listing id does not overflow", async ({ page }) => {
    await page.goto(`/booking/cancel?listingId=${LONG_WORD}${LONG_WORD}`);
    await expect(page.locator("h1")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expectInsideViewport(page, await box(page.getByRole("link", { name: "Back to listing" })));
  });

  test("my bookings with a long title and ten cards does not overflow", async ({
    page,
  }, testInfo) => {
    const many = [
      makeBooking("long-1", "CONFIRMED", `${LONG_WORD} ${LONG_WORD}`),
      ...Array.from({ length: 9 }, (_, i) =>
        makeBooking(`many-${i}`, i % 2 === 0 ? "PENDING_PAYMENT" : "COMPLETED", `Loft number ${i}`),
      ),
    ];
    await guest(page, { bookings: ok(many) });
    await page.goto("/bookings");
    await expect(page.locator("main .rounded-card")).toHaveCount(10);
    await expectNoHorizontalOverflow(page);
    for (const button of await page.getByRole("button").all()) {
      expectInsideViewport(page, await box(button));
    }
    await attachScreenshot(page, testInfo, "bookings-ten-cards-mobile-360");
  });

  test("cancel dialog with a long typed reason and a long server error does not overflow", async ({
    page,
  }) => {
    await guest(page, {
      bookings: ok(ONE_PER_STATUS),
      cancel: fail(422, { error: "X", message: `${LONG_WORD}${LONG_WORD}` }),
    });
    await openCancelDialog(page);
    await page.getByRole("textbox").fill(`${LONG_WORD}${LONG_WORD}`);
    await page.getByRole("button", { name: /yes, cancel/i }).click();
    await expect(page.getByRole("alert")).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
    expectInsideViewport(page, await box(page.getByRole("button", { name: /yes, cancel/i })));
    expectInsideViewport(page, await box(page.getByRole("button", { name: "Close" })));
  });

  test("review dialog with a long server error does not overflow", async ({ page }) => {
    await guest(page, {
      bookings: ok(ONE_PER_STATUS),
      review: fail(422, { error: "X", message: `${LONG_WORD}${LONG_WORD}` }),
    });
    await openReviewDialog(page);
    await page.getByRole("button", { name: "3 stars", exact: true }).click();
    await page.getByRole("button", { name: /submit review/i }).click();
    await expect(page.getByRole("alert")).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
    expectInsideViewport(page, await box(page.getByRole("button", { name: /submit review/i })));
  });
});

test.describe("Booking screens keyboard focus", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("form: Tab reaches Pay now, then the back link, one stop each, with the 3px ink ring", async ({
    page,
  }) => {
    await guest(page);
    await page.goto(FORM_URL);
    await expect(page.getByRole("button", { name: /pay now/i })).toBeEnabled();

    await focusUntil(page, "Pay now");
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BUTTON");
    await expectInkFocusRing(page);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe(
      "Back to listing",
    );
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("A");
    await expectInkFocusRing(page);
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await expectSingleTabStop(page, "Back to listing");
  });

  test("success: View my bookings is one tab stop with the 3px ink ring", async ({ page }) => {
    await guest(page);
    await page.goto(`/booking/success?bookingId=${BOOKING_ID}`);
    await expect(page.getByRole("link", { name: "View my bookings" })).toBeVisible();

    await expectSingleTabStop(page, "View my bookings");
    await expectInkFocusRing(page);
  });

  test("cancel: the back-to-listing link is one tab stop with the 3px ink ring", async ({
    page,
  }) => {
    await page.goto(`/booking/cancel?listingId=${LISTING_ID}`);
    await expect(page.getByRole("link", { name: "Back to listing" })).toBeVisible();

    await expectSingleTabStop(page, "Back to listing");
    await expectInkFocusRing(page);
  });

  test("cancel without a listing: the back-to-search link is one tab stop", async ({ page }) => {
    await page.goto("/booking/cancel");
    await expect(page.getByRole("link", { name: "Back to search" })).toBeVisible();

    await expectSingleTabStop(page, "Back to search");
    await expectInkFocusRing(page);
  });
});
