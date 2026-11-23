import { test, expect, type Page } from "@playwright/test";

const API = "http://localhost:3000";
const LISTING_ID = "listing-1";
const HTTP_OK = 200;
const PAGE = 1;
const PAGE_LIMIT = 50;

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
      status: HTTP_OK,
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
        body: JSON.stringify({ data: [ACTIVE_LISTING], total: 1, page: PAGE, limit: PAGE_LIMIT }),
      }),
    );
    await page.goto("/admin/listings");
    // Table and cards are both in the DOM (one is display: none): keep the visible match.
    await expect(page.getByText("Sunny Loft in Lisbon").filter({ visible: true })).toBeVisible();
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
          page: PAGE,
          limit: PAGE_LIMIT,
        }),
      }),
    );
    await page.route(`${API}/admin/listings/${LISTING_ID}/disable`, (route) => {
      disabled = true;
      return route.fulfill({
        status: HTTP_OK,
        contentType: "application/json",
        body: JSON.stringify(DISABLED_LISTING),
      });
    });
    await page.goto("/admin/listings");
    await page.getByRole("button", { name: /disable/i }).click();
    await expect(
      page.getByRole("button", { name: /re-enable/i }).filter({ visible: true }),
    ).toBeVisible();
  });

  test("shows an alert and re-enables the button when disabling a listing fails", async ({
    page,
  }) => {
    await mockAdminSession(page);
    await page.route(`${API}/admin/listings*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [ACTIVE_LISTING], total: 1, page: 1, limit: 50 }),
      }),
    );
    await page.route(`${API}/admin/listings/${LISTING_ID}/disable`, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Could not disable right now" }),
      }),
    );
    await page.goto("/admin/listings");
    const disable = page.getByRole("button", { name: /disable/i });
    await disable.click();
    await expect(page.getByRole("alert")).toContainText("Could not disable right now");
    await expect(disable).toBeEnabled();
    await expect(page.getByText("Disabled").filter({ visible: true })).toHaveCount(0);
  });
});
