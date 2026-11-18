import { test, expect } from "@playwright/test";
import type { Locator, Page, Route, TestInfo } from "@playwright/test";
import { mockSession } from "./helpers/auth";

// Identity checks for the admin screens (NH-123, admin-identity design.md D8). Same policy as
// host-identity.spec.ts: computed styles and geometry are asserted, screenshots are attached as
// artifacts and never compared. Every API call is mocked through one catch-all route on the API
// origin; the pages are reached with relative URLs, so the spec runs on any port (no hard-coded dev
// server port). Routes come from apps/web/src/router.tsx (/admin/users, /admin/listings).
//
// Selector assumptions (the pages have no test ids):
//  - both layouts are in the DOM (one is display: none), so text and role queries on the page keep
//    the visible match with .filter({ visible: true });
//  - table = "main table"; head row = "thead tr"; card = each "main ul > li";
//  - account and listing status tags = the element whose own text is exactly the label;
//  - action = the button named "Disable" or "Re-enable";
//  - error panel = the only role="alert" element; tile = its [aria-hidden="true"] descendant.

const API = "http://localhost:3000";
const INK_RGB = "rgb(30, 30, 30)";
const MUTED_EDGE_RGB = "rgb(111, 106, 99)";
const DANGER_RGB = "rgb(155, 28, 46)";
const DANGER_BG_RGB = "rgb(248, 225, 224)";
const EMBER_RGB = "rgb(230, 95, 53)";

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-360", width: 360, height: 800 },
] as const;

const LONG_WORD = "Verylongunbrokenword".repeat(6);
const GENERIC_ERROR = "Something went wrong. Please try again.";

type ListingStatus = "DRAFT" | "PUBLISHED" | "DISABLED";

function makeUser(id: string, email: string, roles: string[], disabled = false) {
  return {
    id,
    email,
    roles,
    disabledAt: disabled ? "2026-02-01T00:00:00.000Z" : null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

const USERS = [
  makeUser("u-active", "active@test.com", ["guest", "host"]),
  makeUser("u-off", "off@test.com", ["guest"], true),
];

function makeListing(
  id: string,
  title: string,
  status: ListingStatus,
  over: Record<string, unknown> = {},
) {
  return {
    id,
    title,
    type: "PROPERTY",
    city: "Lisbon",
    status,
    createdAt: "2026-01-01T00:00:00.000Z",
    host: { email: `${id}@host.test` },
    ...over,
  };
}

const LISTINGS = [
  makeListing("l-pub", "Published Cabin", "PUBLISHED"),
  makeListing("l-draft", "Draft Flat", "DRAFT"),
  makeListing("l-dis", "Disabled Desk", "DISABLED", { type: "WORKSPACE", city: "Porto" }),
];

type Reply = "hang" | { status: number; body: unknown };
const ok = (body: unknown): Reply => ({ status: 200, body });
const fail = (status: number, body: unknown = { error: "SERVER_ERROR" }): Reply => ({
  status,
  body,
});
const page1 = (data: unknown[]) => ok({ data, total: data.length, page: 1, limit: 50 });

type Api = { users?: Reply; listings?: Reply };

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
    const path = new URL(route.request().url()).pathname;
    if (path === "/auth/refresh") return route.fallback();
    if (path === "/admin/users") return reply(route, api.users ?? page1(USERS));
    if (path === "/admin/listings") return reply(route, api.listings ?? page1(LISTINGS));
    return reply(route, fail(404, { error: "NOT_FOUND" }));
  });
}

async function admin(page: Page, api: Api = {}) {
  await mockSession(page, { email: "admin@test.com", roles: ["admin"] });
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

async function expectHeightAtLeast44(locator: Locator) {
  const b = await box(locator);
  expect(b.height).toBeGreaterThanOrEqual(44);
}

async function expectDashedEmptyPanel(page: Page, message: string) {
  const text = page.getByText(message);
  await expect(text).toBeVisible();
  const panel = await text.evaluate((el) => {
    for (let n: Element | null = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.borderTopWidth === "2px" && cs.borderTopStyle !== "none") {
        return { style: cs.borderTopStyle, color: cs.borderTopColor, shadow: cs.boxShadow };
      }
    }
    return null;
  });
  expect(panel).toEqual({ style: "dashed", color: INK_RGB, shadow: "none" });
}

/** Keeps the visible match: both layouts are in the DOM and one is display: none. */
const visible = (l: Locator) => l.filter({ visible: true });

async function expectHeadingInk(page: Page, text: string) {
  const h1 = page.locator("h1");
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText(text);
  await expect(h1).toHaveCSS("color", INK_RGB);
  await expect(h1).toHaveCSS("font-weight", "900");
  expect(await h1.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Overpass");
}

/** Checks the table (from sm) or the cards (below sm), never both. Returns the visible rows. */
async function expectLayout(page: Page, isDesktop: boolean, headings: string[], rows: number) {
  const table = page.locator("main table");
  const cards = page.locator("main ul > li");
  if (isDesktop) {
    await expect(table).toBeVisible();
    await expect(cards.first()).toBeHidden();
    await expect(page.getByRole("table")).toHaveCount(1);
    await expect(page.getByRole("listitem")).toHaveCount(0);
    const headRow = page.locator("thead tr");
    await expect(headRow).toHaveCSS("border-bottom-width", "2px");
    await expect(headRow).toHaveCSS("border-bottom-style", "solid");
    await expect(headRow).toHaveCSS("border-bottom-color", INK_RGB);
    const th = page.locator("thead th");
    await expect(th).toHaveCount(headings.length);
    for (let i = 0; i < headings.length; i += 1) {
      await expect(th.nth(i)).toHaveText(headings[i] as string);
      await expect(th.nth(i)).toHaveCSS("font-weight", "700");
      await expect(th.nth(i)).toHaveCSS("color", INK_RGB);
    }
    await expect(page.locator("tbody tr")).toHaveCount(rows);
  } else {
    await expect(table).toBeHidden();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(cards).toHaveCount(rows);
    for (let i = 0; i < rows; i += 1) {
      const card = cards.nth(i);
      await expect(card).toBeVisible();
      await expect(card).toHaveCSS("border-top-width", "2px");
      await expect(card).toHaveCSS("border-top-style", "solid");
      await expect(card).toHaveCSS("border-top-color", INK_RGB);
      await expect(card).toHaveCSS("box-shadow", "none");
      expect(await maxRadius(card)).toBeLessThanOrEqual(4);
    }
  }
}

for (const vp of VIEWPORTS) {
  const isDesktop = vp.width >= 640;

  test.describe(`Admin users identity at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("one black heavy h1; the table shows from sm up and the cards below, never both", async ({
      page,
    }, testInfo) => {
      await admin(page);
      await page.goto("/admin/users");
      await expect(visible(page.getByText("active@test.com"))).toBeVisible();

      await expectHeadingInk(page, "Users");
      await expectLayout(page, isDesktop, ["Email", "Roles", "Status", "Actions"], 2);
      expect(await shadowsAndGradients(page)).toEqual([]);
      expect(await emberBackgrounds(page)).toBe(0);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `users-${vp.name}`);
    });

    test("account tags: solid ink with a marker when active, solid muted and struck when disabled, no pill", async ({
      page,
    }) => {
      await admin(page);
      await page.goto("/admin/users");
      await expect(visible(page.getByText("active@test.com"))).toBeVisible();

      const active = visible(page.getByText("Active", { exact: true }));
      const disabled = visible(page.getByText("Disabled", { exact: true }));
      for (const tag of [active, disabled]) {
        await expect(tag).toHaveCount(1);
        expect(await maxRadius(tag)).toBeLessThanOrEqual(4);
        await expect(tag).toHaveCSS("border-top-width", "2px");
        await expect(tag).toHaveCSS("border-top-style", "solid");
      }
      await expect(active).toHaveCSS("border-top-color", INK_RGB);
      await expect(active).not.toHaveCSS("text-decoration-line", "line-through");
      expect(await active.locator('[aria-hidden="true"]').count()).toBe(1);
      await expect(disabled).toHaveCSS("border-top-color", MUTED_EDGE_RGB);
      await expect(disabled).toHaveCSS("text-decoration-line", "line-through");
      expect(await disabled.locator('[aria-hidden="true"]').count()).toBe(0);
    });

    test("roles are plain muted text with no tag edge", async ({ page }) => {
      await admin(page);
      await page.goto("/admin/users");
      const roles = visible(page.getByText("guest, host", { exact: true }));
      await expect(roles).toHaveCount(1);
      await expect(roles).toHaveCSS("border-top-width", "0px");
      await expect(roles).toHaveCSS("color", "rgb(63, 59, 55)");
    });

    test("actions: Disable and Re-enable are 44px buttons, Re-enable has a flat 2px edge", async ({
      page,
    }) => {
      await admin(page);
      await page.goto("/admin/users");
      await expect(visible(page.getByText("active@test.com"))).toBeVisible();

      const disable = page.getByRole("button", { name: "Disable" });
      const enable = page.getByRole("button", { name: "Re-enable" });
      await expect(disable).toHaveCount(1);
      await expect(enable).toHaveCount(1);
      await expectHeightAtLeast44(disable);
      await expectHeightAtLeast44(enable);
      await expect(enable).toHaveCSS("border-top-width", "2px");
      await expect(enable).toHaveCSS("border-top-style", "solid");
      await expect(enable).toHaveCSS("box-shadow", "none");
      if (!isDesktop) {
        const card = await box(page.locator("main ul > li").first());
        const b = await box(disable);
        expectInsideViewport(page, b);
        expect(b.width).toBeGreaterThanOrEqual(card.width - 2 * 18 - 1);
      }
    });

    test("empty: a dashed 2px ink panel with the message", async ({ page }, testInfo) => {
      await admin(page, { users: page1([]) });
      await page.goto("/admin/users");
      await expectDashedEmptyPanel(page, "No users found.");
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `users-empty-${vp.name}`);
    });

    test("loading: a busy flat skeleton with no h1, no pill, no shadow", async ({
      page,
    }, testInfo) => {
      await admin(page, { users: "hang" });
      await page.goto("/admin/users");
      await expectBusyFlat(page);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `users-loading-${vp.name}`);
    });

    test("failure: one alert holding one h1 with the generic text, a danger edge, tint and tile", async ({
      page,
    }, testInfo) => {
      await admin(page, { users: fail(500) });
      await page.goto("/admin/users");
      // The query client retries a failed request three times (1s, 2s, 4s) before settling.
      const alert = await expectErrorPanelWithH1(page, GENERIC_ERROR);
      expectInsideViewport(page, await box(alert));
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `users-error-${vp.name}`);
    });
  });

  test.describe(`Admin listings identity at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("one black heavy h1; the table shows from sm up and the cards below, never both", async ({
      page,
    }, testInfo) => {
      await admin(page);
      await page.goto("/admin/listings");
      await expect(visible(page.getByText("Published Cabin"))).toBeVisible();

      await expectHeadingInk(page, "Listings");
      await expectLayout(
        page,
        isDesktop,
        ["Title", "Type", "City", "Host", "Status", "Actions"],
        3,
      );
      expect(await shadowsAndGradients(page)).toEqual([]);
      expect(await emberBackgrounds(page)).toBe(0);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `listings-${vp.name}`);
    });

    test("listing tags: dashed draft, solid published and disabled, struck disabled, no pill", async ({
      page,
    }) => {
      await admin(page);
      await page.goto("/admin/listings");
      await expect(visible(page.getByText("Published Cabin"))).toBeVisible();

      const draft = visible(page.getByText("Draft", { exact: true }));
      const published = visible(page.getByText("Published", { exact: true }));
      const disabled = visible(page.getByText("Disabled", { exact: true }));
      for (const tag of [draft, published, disabled]) {
        await expect(tag).toHaveCount(1);
        expect(await maxRadius(tag)).toBeLessThanOrEqual(4);
        await expect(tag).toHaveCSS("border-top-width", "2px");
      }
      await expect(draft).toHaveCSS("border-top-style", "dashed");
      await expect(published).toHaveCSS("border-top-style", "solid");
      await expect(published).toHaveCSS("border-top-color", INK_RGB);
      expect(await published.locator('[aria-hidden="true"]').count()).toBe(1);
      await expect(disabled).toHaveCSS("border-top-style", "solid");
      await expect(disabled).toHaveCSS("border-top-color", MUTED_EDGE_RGB);
      await expect(disabled).toHaveCSS("text-decoration-line", "line-through");
      for (const tag of [draft, published]) {
        await expect(tag).not.toHaveCSS("text-decoration-line", "line-through");
      }
    });

    test("actions: Disable and Re-enable are 44px buttons, Re-enable has a flat 2px edge", async ({
      page,
    }) => {
      await admin(page);
      await page.goto("/admin/listings");
      await expect(visible(page.getByText("Published Cabin"))).toBeVisible();

      const disable = page.getByRole("button", { name: "Disable" });
      const enable = page.getByRole("button", { name: "Re-enable" });
      await expect(disable).toHaveCount(2);
      await expect(enable).toHaveCount(1);
      for (let i = 0; i < 2; i += 1) await expectHeightAtLeast44(disable.nth(i));
      await expectHeightAtLeast44(enable);
      await expect(enable).toHaveCSS("border-top-width", "2px");
      await expect(enable).toHaveCSS("border-top-style", "solid");
      await expect(enable).toHaveCSS("box-shadow", "none");
      if (!isDesktop) {
        const card = await box(page.locator("main ul > li").first());
        const b = await box(disable.first());
        expectInsideViewport(page, b);
        expect(b.width).toBeGreaterThanOrEqual(card.width - 2 * 18 - 1);
      }
    });

    test("empty: a dashed 2px ink panel with the message", async ({ page }, testInfo) => {
      await admin(page, { listings: page1([]) });
      await page.goto("/admin/listings");
      await expectDashedEmptyPanel(page, "No listings found.");
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `listings-empty-${vp.name}`);
    });

    test("loading: a busy flat skeleton with no h1, no pill, no shadow", async ({
      page,
    }, testInfo) => {
      await admin(page, { listings: "hang" });
      await page.goto("/admin/listings");
      await expectBusyFlat(page);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `listings-loading-${vp.name}`);
    });

    test("failure: one alert holding one h1 with the generic text, a danger edge, tint and tile", async ({
      page,
    }, testInfo) => {
      await admin(page, { listings: fail(500) });
      await page.goto("/admin/listings");
      const alert = await expectErrorPanelWithH1(page, GENERIC_ERROR);
      expectInsideViewport(page, await box(alert));
      expect(await shadowsAndGradients(page)).toEqual([]);
      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `listings-error-${vp.name}`);
    });
  });
}

test.describe("Admin screens at mobile-360: long strings and every state", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("users with a very long email and many rows show cards, status and action, no overflow", async ({
    page,
  }, testInfo) => {
    const many = [
      makeUser("long-1", `${LONG_WORD}@example.com`, ["guest", "host"]),
      ...Array.from({ length: 11 }, (_, i) =>
        makeUser(`many-${i}`, `user${i}@example.com`, ["guest"], i % 2 === 1),
      ),
    ];
    await admin(page, { users: page1(many) });
    await page.goto("/admin/users");
    const cards = page.locator("main ul > li");
    await expect(cards).toHaveCount(12);
    await expect(page.locator("main table")).toBeHidden();
    await expectNoHorizontalOverflow(page);

    const long = cards.first();
    await expect(long).toBeVisible();
    await expect(long.getByText(`${LONG_WORD}@example.com`)).toBeVisible();
    await expect(long.getByText("Active", { exact: true })).toBeVisible();
    await expect(long.getByRole("button", { name: "Disable" })).toBeVisible();
    expectInsideViewport(page, await box(long.getByText(`${LONG_WORD}@example.com`)));
    expectInsideViewport(page, await box(long.getByText("Active", { exact: true })));
    expectInsideViewport(page, await box(long.getByRole("button", { name: "Disable" })));
    await attachScreenshot(page, testInfo, "users-long-email-mobile-360");
  });

  test("listings with a long title and city and many rows show cards, status and action, no overflow", async ({
    page,
  }, testInfo) => {
    const many = [
      makeListing("long-1", `${LONG_WORD} ${LONG_WORD}`, "PUBLISHED", {
        city: LONG_WORD,
        host: { email: `${LONG_WORD}@host.test` },
      }),
      ...Array.from({ length: 11 }, (_, i) =>
        makeListing(
          `many-${i}`,
          `Listing number ${i}`,
          (["DRAFT", "PUBLISHED", "DISABLED"] as const)[i % 3] as ListingStatus,
        ),
      ),
    ];
    await admin(page, { listings: page1(many) });
    await page.goto("/admin/listings");
    const cards = page.locator("main ul > li");
    await expect(cards).toHaveCount(12);
    await expect(page.locator("main table")).toBeHidden();
    await expectNoHorizontalOverflow(page);

    const long = cards.first();
    await expect(long).toBeVisible();
    await expect(long.getByText("Published", { exact: true })).toBeVisible();
    await expect(long.getByRole("button", { name: "Disable" })).toBeVisible();
    expectInsideViewport(page, await box(long.getByText("Published", { exact: true })));
    expectInsideViewport(page, await box(long.getByRole("button", { name: "Disable" })));
    await attachScreenshot(page, testInfo, "listings-long-title-mobile-360");
  });

  for (const [name, path, key, message] of [
    ["users", "/admin/users", "users", "No users found."],
    ["listings", "/admin/listings", "listings", "No listings found."],
  ] as const) {
    test(`${name}: loading, empty and error do not overflow`, async ({ page }) => {
      await admin(page, { [key]: "hang" });
      await page.goto(path);
      await expectBusyFlat(page);
      await expectNoHorizontalOverflow(page);

      const empty = await page.context().newPage();
      await admin(empty, { [key]: page1([]) });
      await empty.setViewportSize({ width: 360, height: 800 });
      await empty.goto(path);
      await expect(empty.getByText(message)).toBeVisible();
      await expectNoHorizontalOverflow(empty);

      const failed = await page.context().newPage();
      await admin(failed, { [key]: fail(500) });
      await failed.setViewportSize({ width: 360, height: 800 });
      await failed.goto(path);
      await expect(failed.getByRole("alert")).toHaveCount(1, { timeout: 20_000 });
      await expectNoHorizontalOverflow(failed);
    });
  }
});

test.describe("Admin tables at 1440: long unbroken strings", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const LONG_EMAIL = `${"verylongunbrokenlocalpart".repeat(4)}@${"longdomain".repeat(2)}.example.com`;
  const LONG_TITLE = "Verylongunbrokentitle".repeat(5);

  /** Every action button sits fully inside the scroller with room for the 3px ring, on one line. */
  async function expectActionsVisible(page: Page, buttonCount: number) {
    const scroller = page.locator("main table").locator("xpath=..");
    const s = await box(scroller);
    const m = await scroller.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth);
    const headActions = await box(page.locator("thead th").last());
    expect(headActions.x + headActions.width).toBeLessThanOrEqual(s.x + s.width);
    const buttons = page.locator("main tbody").getByRole("button");
    await expect(buttons).toHaveCount(buttonCount);
    for (let i = 0; i < buttonCount; i += 1) {
      const b = await box(buttons.nth(i));
      expect(b.height).toBeLessThan(60);
      expect(b.x + b.width + 3).toBeLessThanOrEqual(s.x + s.width);
    }
  }

  test("users: a very long email keeps Status and Actions inside the table", async ({ page }) => {
    await admin(page, {
      users: page1([
        makeUser("u-long", LONG_EMAIL, ["guest", "host"]),
        makeUser("u-long-off", `off${LONG_EMAIL}`, ["guest"], true),
      ]),
    });
    await page.goto("/admin/users");
    await expect(page.locator("main tbody tr")).toHaveCount(2);
    await expectActionsVisible(page, 2);
    await expect(page.getByRole("button", { name: "Re-enable" })).toBeVisible();
  });

  test("listings: a very long title keeps Status and Actions inside the table", async ({
    page,
  }) => {
    await admin(page, {
      listings: page1([
        makeListing("l-long", LONG_TITLE, "PUBLISHED", {
          city: "Verylongcityname".repeat(5),
          host: { email: LONG_EMAIL },
        }),
        makeListing("l-long-dis", `Dis${LONG_TITLE}`, "DISABLED"),
      ]),
    });
    await page.goto("/admin/listings");
    await expect(page.locator("main tbody tr")).toHaveCount(2);
    await expectActionsVisible(page, 2);
    await expect(page.getByRole("button", { name: "Re-enable" })).toBeVisible();
  });
});

test.describe("Admin screens keyboard focus", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const [name, path, ready, expected] of [
    ["users", "/admin/users", "active@test.com", ["button|Disable", "button|Re-enable"]],
    [
      "listings",
      "/admin/listings",
      "Published Cabin",
      ["button|Disable", "button|Disable", "button|Re-enable"],
    ],
  ] as const) {
    test(`${name}: Tab reaches each action once, in order, with the 3px ink ring`, async ({
      page,
    }) => {
      await admin(page);
      await page.goto(path);
      await expect(visible(page.getByText(ready))).toBeVisible();

      // Every focusable element inside <main>, in Tab order: each action is one button, so one stop.
      // Only the 3px ink outline is asserted: the Button variants (and FLAT_SECONDARY) own the
      // box-shadow, so the paper gap ring is not part of this check.
      const stops: { id: string; width: string; style: string; color: string }[] = [];
      for (let i = 0; i < 60 && stops.length < expected.length; i += 1) {
        await page.keyboard.press("Tab");
        const stop = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || !el.closest("main")) return null;
          const cs = getComputedStyle(el);
          return {
            id: `${el.tagName.toLowerCase()}|${el.textContent?.trim()}`,
            width: cs.outlineWidth,
            style: cs.outlineStyle,
            color: cs.outlineColor,
          };
        });
        if (stop) stops.push(stop);
      }
      expect(stops.map((s) => s.id)).toEqual([...expected]);
      for (const stop of stops) {
        expect(stop.style).toBe("solid");
        expect(stop.width).toBe("3px");
        expect(stop.color).toBe(INK_RGB);
      }
    });
  }
});
