import { test, expect } from "@playwright/test";
import type { Locator, Page, TestInfo } from "@playwright/test";

// Identity checks for the auth screens (NH-125, auth-screens-identity design.md D12).
// Same policy as layout.spec.ts: computed styles and geometry are asserted, screenshots
// are attached as artifacts and never compared. Every /auth/* call is mocked.

const API = "http://localhost:3000";
const EMBER_RGB = "rgb(230, 95, 53)";
const SAGE_RGB = "rgb(150, 168, 166)";
const INK_RGB = "rgb(30, 30, 30)";
const PAPER_RGB = "rgb(247, 245, 242)";
const STONE_RGB = "rgb(229, 226, 221)";
const DANGER_RGB = "rgb(155, 28, 46)";
const DANGER_BG_RGB = "rgb(248, 225, 224)";

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-360", width: 360, height: 800 },
] as const;

const LONG_MESSAGE = `That email and password combination was not recognised ${"x".repeat(90)}`;

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

/** Background colour of the nearest ancestor (or self) whose background is not transparent. */
async function opaqueBackground(locator: Locator): Promise<string> {
  return locator.evaluate((el) => {
    let node: Element | null = el;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
      node = node.parentElement;
    }
    return "rgba(0, 0, 0, 0)";
  });
}

async function expectNotOnOrange(locator: Locator) {
  const bg = await opaqueBackground(locator);
  expect(bg).not.toBe(EMBER_RGB);
  expect(bg).not.toBe(SAGE_RGB);
}

async function mockLoginFailure(page: Page, message: string) {
  await page.route(`${API}/auth/login`, (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "INVALID_CREDENTIALS", message }),
    }),
  );
}

async function describedError(page: Page, inputId: string): Promise<Locator> {
  const input = page.locator(`#${inputId}`);
  const id = await input.getAttribute("aria-describedby");
  expect(id).toBeTruthy();
  return page.locator(`[id="${id}"]`);
}

async function focusRing(locator: Locator) {
  return locator.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      width: cs.outlineWidth,
      style: cs.outlineStyle,
      color: cs.outlineColor,
      offset: cs.outlineOffset,
    };
  });
}

async function mockVerify(page: Page, status: number): Promise<void> {
  await page.route(`${API}/auth/verify*`, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(
        status === 200 ? { status: "ok" } : { error: "INVALID_TOKEN", message: "Invalid token" },
      ),
    }),
  );
}

for (const vp of VIEWPORTS) {
  test.describe(`Auth identity at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("login: ember title band above a paper panel with a 2px ink edge, Overpass title", async ({
      page,
    }, testInfo) => {
      await page.goto("/login");

      const title = page.getByRole("heading", { level: 1 });
      await expect(title).toHaveCount(1);
      expect(await opaqueBackground(title)).toBe(EMBER_RGB);
      await expect(title).toHaveCSS("color", INK_RGB);
      expect(await title.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Overpass");

      const form = page.getByRole("form");
      const panelBg = await opaqueBackground(form);
      expect(panelBg).toBe(PAPER_RGB);

      const panel = form.locator("xpath=ancestor::*[contains(@class,'bg-surface-raised')][1]");
      await expect(panel).toHaveCSS("background-color", PAPER_RGB);
      await expect(panel).toHaveCSS("border-top-width", "2px");
      await expect(panel).toHaveCSS("border-top-color", INK_RGB);

      const titleBox = await box(title);
      const panelBox = await box(panel);
      expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(panelBox.y);
      expectInsideViewport(page, titleBox);
      expectInsideViewport(page, panelBox);

      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `login-${vp.name}`);
    });

    test("register: same composition with a stone footer row holding an underlined /login link", async ({
      page,
    }, testInfo) => {
      await page.goto("/register");

      const title = page.getByRole("heading", { level: 1 });
      await expect(title).toHaveCount(1);
      expect(await opaqueBackground(title)).toBe(EMBER_RGB);

      const link = page.getByRole("link", { name: "Log in" }).last();
      await expect(link).toHaveAttribute("href", "/login");
      expect(await opaqueBackground(link)).toBe(STONE_RGB);
      expect(await link.evaluate((el) => getComputedStyle(el).textDecorationLine)).toContain(
        "underline",
      );
      expect((await box(link)).height).toBeGreaterThanOrEqual(44);

      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `register-${vp.name}`);
    });

    test("login: field error is a 4px solid danger-ruled bold message on paper, never on orange", async ({
      page,
    }, testInfo) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /log in/i }).click();

      const error = await describedError(page, "email");
      await expect(error).toBeVisible();
      await expect(error).toHaveCSS("border-left-width", "4px");
      await expect(error).toHaveCSS("border-left-style", "solid");
      await expect(error).toHaveCSS("border-left-color", DANGER_RGB);
      await expect(error).toHaveCSS("font-size", "14px");
      await expect(error).toHaveCSS("font-weight", "700");
      await expect(error).toHaveCSS("color", DANGER_RGB);
      expect(await opaqueBackground(error)).toBe(PAPER_RGB);

      for (const target of [
        page.locator("#email"),
        page.locator("#password"),
        page.getByText("Email", { exact: true }),
        page.getByText("Password", { exact: true }),
        error,
      ]) {
        await expectNotOnOrange(target);
      }

      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `login-field-errors-${vp.name}`);
    });

    test("login: long server error is one solid danger alert panel above the submit", async ({
      page,
    }, testInfo) => {
      await mockLoginFailure(page, LONG_MESSAGE);
      await page.goto("/login");
      await page.locator("#email").fill("someone@example.com");
      await page.locator("#password").fill("password1234");
      await page.getByRole("button", { name: /log in/i }).click();

      const alert = page.getByRole("alert");
      await expect(alert).toHaveCount(1);
      await expect(alert).toContainText("That email and password combination");
      await expect(alert).toHaveCSS("border-top-style", "solid");
      await expect(alert).toHaveCSS("border-top-width", "2px");
      await expect(alert).toHaveCSS("border-top-color", DANGER_RGB);
      await expect(alert).toHaveCSS("background-color", DANGER_BG_RGB);

      const alertBox = await box(alert);
      const submitBox = await box(page.getByRole("button", { name: /log in/i }));
      const panelBox = await box(
        page
          .getByRole("form")
          .locator("xpath=ancestor::*[contains(@class,'bg-surface-raised')][1]"),
      );
      expect(alertBox.y + alertBox.height).toBeLessThanOrEqual(submitBox.y);
      expect(alertBox.x).toBeGreaterThanOrEqual(panelBox.x);
      expect(alertBox.x + alertBox.width).toBeLessThanOrEqual(panelBox.x + panelBox.width);
      expectInsideViewport(page, alertBox);
      await expectNotOnOrange(alert);

      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `login-server-error-${vp.name}`);
    });

    test("verify email: pending is a dashed stone panel with a dashed tile", async ({
      page,
    }, testInfo) => {
      let release: () => void = () => {};
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(`${API}/auth/verify*`, async (route) => {
        await gate;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "ok" }),
        });
      });
      await page.goto("/verify-email?token=abc");

      const panel = page.locator('[data-state="pending"]');
      await expect(panel).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(panel).toHaveCSS("border-top-style", "dashed");
      await expect(panel).toHaveCSS("border-top-width", "2px");
      await expect(panel).toHaveCSS("background-color", STONE_RGB);
      await expect(panel.locator('[aria-hidden="true"]').first()).toHaveCSS(
        "border-top-style",
        "dashed",
      );

      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `verify-pending-${vp.name}`);
      release();
    });

    test("verify email: success is an ember panel with a solid ink edge and an ink tile", async ({
      page,
    }, testInfo) => {
      await mockVerify(page, 200);
      await page.goto("/verify-email?token=abc");

      const panel = page.locator('[data-state="success"]');
      await expect(panel).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(panel).toHaveCSS("background-color", EMBER_RGB);
      await expect(panel).toHaveCSS("border-top-style", "solid");
      await expect(panel).toHaveCSS("border-top-width", "2px");
      await expect(panel).toHaveCSS("border-top-color", INK_RGB);
      await expect(panel).toHaveCSS("color", INK_RGB);
      await expect(panel.locator('[aria-hidden="true"]').first()).toHaveCSS(
        "background-color",
        INK_RGB,
      );

      await expectNoHorizontalOverflow(page);
      await attachScreenshot(page, testInfo, `verify-success-${vp.name}`);
    });

    for (const scenario of [
      { name: "rejected token", url: "/verify-email?token=bad", reject: true },
      { name: "no token", url: "/verify-email", reject: false },
    ]) {
      test(`verify email: error (${scenario.name}) is a paper panel with an outlined danger tile`, async ({
        page,
      }, testInfo) => {
        if (scenario.reject) await mockVerify(page, 500);
        await page.goto(scenario.url);

        const panel = page.locator('[data-state="error"]');
        await expect(panel).toBeVisible();
        await expect(panel).toHaveAttribute("role", "alert");
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        await expect(panel).toHaveCSS("background-color", PAPER_RGB);
        await expect(panel).toHaveCSS("border-top-style", "solid");
        await expect(panel).toHaveCSS("border-top-width", "2px");
        await expect(panel).toHaveCSS("border-top-color", INK_RGB);

        const tile = panel.locator('[aria-hidden="true"]').first();
        await expect(tile).toHaveCSS("border-top-style", "solid");
        await expect(tile).toHaveCSS("border-top-width", "2px");
        await expect(tile).toHaveCSS("border-top-color", DANGER_RGB);

        await expectNoHorizontalOverflow(page);
        await attachScreenshot(page, testInfo, `verify-error-${scenario.name}-${vp.name}`);
      });
    }

    test("register: Tab order is email, password, confirm, submit, log-in link with a 3px ink focus ring", async ({
      page,
    }) => {
      await page.goto("/register");
      await page.locator("#email").fill("newuser@example.com");
      await page.locator("#password").fill("validpass123");
      await page.locator("#confirmPassword").fill("validpass123");
      const submit = page.getByRole("button", { name: /create account/i });
      await expect(submit).toBeEnabled();

      await page.locator("#email").focus();
      await page.keyboard.press("Tab");
      await expect(page.locator("#password")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.locator("#confirmPassword")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(submit).toBeFocused();
      const submitRing = await focusRing(submit);
      expect(submitRing).toMatchObject({ width: "3px", style: "solid", color: INK_RGB });

      await page.keyboard.press("Tab");
      const link = page.getByRole("link", { name: "Log in" }).last();
      await expect(link).toBeFocused();
      expect(await focusRing(link)).toMatchObject({ width: "3px", style: "solid", color: INK_RGB });
      expect((await box(link)).y).toBeGreaterThan((await box(submit)).y);
      expect(await link.evaluate((el) => getComputedStyle(el).textDecorationLine)).toContain(
        "underline",
      );
      expect((await box(link)).height).toBeGreaterThanOrEqual(44);
    });

    test("verify email: the success action is an ink-filled primary link", async ({ page }) => {
      await mockVerify(page, 200);
      await page.goto("/verify-email?token=abc");

      const link = page.locator('[data-state="success"]').getByRole("link", { name: "Log in" });
      await expect(link).toHaveAttribute("href", "/login");
      await expect(link).toHaveCSS("background-color", INK_RGB);
      await expect(link).toHaveCSS("color", PAPER_RGB);
      await expect(link).toHaveCSS("border-top-width", "2px");
      expect((await box(link)).height).toBeGreaterThanOrEqual(44);
    });
  });
}

test.describe("Auth identity first viewport at 360x800", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("login: title, both fields and the submit are visible without scrolling", async ({
    page,
  }) => {
    await page.goto("/login");
    const targets = [
      page.getByRole("heading", { level: 1 }),
      page.locator("#email"),
      page.locator("#password"),
      page.getByRole("button", { name: /log in/i }),
    ];
    for (const target of targets) {
      const b = await box(target);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y + b.height).toBeLessThanOrEqual(800);
    }
  });
});
