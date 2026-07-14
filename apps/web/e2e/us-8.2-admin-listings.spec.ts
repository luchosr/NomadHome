import { test, expect, type Page } from "@playwright/test";

const API = "http://localhost:3000";
const LISTING_ID = "listing-1";

const ACTIVE_LISTING = {
  id: LISTING_ID,
  title: "Sunny Loft in Lisbon",
  type: "PROPERTY",
  city: "Lisbon",
  host: { email: "host@test.com" },
  status: "PUBLISHED",
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

test.describe("US-8.2 — Admin disables listings", () => {
  test("shows listings table with title and Disable button", async ({ page }) => {
    await mockAdminSession(page);
    await page.route(`${API}/admin/listings*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [ACTIVE_LISTING], total: 1, page: 1, limit: 50 }),
      }),
    );
    await page.goto("/admin/listings");
    await expect(page.getByText("Sunny Loft in Lisbon")).toBeVisible();
    await expect(page.getByRole("button", { name: /disable/i })).toBeVisible();
  });

  test("shows Disabled badge after disabling a listing", async ({ page }) => {
    await mockAdminSession(page);
    const DISABLED_LISTING = {
      ...ACTIVE_LISTING,
      status: "DISABLED",
      disabledAt: new Date().toISOString(),
    };
    let disabled = false;
    await page.route(`${API}/admin/listings*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [disabled ? DISABLED_LISTING : ACTIVE_LISTING],
          total: 1,
          page: 1,
          limit: 50,
        }),
      }),
    );
    await page.route(`${API}/admin/listings/${LISTING_ID}/disable`, (route) => {
      disabled = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DISABLED_LISTING),
      });
    });
    await page.goto("/admin/listings");
    await page.getByRole("button", { name: /disable/i }).click();
    await expect(page.getByText("Disabled")).toBeVisible();
  });
});
