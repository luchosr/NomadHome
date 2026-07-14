import { test, expect, type Page } from "@playwright/test";

const API = "http://localhost:3000";
const LISTING_ID = "listing-1";

const DRAFT_LISTING = {
  id: LISTING_ID,
  title: "My Space",
  description: "A great space",
  type: "PROPERTY",
  city: "Lisbon",
  country: "PT",
  addressLine: "Rua do Ouro 123",
  capacity: 4,
  nightlyRateCents: 7500,
  currency: "EUR",
  status: "DRAFT",
  amenities: [],
};

async function mockHostSession(page: Page) {
  await page.addInitScript(() => localStorage.setItem("nh_refresh_token", "test-token"));
  await page.route(`${API}/auth/refresh`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "test-access",
        refreshToken: "test-token-2",
        user: { id: "u1", email: "host@test.com", roles: ["guest", "host"] },
      }),
    }),
  );
  await page.route(`${API}/listings/${LISTING_ID}/photos`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) }),
  );
  await page.route(`${API}/listings/${LISTING_ID}/availability`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) }),
  );
}

test.describe("US-2.2 — Host publishes a listing", () => {
  test("shows Draft badge and Publish button for a draft listing", async ({ page }) => {
    await mockHostSession(page);
    await page.route(`${API}/listings/${LISTING_ID}/manage`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DRAFT_LISTING),
      }),
    );
    await page.goto(`/host/listings/${LISTING_ID}/edit`);
    await expect(page.getByText("Draft")).toBeVisible();
    await expect(page.getByRole("button", { name: /publish/i })).toBeVisible();
  });

  test("shows Published badge after publishing", async ({ page }) => {
    await mockHostSession(page);
    let published = false;
    await page.route(`${API}/listings/${LISTING_ID}/manage`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(published ? { ...DRAFT_LISTING, status: "PUBLISHED" } : DRAFT_LISTING),
      }),
    );
    await page.route(`${API}/listings/${LISTING_ID}/publish`, (route) => {
      published = true;
      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.goto(`/host/listings/${LISTING_ID}/edit`);
    await page.getByRole("button", { name: /publish/i }).click();
    await expect(page.getByText("Published")).toBeVisible();
  });

  test("shows Unpublish button for a published listing", async ({ page }) => {
    await mockHostSession(page);
    await page.route(`${API}/listings/${LISTING_ID}/manage`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...DRAFT_LISTING, status: "PUBLISHED" }),
      }),
    );
    await page.goto(`/host/listings/${LISTING_ID}/edit`);
    await expect(page.getByRole("button", { name: /unpublish/i })).toBeVisible();
  });
});
