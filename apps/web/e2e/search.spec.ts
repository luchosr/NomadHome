import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";

const MOCK_LISTING = {
  id: "listing-1",
  title: "Lisbon Studio",
  type: "PROPERTY",
  city: "Lisbon",
  country: "PT",
  nightlyRateCents: 7500,
  currency: "EUR",
  totalCents: 52500,
  primaryPhotoUrl: null,
};

const EMPTY_PAGE = {
  data: [],
  pagination: { total: 0, page: 1, pageSize: 20, hasMore: false },
};

const ONE_RESULT = {
  data: [MOCK_LISTING],
  pagination: { total: 1, page: 1, pageSize: 20, hasMore: false },
};

test.describe("Search", () => {
  test("renders city, check-in, check-out fields and search button", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByLabel(/city/i)).toBeVisible();
    await expect(page.getByLabel(/check-in/i)).toBeVisible();
    await expect(page.getByLabel(/check-out/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^search$/i })).toBeVisible();
  });

  test("searches all listings when city is empty", async ({ page }) => {
    await page.route(`${API}/search*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ONE_RESULT),
      }),
    );
    await page.goto("/search");
    await page.getByRole("button", { name: /^search$/i }).click();
    await expect(page.getByText("Lisbon Studio")).toBeVisible();
  });

  test("renders listing cards after a successful search", async ({ page }) => {
    await page.route(`${API}/search*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ONE_RESULT),
      }),
    );
    await page.goto("/search");
    await page.getByLabel(/city/i).fill("Lisbon");
    await page.getByRole("button", { name: /^search$/i }).click();
    await expect(page.getByText("Lisbon Studio")).toBeVisible();
  });

  test("shows no-results message when search returns empty", async ({ page }) => {
    await page.route(`${API}/search*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(EMPTY_PAGE),
      }),
    );
    await page.goto("/search");
    await page.getByLabel(/city/i).fill("Nowhere");
    await page.getByRole("button", { name: /^search$/i }).click();
    await expect(page.getByText(/no listings found/i)).toBeVisible();
  });

  test("filter panel is hidden by default and appears on Filters click", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByLabel(/^type$/i)).not.toBeVisible();
    await page.getByRole("button", { name: /filters/i }).click();
    await expect(page.getByLabel(/^type$/i)).toBeVisible();
    await expect(page.getByLabel(/min price/i)).toBeVisible();
    await expect(page.getByLabel(/min guests/i)).toBeVisible();
  });
});
