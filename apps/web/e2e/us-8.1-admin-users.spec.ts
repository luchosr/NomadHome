import { test, expect, type Locator, type Page } from "@playwright/test";

const API = "http://localhost:3000";
const USER_ID = "user-1";

const ACTIVE_USER = {
  id: USER_ID,
  email: "user@test.com",
  roles: ["guest"],
  disabledAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

async function mockAdminSession(page: Page) {
  try {
    await page.addInitScript(() => localStorage.setItem("nh_refresh_token", "test-token"));
    await page.route(`${API}/auth/refresh`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "test-access",
          refreshToken: "test-token-2",
          user: { id: "admin-1", email: "admin@test.com", roles: ["admin"] },
        }),
      }),
    );
  } catch (err) {
    throw new Error(`mockAdminSession setup failed: ${String(err)}`);
  }
}

test.describe("US-8.1 — Admin manages users", () => {
  test("shows users table with email and Disable button", async ({ page }) => {
    await mockAdminSession(page);
    await page.route(`${API}/admin/users*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [ACTIVE_USER], total: 1, page: 1, limit: 50 }),
      }),
    );
    await page.goto("/admin/users");
    // Table and cards are both in the DOM (one is display: none): keep the visible match.
    await expect(page.getByText("user@test.com").filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /disable/i })).toBeVisible();
  });

  test("shows Disabled badge after disabling a user", async ({ page }) => {
    await mockAdminSession(page);
    const DISABLED_USER = { ...ACTIVE_USER, disabledAt: new Date().toISOString() };
    let disabled = false;
    await page.route(`${API}/admin/users*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [disabled ? DISABLED_USER : ACTIVE_USER],
          total: 1,
          page: 1,
          limit: 50,
        }),
      }),
    );
    await page.route(`${API}/admin/users/${USER_ID}/disable`, (route) => {
      disabled = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DISABLED_USER),
      });
    });
    await page.goto("/admin/users");
    await page.getByRole("button", { name: /disable/i }).click();
    await expect(page.getByText("Disabled").filter({ visible: true })).toBeVisible();
  });

  test("shows an alert and re-enables the button when disabling a user fails", async ({ page }) => {
    await mockAdminSession(page);
    await page.route(`${API}/admin/users*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [ACTIVE_USER], total: 1, page: 1, limit: 50 }),
      }),
    );
    await page.route(`${API}/admin/users/${USER_ID}/disable`, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Could not disable right now" }),
      }),
    );
    await page.goto("/admin/users");
    const disable = page.getByRole("button", { name: /disable/i });
    await disable.click();
    await expect(page.getByRole("alert")).toContainText("Could not disable right now");
    await expect(disable).toBeEnabled();
    await expect(page.getByText("Disabled").filter({ visible: true })).toHaveCount(0);
  });

  const KEYBOARD_CASES = [
    { action: "Disable", opposite: "Re-enable", endpoint: "disable", startsDisabled: false },
    { action: "Re-enable", opposite: "Disable", endpoint: "enable", startsDisabled: true },
  ].flatMap((testCase) => ["Enter", "Space"].map((key) => ({ ...testCase, key })));

  for (const { action, opposite, endpoint, startsDisabled, key } of KEYBOARD_CASES) {
    test(`${key} on ${action} sends one request and shows ${opposite}`, async ({ page }) => {
      await mockAdminSession(page);
      let disabled = startsDisabled;
      const patches: string[] = [];
      page.on("request", (request) => {
        if (request.method() === "PATCH") patches.push(request.url());
      });
      await page.route(`${API}/admin/users*`, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [{ ...ACTIVE_USER, disabledAt: disabled ? "2026-01-02T00:00:00.000Z" : null }],
            total: 1,
            page: 1,
            limit: 50,
          }),
        }),
      );
      await page.route(`${API}/admin/users/${USER_ID}/${endpoint}`, (route) => {
        disabled = !startsDisabled;
        return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      });
      await page.goto("/admin/users");

      const button = page.getByRole("button", { name: action, exact: true });
      await button.focus();
      await expect(button).toBeFocused();
      await page.keyboard.press(key);

      await expect(page.getByRole("button", { name: opposite, exact: true })).toBeEnabled();
      expect(patches).toEqual([`${API}/admin/users/${USER_ID}/${endpoint}`]);
    });
  }
});

const LAYOUTS = [
  { layout: "table", width: 1280, height: 720 },
  { layout: "cards", width: 360, height: 800 },
];

const MODERATION_CASES = [
  { action: "Disable", opposite: "Re-enable", endpoint: "disable", startsDisabled: false },
  { action: "Re-enable", opposite: "Disable", endpoint: "enable", startsDisabled: true },
];

const ACTION_ERROR = "Could not moderate right now";

type ModerationCase = (typeof MODERATION_CASES)[number];

/** Mocks the list and both PATCH endpoints; with `hold`, a PATCH waits for `release(status)`. */
async function mockModeration(page: Page, startsDisabled: boolean, { hold = true } = {}) {
  let disabled = startsDisabled;
  let release: (status: number) => void = () => {};
  const held = new Promise<number>((resolve) => {
    release = resolve;
  });
  const patches: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH") patches.push(new URL(request.url()).pathname);
  });
  await mockAdminSession(page);
  await page.route(`${API}/admin/users*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [{ ...ACTIVE_USER, disabledAt: disabled ? "2026-01-02T00:00:00.000Z" : null }],
        total: 1,
        page: 1,
        limit: 50,
      }),
    }),
  );
  for (const endpoint of ["disable", "enable"]) {
    await page.route(`${API}/admin/users/${USER_ID}/${endpoint}`, async (route) => {
      const status = hold ? await held : 200;
      if (status === 200) disabled = endpoint === "disable";
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(status === 200 ? {} : { message: ACTION_ERROR }),
      });
    });
  }
  return { patches, release: (status: number) => release(status) };
}

const patchPath = (endpoint: string) => `/admin/users/${USER_ID}/${endpoint}`;

const actionButton = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

/** Opens the page, focuses the row action and starts counting how often it loses focus. */
async function focusAction(page: Page, name: string) {
  await page.goto("/admin/users");
  const button = actionButton(page, name);
  await button.focus();
  await expect(button).toBeFocused();
  const handle = await button.elementHandle();
  if (!handle) throw new Error(`No ${name} button`);
  await handle.evaluate((el) => {
    el.dataset.blurs = "0";
    el.addEventListener("blur", () => {
      el.dataset.blurs = String(Number(el.dataset.blurs) + 1);
    });
  });
  return { button, handle };
}

type ActionHandle = Awaited<ReturnType<typeof focusAction>>["handle"];

/** The original element is still mounted, focused and never blurred. */
async function expectNeverBlurred(handle: ActionHandle) {
  const state = await handle.evaluate((el) => ({
    connected: el.isConnected,
    focused: document.activeElement === el,
    blurs: el.dataset.blurs,
  }));
  expect(state).toEqual({ connected: true, focused: true, blurs: "0" });
}

async function expectPending(button: Locator) {
  await expect(button).toHaveAttribute("aria-disabled", "true");
  await expect(button).not.toHaveAttribute("disabled");
  await expect(button).toBeFocused();
}

test.describe("US-8.1 — moderation keeps focus (NH-146)", () => {
  for (const { layout, width, height } of LAYOUTS) {
    test.describe(`${layout} at ${width}x${height}`, () => {
      test.use({ viewport: { width, height } });

      for (const { action, opposite, endpoint, startsDisabled } of MODERATION_CASES) {
        for (const key of ["Enter", "Space"]) {
          test(`${key} on ${action} keeps focus while pending and after success`, async ({
            page,
          }) => {
            const api = await mockModeration(page, startsDisabled);
            const { button, handle } = await focusAction(page, action);
            await expect(page.getByRole("table")).toHaveCount(layout === "table" ? 1 : 0);

            await page.keyboard.press(key);
            await expectPending(button);
            await page.keyboard.press("Enter");
            await page.keyboard.press("Space");
            await expectPending(button);
            await expectNeverBlurred(handle);
            expect(api.patches).toEqual([patchPath(endpoint)]);

            api.release(200);
            const next = actionButton(page, opposite);
            await expect(next).toBeFocused();
            await expect(next).not.toHaveAttribute("aria-disabled", "true");
            expect(await next.evaluate((el, original) => el === original, handle)).toBe(true);
            await expectNeverBlurred(handle);
            expect(api.patches).toEqual([patchPath(endpoint)]);
          });
        }

        test(`${action} keeps focus when the request fails`, async ({ page }) => {
          const api = await mockModeration(page, startsDisabled);
          const { button, handle } = await focusAction(page, action);

          await page.keyboard.press("Enter");
          await expectPending(button);
          api.release(500);

          await expect(page.getByRole("alert")).toContainText(ACTION_ERROR);
          await expect(button).not.toHaveAttribute("aria-disabled", "true");
          await expect(button).toBeFocused();
          expect(await button.evaluate((el, original) => el === original, handle)).toBe(true);
          await expectNeverBlurred(handle);
          expect(api.patches).toEqual([patchPath(endpoint)]);
        });
      }
    });
  }
});

type KeyRecord = { key: string; repeat: boolean; prevented: boolean };

/** Records every keydown after the app's own handlers have run. */
async function recordKeydowns(page: Page) {
  await page.evaluate(() => {
    const log: string[] = [];
    window.addEventListener("keydown", (event) => {
      log.push(
        JSON.stringify({
          key: event.key,
          repeat: event.repeat,
          prevented: event.defaultPrevented,
        }),
      );
      document.body.dataset.keydowns = `[${log.join(",")}]`;
    });
  });
  return async () =>
    JSON.parse((await page.locator("body").getAttribute("data-keydowns")) ?? "[]") as KeyRecord[];
}

test.describe("US-8.1 — moderation ignores key repeat (NH-146)", () => {
  const heldCase = ({ action, opposite, endpoint, startsDisabled }: ModerationCase) => {
    const back = endpoint === "disable" ? "enable" : "disable";

    for (const nextKey of ["Enter", "Space"]) {
      test(`holding Enter on ${action} sends one request, then ${nextKey} sends one`, async ({
        page,
      }) => {
        const api = await mockModeration(page, startsDisabled, { hold: false });
        const { handle } = await focusAction(page, action);
        const keydowns = await recordKeydowns(page);

        await page.keyboard.down("Enter");
        await expect(actionButton(page, opposite)).toBeFocused();
        await page.keyboard.down("Enter");
        await page.keyboard.down("Enter");

        expect(await keydowns()).toEqual([
          { key: "Enter", repeat: false, prevented: false },
          { key: "Enter", repeat: true, prevented: true },
          { key: "Enter", repeat: true, prevented: true },
        ]);
        await expect(actionButton(page, opposite)).toBeFocused();
        expect(api.patches).toEqual([patchPath(endpoint)]);

        await page.keyboard.up("Enter");
        await page.keyboard.press(nextKey);
        await expect(actionButton(page, action)).toBeFocused();
        await expectNeverBlurred(handle);
        expect(api.patches).toEqual([patchPath(endpoint), patchPath(back)]);
      });
    }

    test(`holding Space on ${action} sends exactly one request on release`, async ({ page }) => {
      const api = await mockModeration(page, startsDisabled, { hold: false });
      const { handle } = await focusAction(page, action);
      const keydowns = await recordKeydowns(page);

      await page.keyboard.down("Space");
      await page.keyboard.down("Space");
      await page.keyboard.down("Space");
      expect((await keydowns()).map(({ repeat, prevented }) => [repeat, prevented])).toEqual([
        [false, false],
        [true, true],
        [true, true],
      ]);
      expect(api.patches).toEqual([]);

      await page.keyboard.up("Space");
      await expect(actionButton(page, opposite)).toBeFocused();
      await expectNeverBlurred(handle);
      expect(api.patches).toEqual([patchPath(endpoint)]);
    });
  };

  MODERATION_CASES.forEach(heldCase);
});

const PENDING_LOOK = {
  borderStyle: "dashed",
  borderColor: "rgb(111, 106, 99)",
  background: "rgb(229, 226, 221)",
  color: "rgb(87, 83, 78)",
  cursor: "default",
  pointerEvents: "auto",
  offsetY: 0,
};

const readLook = (button: Locator) =>
  button.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      borderStyle: style.borderTopStyle,
      borderColor: style.borderTopColor,
      background: style.backgroundColor,
      color: style.color,
      cursor: style.cursor,
      pointerEvents: style.pointerEvents,
      offsetY: style.transform === "none" ? 0 : new DOMMatrix(style.transform).m42,
    };
  });

test.describe("US-8.1 — pending moderation button styles (NH-146)", () => {
  for (const { action, endpoint, startsDisabled } of MODERATION_CASES) {
    test(`pending ${action} looks disabled and is inert to hover and press`, async ({ page }) => {
      const api = await mockModeration(page, startsDisabled);
      const { button, handle } = await focusAction(page, action);
      // Colour transitions would make the computed values time dependent.
      await page.addStyleTag({ content: "*, *::before { transition: none !important; }" });
      await page.keyboard.press("Enter");
      await expectPending(button);

      await page.mouse.move(0, 0);
      expect(await readLook(button)).toEqual(PENDING_LOOK);

      await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      if (!box) throw new Error(`No box for ${action}`);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      expect(await button.evaluate((el) => el.matches(":hover"))).toBe(true);
      expect(await readLook(button)).toEqual(PENDING_LOOK);

      await page.mouse.down();
      expect(await button.evaluate((el) => el.matches(":active"))).toBe(true);
      expect(await readLook(button)).toEqual(PENDING_LOOK);
      await page.mouse.up();

      await expectPending(button);
      await expectNeverBlurred(handle);
      expect(api.patches).toEqual([patchPath(endpoint)]);

      api.release(200);
      await expect(page.locator('button[aria-disabled="true"]')).toHaveCount(0);
      expect(api.patches).toEqual([patchPath(endpoint)]);
    });
  }
});
