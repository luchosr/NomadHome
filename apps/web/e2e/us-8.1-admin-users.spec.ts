import { test, expect, type Page } from "@playwright/test";

const API = "http://localhost:3000";
const USER_ID = "user-1";

const ACTIVE_USER = {
  id: USER_ID,
  email: "user@test.com",
  roles: ["guest"],
  disabledAt: null,
};

async function mockAdminSession(page: Page) {
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
    await expect(page.getByText("user@test.com")).toBeVisible();
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
    await expect(page.getByText("Disabled")).toBeVisible();
  });
});
