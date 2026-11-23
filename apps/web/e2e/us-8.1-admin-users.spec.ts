import { test, expect, type Page } from "@playwright/test";

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
});
