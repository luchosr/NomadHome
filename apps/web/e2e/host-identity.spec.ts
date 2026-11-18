import { test, expect } from "@playwright/test";
import type { Locator, Page, Route, TestInfo } from "@playwright/test";
import { mockSession } from "./helpers/auth";

// Identity checks for the host screens (NH-122, host-identity design.md D16). Same policy as
// booking-payment-identity.spec.ts: computed styles and geometry are asserted, screenshots are
// attached as artifacts and never compared. Every API call is mocked through one catch-all route on
// the API origin; the pages are reached with relative URLs, so the spec runs on any port (no
// hard-coded dev server port). Routes come from apps/web/src/router.tsx.
//
// Selector assumptions (the pages have no test ids):
//  - listing row = main .rounded-card containing the listing title (the class older specs locate);
//  - thumbnail = parent of the listing img, or parent of the first aria-hidden svg in the row;
//  - listing status tag and booking status tag = the element whose own text is exactly the label;
//  - bookings table wrapper = the parent of the only table; head row = "thead tr";
//  - checkbox label box = the checkbox's closest label (amenities) or parent row (terms);
//  - invalid field = the Create title input made invalid; its error = the element with id "title-error";
//  - error panel = the only role="alert" element; tile = its [aria-hidden="true"] descendant;
//  - photo = img named "Photo N"; availability row = the only "main li".

const API = "http://localhost:3000";
const INK_RGB = "rgb(30, 30, 30)";
const PAPER_RGB = "rgb(247, 245, 242)";
const DANGER_RGB = "rgb(155, 28, 46)";
const DANGER_BG_RGB = "rgb(248, 225, 224)";
const EMBER_RGB = "rgb(230, 95, 53)";

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-360", width: 360, height: 800 },
] as const;

const PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#8a9a98"/></svg>`,
)}`;

const LONG_WORD = "Verylongunbrokenword".repeat(6);

type ListingStatus = "DRAFT" | "PUBLISHED" | "DISABLED";

function makeListing(
  id: string,
  title: string,
  status: ListingStatus,
  over: Record<string, unknown> = {},
) {
  return {
    id,
    title,
    description: "A great space for digital nomads",
    type: "PROPERTY",
    city: "Lisbon",
    country: "PT",
    addressLine: "Rua do Ouro 123",
    capacity: 4,
    nightlyRateCents: 7500,
    currency: "EUR",
    status,
    amenities: [{ amenityCode: "wifi" }],
    primaryPhotoUrl: null,
    _count: { bookings: 0 },
    ...over,
  };
}

const PUBLISHED = makeListing("l-pub", "Published Cabin", "PUBLISHED", {
  primaryPhotoUrl: PHOTO,
  _count: { bookings: 2 },
});
const DRAFT = makeListing("l-draft", "Draft Flat", "DRAFT");
const DISABLED = makeListing("l-dis", "Disabled Desk", "DISABLED", { type: "WORKSPACE" });
const ONE_PER_STATUS = [PUBLISHED, DRAFT, DISABLED];

const EDIT_ID = "l-edit";
const EDIT_LISTING = makeListing(EDIT_ID, "My Space", "DRAFT");
const PHOTOS = [
  { id: "ph1", url: PHOTO, position: 0 },
  { id: "ph2", url: PHOTO, position: 1 },
];
const BLOCKS = [{ id: "k1", startDate: "2099-03-01", endDate: "2099-03-05" }];

function makeBooking(id: string, status: string, title: string, email = "guest@test.com") {
  return {
    id,
    listing: { title },
    guest: { email },
    checkIn: "2027-08-01",
    checkOut: "2027-08-04",
    status,
    totalCents: 30000,
    currency: "USD",
  };
}

const BOOKINGS = [
  makeBooking("b-p", "PENDING_PAYMENT", "Pending Loft"),
  makeBooking("b-c", "CONFIRMED", "Confirmed Loft"),
  makeBooking("b-x", "CANCELLED", "Cancelled Loft"),
  makeBooking("b-d", "COMPLETED", "Completed Loft"),
];

type Reply = "hang" | { status: number; body: unknown };
const ok = (body: unknown): Reply => ({ status: 200, body });
const fail = (status: number, body: unknown = { error: "SERVER_ERROR" }): Reply => ({
  status,
  body,
});

type Api = {
  listings?: Reply;
  listing?: Reply;
  photos?: Reply;
  availability?: Reply;
  bookings?: Reply;
  publish?: Reply;
  becomeHost?: Reply;
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
    if (path === "/listings/mine") return reply(route, api.listings ?? ok(ONE_PER_STATUS));
    if (path === `/listings/${EDIT_ID}/manage`)
      return reply(route, api.listing ?? ok(EDIT_LISTING));
    if (path === `/listings/${EDIT_ID}/photos`) return reply(route, api.photos ?? ok([]));
    if (path === `/listings/${EDIT_ID}/availability`)
      return reply(route, api.availability ?? ok([]));
    if (method === "PATCH" && path === `/listings/${EDIT_ID}/publish`) {
      return reply(route, api.publish ?? ok({ ...EDIT_LISTING, status: "PUBLISHED" }));
    }
    if (path === "/bookings/host-all") return reply(route, api.bookings ?? ok(BOOKINGS));
    if (path === "/users/me/become-host") {
      return reply(route, api.becomeHost ?? ok({ accessToken: "t", roles: ["guest", "host"] }));
    }
    return reply(route, fail(404, { error: "NOT_FOUND" }));
  });
}

async function host(page: Page, api: Api = {}) {
  await mockSession(page, { email: "host@test.com", roles: ["guest", "host"] });
  await mockApi(page, api);
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
  return locator.first().evaluate((el) => {
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

async function emberBackgrounds(page: Page): Promise<number> {
  return page.evaluate(
    (ember) =>
      Array.from(document.querySelectorAll("main, main *")).filter(
        (el) => getComputedStyle(el).backgroundColor === ember,
      ).length,
    EMBER_RGB,
  );
}

async function expectDangerPanel(alert: Locator) {
  await expectEdge(alert, "solid", DANGER_RGB);
  await expect(alert).toHaveCSS("background-color", DANGER_BG_RGB);
}

async function expectErrorPanelWithH1(page: Page, text: string) {
  const alert = page.getByRole("alert");
  await expect(alert).toHaveCount(1, { timeout: 20_000 });
  await expect(alert.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(alert.locator("h1")).toHaveText(text);
  await expectDangerPanel(alert);
  expect(await alert.locator('[aria-hidden="true"]').count()).toBeGreaterThan(0);
  return alert;
}

async function expectBusyFlat(page: Page) {
  const busy = page.locator('main [aria-busy="true"]');
  await expect(busy).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(0);
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
  expect(await shadowsAndGradients(page)).toEqual([]);
}

/** Tab until the focused element matches the CSS selector (and the text, when given). */
async function focusUntil(page: Page, selector: string, text?: string): Promise<void> {
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press("Tab");
    const hit = await page.evaluate(
      ([sel, label]) => {
        const el = document.activeElement;
        return !!el && el.matches(sel) && (!label || el.textContent?.trim() === label);
      },
      [selector, text ?? ""] as const,
    );
    if (hit) return;
  }
  throw new Error(`never focused ${selector} ${text ?? ""}`);
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

async function expectHeightAtLeast44(locator: Locator) {
  const b = await box(locator);
  expect(b.height).toBeGreaterThanOrEqual(44);
}

function rowOf(page: Page, title: string): Locator {
  return page.locator("main .rounded-card", { hasText: title });
}

function thumbOf(row: Locator): Locator {
  return row.locator("img, svg[aria-hidden='true']").first().locator("xpath=..");
}

async function fillCreateValid(page: Page) {
  await page.getByLabel(/^title$/i).fill("My Lovely Space");
  await page.getByLabel(/^description$/i).fill("A wonderful place for digital nomads to work");
  await page.locator("#city").fill("Lisbon");
  await page.getByLabel(/^country/i).selectOption("PT");
  await page.getByLabel(/^address/i).fill("Rua do Ouro 123");
  await page.locator("#capacity").fill("4");
  await page.getByLabel(/^nightly rate/i).fill("75");
}

for (const vp of VIEWPORTS) {
  test.describe(`Host listings identity at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("rows keep .rounded-card with a 2px ink edge, no shadow, and the confirmed count is bold", async ({
      page,
    }, testInfo) => {
      await host(page);
      await page.goto("/host/listings");
      await expect(page.getByText("Published Cabin")).toBeVisible();

      const rows = page.locator("main .rounded-card");
      await expect(rows).toHaveCount(3);
      for (let i = 0; i < 3; i += 1) {
        await expectEdge(rows.nth(i), "solid");
        await expect(rows.nth(i)).toHaveCSS("box-shadow", "none");
        expect(await maxRadius(rows.nth(i))).toBeLessThanOrEqual(4);
      }
      await expect(page.getByText("2 confirmed bookings")).toHaveCSS("font-weight", "700");
      expect(await shadowsAndGradients(page)).toEqual([]);
      expect(await emberBackgrounds(page)).toBe(0);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `listings-${vp.name}`);
    });

    test("thumbnails are 64px ink-framed squares with no radius, photo or pictogram tile", async ({
      page,
    }) => {
      await host(page);
      await page.goto("/host/listings");
      await expect(page.getByText("Published Cabin")).toBeVisible();

      const photoThumb = thumbOf(rowOf(page, "Published Cabin"));
      await expect(page.getByAltText("Published Cabin")).toHaveCount(1);
      for (const title of ["Published Cabin", "Draft Flat", "Disabled Desk"]) {
        const thumb = thumbOf(rowOf(page, title));
        await expectEdge(thumb, "solid");
        await expectNoRadius(thumb);
        const b = await box(thumb);
        expect(b.width).toBe(64);
        expect(b.height).toBe(64);
      }
      await expect(photoThumb.locator("img")).toHaveCount(1);
      for (const title of ["Draft Flat", "Disabled Desk"]) {
        const row = rowOf(page, title);
        await expect(row.locator("svg[aria-hidden='true']")).toHaveCount(1);
        await expect(row.locator("img")).toHaveCount(0);
      }
    });

    test("status tags: dashed draft, solid published and disabled, struck disabled, no pill", async ({
      page,
    }) => {
      await host(page);
      await page.goto("/host/listings");
      await expect(page.getByText("Published Cabin")).toBeVisible();

      const draft = page.getByText("Draft", { exact: true });
      const published = page.getByText("Published", { exact: true });
      const disabled = page.getByText("Disabled", { exact: true });
      for (const tag of [draft, published, disabled]) {
        await expect(tag).toHaveCount(1);
        expect(await maxRadius(tag)).toBeLessThanOrEqual(4);
        await expect(tag).toHaveCSS("border-top-width", "2px");
      }
      await expect(draft).toHaveCSS("border-top-style", "dashed");
      await expect(published).toHaveCSS("border-top-style", "solid");
      await expect(disabled).toHaveCSS("border-top-style", "solid");
      await expect(disabled).toHaveCSS("text-decoration-line", "line-through");
      for (const tag of [draft, published]) {
        await expect(tag).not.toHaveCSS("text-decoration-line", "line-through");
      }
    });

    test("header: one black h1, New listing and every Edit are single 44px links inside the viewport", async ({
      page,
    }) => {
      await host(page);
      await page.goto("/host/listings");
      await expect(page.getByText("Published Cabin")).toBeVisible();

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText("My Listings");
      await expect(page.locator("h1")).toHaveCSS("color", INK_RGB);
      expect(await page.locator("h1").evaluate((el) => getComputedStyle(el).fontFamily)).toContain(
        "Overpass",
      );

      const create = page.getByRole("link", { name: "New listing" });
      await expect(create).toHaveCount(1);
      await expect(create).toHaveAttribute("href", "/host/listings/new");
      expect(await create.locator("button").count()).toBe(0);
      expectInsideViewport(page, await box(create));
      await expectHeightAtLeast44(create);

      const edits = page.getByRole("link", { name: "Edit" });
      await expect(edits).toHaveCount(3);
      for (let i = 0; i < 3; i += 1) {
        expect(await edits.nth(i).locator("button").count()).toBe(0);
        expectInsideViewport(page, await box(edits.nth(i)));
        await expectHeightAtLeast44(edits.nth(i));
      }
    });

    test("empty: a dashed 2px ink panel with the message and no link besides New listing", async ({
      page,
    }, testInfo) => {
      await host(page, { listings: ok([]) });
      await page.goto("/host/listings");

      const message = page.getByText("You have no listings yet.");
      await expect(message).toBeVisible();
      const panel = await message.evaluate((el) => {
        for (let n: Element | null = el; n; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.borderTopWidth === "2px" && cs.borderTopStyle !== "none") {
            return {
              style: cs.borderTopStyle,
              color: cs.borderTopColor,
              shadow: cs.boxShadow,
            };
          }
        }
        return null;
      });
      expect(panel).toEqual({ style: "dashed", color: INK_RGB, shadow: "none" });
      await expect(page.locator("main a")).toHaveCount(1);
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `listings-empty-${vp.name}`);
    });

    test("loading: a busy flat skeleton with no h1, no pill, no shadow", async ({
      page,
    }, testInfo) => {
      await host(page, { listings: "hang" });
      await page.goto("/host/listings");
      await expectBusyFlat(page);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `listings-loading-${vp.name}`);
    });

    test("failure: one alert holding one h1 with the generic text, a danger edge, tint and tile", async ({
      page,
    }, testInfo) => {
      await host(page, { listings: fail(500) });
      await page.goto("/host/listings");

      // The query client retries a failed request three times (1s, 2s, 4s) before settling.
      const alert = await expectErrorPanelWithH1(page, "Something went wrong. Please try again.");
      expectInsideViewport(page, await box(alert));
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `listings-error-${vp.name}`);
    });
  });

  test.describe(`Host bookings identity at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("table: 2px ink head rule, bold ink headings, tabular amounts, one black h1", async ({
      page,
    }, testInfo) => {
      await host(page);
      await page.goto("/host/upcoming");
      await expect(page.getByText("Pending Loft")).toBeVisible();

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText("All Bookings");
      await expect(page.locator("h1")).toHaveCSS("color", INK_RGB);

      const headRow = page.locator("thead tr");
      await expect(headRow).toHaveCSS("border-bottom-width", "2px");
      await expect(headRow).toHaveCSS("border-bottom-style", "solid");
      await expect(headRow).toHaveCSS("border-bottom-color", INK_RGB);
      const headings = page.locator("thead th");
      await expect(headings).toHaveCount(6);
      for (let i = 0; i < 6; i += 1) {
        await expect(headings.nth(i)).toHaveCSS("font-weight", "700");
        await expect(headings.nth(i)).toHaveCSS("color", INK_RGB);
      }
      const amount = page.getByText("$300").first();
      expect(await amount.evaluate((el) => getComputedStyle(el).fontVariantNumeric)).toContain(
        "tabular-nums",
      );
      expect(await shadowsAndGradients(page)).toEqual([]);
      expect(await emberBackgrounds(page)).toBe(0);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `bookings-${vp.name}`);
    });

    test("booking tags: dashed pending, solid others, struck cancelled, no pill", async ({
      page,
    }) => {
      await host(page);
      await page.goto("/host/upcoming");
      await expect(page.getByText("Pending Loft")).toBeVisible();

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

    test("loading: a busy flat skeleton with no h1", async ({ page }, testInfo) => {
      await host(page, { bookings: "hang" });
      await page.goto("/host/upcoming");
      await expectBusyFlat(page);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `bookings-loading-${vp.name}`);
    });

    test("failure: one alert holding one h1 with the generic text and a danger edge", async ({
      page,
    }, testInfo) => {
      await host(page, { bookings: fail(500) });
      await page.goto("/host/upcoming");
      await expectErrorPanelWithH1(page, "Something went wrong. Please try again.");
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `bookings-error-${vp.name}`);
    });
  });

  test.describe(`Host forms identity at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("create: bold labels, 2px selects and textarea, 2px checkbox with a 44px label, 44px submit", async ({
      page,
    }, testInfo) => {
      await host(page);
      await page.goto("/host/listings/new");
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText("Create a new listing");
      await expect(page.locator("h1")).toHaveCSS("color", INK_RGB);

      for (const id of ["title", "description", "type", "city", "country", "capacity"]) {
        await expect(page.locator(`label[for="${id}"]`)).toHaveCSS("font-weight", "700");
      }
      for (const id of ["description", "type", "country", "currency"]) {
        await expectEdge(page.locator(`#${id}`), "solid");
        expect(await maxRadius(page.locator(`#${id}`))).toBeLessThanOrEqual(4);
      }

      const wifi = page.getByRole("checkbox", { name: "Wi-Fi" });
      await expectEdge(wifi, "solid");
      await expectNoRadius(wifi);
      await expectHeightAtLeast44(wifi.locator("xpath=ancestor::label"));

      await expectHeightAtLeast44(page.getByRole("button", { name: "Create a new listing" }));
      expect(await shadowsAndGradients(page)).toEqual([]);
      expect(await emberBackgrounds(page)).toBe(0);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `create-${vp.name}`);
    });

    test("create: an invalid field has a danger edge and an error with a danger left bar", async ({
      page,
    }, testInfo) => {
      await host(page);
      await page.goto("/host/listings/new");
      const title = page.getByLabel(/^title$/i);
      await title.fill("ab");
      await title.blur();

      const error = page.getByText("At least 5 characters required");
      await expect(error).toBeVisible();
      await expectEdge(title, "solid", DANGER_RGB);
      await expect(error).toHaveCSS("border-left-width", "4px");
      await expect(error).toHaveCSS("border-left-style", "solid");
      await expect(error).toHaveCSS("border-left-color", DANGER_RGB);
      await expect(error).toHaveCSS("color", DANGER_RGB);
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `create-invalid-${vp.name}`);
    });

    test("edit: framed square photos, flat 2px availability rows, 44px actions, 2px select", async ({
      page,
    }, testInfo) => {
      await host(page, { photos: ok(PHOTOS), availability: ok(BLOCKS) });
      await page.goto(`/host/listings/${EDIT_ID}/edit`);
      await expect(page.locator("#edit-title")).toBeVisible();

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText("Edit listing");
      await expect(page.locator("h1")).toHaveCSS("color", INK_RGB);
      await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);

      for (const name of ["Photo 1", "Photo 2"]) {
        const photo = page.getByAltText(name);
        await expectEdge(photo, "solid");
        await expectNoRadius(photo);
        const b = await box(photo);
        expect(Math.abs(b.width - b.height)).toBeLessThanOrEqual(1);
      }
      const deletes = page.getByRole("button", { name: "Delete" });
      await expect(deletes).toHaveCount(2);
      for (let i = 0; i < 2; i += 1) await expectHeightAtLeast44(deletes.nth(i));

      const blockRow = page.locator("main li");
      await expect(blockRow).toHaveCount(1);
      await expectEdge(blockRow, "solid");
      await expectNoRadius(blockRow);
      await expectHeightAtLeast44(page.getByRole("button", { name: "Remove" }));

      await expectEdge(page.locator("#edit-type"), "solid");
      await expectEdge(page.locator("#edit-description"), "solid");
      await expectHeightAtLeast44(page.getByRole("button", { name: "Save changes" }));
      expect(await shadowsAndGradients(page)).toEqual([]);
      expect(await emberBackgrounds(page)).toBe(0);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `edit-${vp.name}`);
    });

    test("edit: listing tag is dashed when draft and strict text matches one element each", async ({
      page,
    }) => {
      await host(page);
      await page.goto(`/host/listings/${EDIT_ID}/edit`);
      await expect(page.locator("#edit-title")).toBeVisible();

      const draft = page.getByText("Draft", { exact: true });
      await expect(draft).toHaveCount(1);
      await expect(page.getByText("Draft")).toHaveCount(1);
      await expect(draft).toHaveCSS("border-top-style", "dashed");
      expect(await maxRadius(draft)).toBeLessThanOrEqual(4);
      await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeVisible();
    });

    test("edit: publishing swaps in the published tag, solid with a single text match", async ({
      page,
    }) => {
      await host(page);
      let published = false;
      await page.route(`${API}/listings/${EDIT_ID}/manage`, (route) =>
        reply(route, ok(published ? { ...EDIT_LISTING, status: "PUBLISHED" } : EDIT_LISTING)),
      );
      await page.route(`${API}/listings/${EDIT_ID}/publish`, (route) => {
        published = true;
        return reply(route, ok({ ...EDIT_LISTING, status: "PUBLISHED" }));
      });
      await page.goto(`/host/listings/${EDIT_ID}/edit`);
      await page.getByRole("button", { name: "Publish", exact: true }).click();

      const tag = page.getByText("Published", { exact: true });
      await expect(tag).toHaveCount(1);
      await expect(page.getByText("Published")).toHaveCount(1);
      await expect(tag).toHaveCSS("border-top-style", "solid");
      await expect(tag).toHaveCSS("border-top-color", INK_RGB);
      await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible();
    });

    test("edit: a publish error is one shared danger alert", async ({ page }, testInfo) => {
      await host(page, { publish: fail(422, { error: "Add at least one photo." }) });
      await page.goto(`/host/listings/${EDIT_ID}/edit`);
      await page.getByRole("button", { name: "Publish", exact: true }).click();

      const alert = page.getByRole("alert");
      await expect(alert).toHaveCount(1);
      await expect(alert).toContainText("Add at least one photo.");
      await expectDangerPanel(alert);
      expect(await alert.locator('[aria-hidden="true"]').count()).toBeGreaterThan(0);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `edit-publish-error-${vp.name}`);
    });

    test("edit not found: one alert holding one h1 with a danger edge and tint", async ({
      page,
    }, testInfo) => {
      await host(page, { listing: fail(404, { error: "NOT_FOUND" }) });
      await page.goto(`/host/listings/${EDIT_ID}/edit`);
      const alert = await expectErrorPanelWithH1(page, "Something went wrong. Please try again.");
      expectInsideViewport(page, await box(alert));
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `edit-not-found-${vp.name}`);
    });

    test("edit loading: a busy flat skeleton with no h1", async ({ page }) => {
      await host(page, { listing: "hang" });
      await page.goto(`/host/listings/${EDIT_ID}/edit`);
      await expectBusyFlat(page);
      await expectNoHorizontalOverflow(page);
    });

    test("become host: one black h1, a 2px square terms checkbox in a 44px row, left-bar terms error", async ({
      page,
    }, testInfo) => {
      await guest(page);
      await page.goto("/become-host");
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText("Become a host");
      await expect(page.locator("h1")).toHaveCSS("color", INK_RGB);
      expect(await emberBackgrounds(page)).toBe(0);

      const terms = page.getByRole("checkbox");
      await expectEdge(terms, "solid");
      await expectNoRadius(terms);
      await expectHeightAtLeast44(terms.locator("xpath=.."));

      await page.getByLabel(/display name/i).fill("My Host Name");
      await page.getByLabel(/payout email/i).fill("host@test.com");
      await page.getByRole("button", { name: /become a host/i }).click();
      const error = page.getByText("You must accept the host terms to continue.");
      await expect(error).toBeVisible();
      await expect(error).toHaveCSS("border-left-width", "4px");
      await expect(error).toHaveCSS("border-left-style", "solid");
      await expect(error).toHaveCSS("border-left-color", DANGER_RGB);
      await expect(page.getByRole("alert")).toHaveCount(0);
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `become-host-${vp.name}`);
    });
  });
}

test.describe("Host screens at mobile-360: long strings and every state", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("listings with a long title and city and many rows does not overflow", async ({
    page,
  }, testInfo) => {
    const many = [
      makeListing("long-1", `${LONG_WORD} ${LONG_WORD}`, "PUBLISHED", {
        city: LONG_WORD,
        primaryPhotoUrl: PHOTO,
        _count: { bookings: 12 },
      }),
      ...Array.from({ length: 11 }, (_, i) =>
        makeListing(
          `many-${i}`,
          `Listing number ${i}`,
          (["DRAFT", "PUBLISHED", "DISABLED"] as const)[i % 3] as ListingStatus,
        ),
      ),
    ];
    await host(page, { listings: ok(many) });
    await page.goto("/host/listings");
    await expect(page.locator("main .rounded-card")).toHaveCount(12);
    await expectNoHorizontalOverflow(page);
    expectInsideViewport(page, await box(page.getByRole("link", { name: "New listing" })));
    for (const link of await page.getByRole("link", { name: "Edit" }).all()) {
      expectInsideViewport(page, await box(link));
    }
    await attachScreenshot(page, testInfo, "listings-many-mobile-360");
  });

  test("the header New listing action is full width at 360", async ({ page }) => {
    await host(page);
    await page.goto("/host/listings");
    const create = page.getByRole("link", { name: "New listing" });
    const b = await box(create);
    const main = await box(page.locator("main"));
    expect(b.width).toBeGreaterThanOrEqual(main.width - 2 * 16 - 1);
    expectInsideViewport(page, b);
  });

  test("bookings with a long guest email scroll inside their wrapper, not the document", async ({
    page,
  }, testInfo) => {
    await host(page, {
      bookings: ok([
        makeBooking("long-1", "CONFIRMED", `${LONG_WORD}`, `${LONG_WORD}@example.com`),
        ...BOOKINGS,
      ]),
    });
    await page.goto("/host/upcoming");
    await expect(page.getByText("Pending Loft")).toBeVisible();

    await expectNoHorizontalOverflow(page);
    const wrapper = page.locator("table").locator("xpath=..");
    await expect(wrapper).toHaveCSS("overflow-x", "auto");
    const m = await wrapper.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(m.scrollWidth).toBeGreaterThan(m.clientWidth);
    await attachScreenshot(page, testInfo, "bookings-long-email-mobile-360");
  });

  test("create, edit with long strings, photos and blocks, and become host do not overflow", async ({
    page,
  }) => {
    await host(page, {
      listing: ok(makeListing(EDIT_ID, `${LONG_WORD} ${LONG_WORD}`, "DRAFT", { city: LONG_WORD })),
      photos: ok(PHOTOS),
      availability: ok(BLOCKS),
    });
    await page.goto("/host/listings/new");
    await expect(page.locator("h1")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expectInsideViewport(
      page,
      await box(page.getByRole("button", { name: "Create a new listing" })),
    );

    await page.goto(`/host/listings/${EDIT_ID}/edit`);
    await expect(page.getByAltText("Photo 1")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expectInsideViewport(page, await box(page.getByRole("button", { name: "Save changes" })));
    expectInsideViewport(page, await box(page.getByRole("button", { name: "Block dates" })));

    await page.goto("/become-host");
    await expect(page.locator("h1")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("listings empty state does not overflow", async ({ page }) => {
    await host(page, { listings: ok([]) });
    await page.goto("/host/listings");
    await expect(page.getByText("You have no listings yet.")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("a long server error on the edit page does not overflow", async ({ page }) => {
    await host(page, { publish: fail(422, { error: `${LONG_WORD}${LONG_WORD}` }) });
    await page.goto(`/host/listings/${EDIT_ID}/edit`);
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("Host screens keyboard focus", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("listings: Tab reaches New listing and each Edit once each, in order, with the 3px ink ring", async ({
    page,
  }) => {
    await host(page);
    await page.goto("/host/listings");
    await expect(page.getByText("Published Cabin")).toBeVisible();

    // Every focusable element inside <main>, in Tab order: each CTA is one link, so one stop.
    const stops: { id: string; width: string; color: string; shadow: string }[] = [];
    for (let i = 0; i < 60 && stops.length < 4; i += 1) {
      await page.keyboard.press("Tab");
      const stop = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || !el.closest("main")) return null;
        const cs = getComputedStyle(el);
        return {
          id: `${el.tagName.toLowerCase()}|${el.textContent?.trim()}|${el.getAttribute("href") ?? ""}`,
          width: cs.outlineWidth,
          color: cs.outlineColor,
          shadow: cs.boxShadow,
        };
      });
      if (stop) stops.push(stop);
    }
    expect(stops.map((s) => s.id)).toEqual([
      "a|New listing|/host/listings/new",
      "a|Edit|/host/listings/l-pub/edit",
      "a|Edit|/host/listings/l-draft/edit",
      "a|Edit|/host/listings/l-dis/edit",
    ]);
    for (const stop of stops) {
      expect(stop.width).toBe("3px");
      expect(stop.color).toBe(INK_RGB);
      expect(stop.shadow).toContain(PAPER_RGB);
    }
  });

  test("create: the global ring shows on a select, a textarea, a checkbox and the submit button", async ({
    page,
  }) => {
    await host(page);
    await page.goto("/host/listings/new");
    await fillCreateValid(page);
    await expect(page.getByRole("button", { name: "Create a new listing" })).toBeEnabled();

    await page.locator("#title").focus();
    await focusUntil(page, "#description");
    await expectInkFocusRing(page);
    await focusUntil(page, "#type");
    await expectInkFocusRing(page);
    await focusUntil(page, "input[type=checkbox]");
    await expectInkFocusRing(page);
    await focusUntil(page, "button", "Create a new listing");
    await expectInkFocusRing(page);
  });

  test("edit: Publish, a textarea and Save changes are reached with the 3px ink ring", async ({
    page,
  }) => {
    await host(page);
    await page.goto(`/host/listings/${EDIT_ID}/edit`);
    await expect(page.locator("#edit-title")).toBeVisible();

    await focusUntil(page, "button", "Publish");
    await expectInkFocusRing(page);
    await focusUntil(page, "#edit-description");
    await expectInkFocusRing(page);
    await focusUntil(page, "#edit-type");
    await expectInkFocusRing(page);
    await focusUntil(page, "button", "Save changes");
    await expectInkFocusRing(page);
  });

  test("become host: Space toggles the terms checkbox and the ring shows on it", async ({
    page,
  }) => {
    await guest(page);
    await page.goto("/become-host");
    await focusUntil(page, "input[type=checkbox]");
    await expectInkFocusRing(page);
    await page.keyboard.press("Space");
    await expect(page.getByRole("checkbox")).toBeChecked();
  });
});
