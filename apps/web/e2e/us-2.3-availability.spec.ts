import { test, expect, type Page } from "@playwright/test";

const LISTING_ID = "listing-1";

const LISTING = {
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
  status: "PUBLISHED",
  amenities: [],
};

async function mockHostSession(page: Page) {
  await page.addInitScript(() => localStorage.setItem("nh_refresh_token", "test-token"));
  await page.route("**/auth/refresh", (route) =>
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
  await page.route(`**/listings/${LISTING_ID}/manage`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(LISTING) }),
  );
  await page.route(`**/listings/${LISTING_ID}/photos`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
}

test.describe("US-2.3 — Host manages availability blocks", () => {
  test("shows start and end date inputs and block button", async ({ page }) => {
    await mockHostSession(page);
    await page.route(`**/listings/${LISTING_ID}/availability`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );
    await page.goto(`/host/listings/${LISTING_ID}/edit`);
    await expect(page.getByLabel(/start date/i)).toBeVisible();
    await expect(page.getByLabel(/end date/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /block dates/i })).toBeVisible();
  });

  test("adds a block and shows it in the list", async ({ page }) => {
    await mockHostSession(page);
    let blocks: object[] = [];
    await page.route(`**/listings/${LISTING_ID}/availability`, (route) => {
      if (route.request().method() === "POST") {
        blocks = [{ id: "b1", startDate: "2026-08-01", endDate: "2026-08-07" }];
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(blocks[0]),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(blocks),
      });
    });
    await page.goto(`/host/listings/${LISTING_ID}/edit`);
    await page.getByLabel(/start date/i).fill("2026-08-01");
    await page.getByLabel(/end date/i).fill("2026-08-07");
    await page.getByRole("button", { name: /block dates/i }).click();
    await expect(page.getByText("2026-08-01")).toBeVisible();
  });

  test("shows overlap error when block conflicts", async ({ page }) => {
    await mockHostSession(page);
    await page.route(`**/listings/${LISTING_ID}/availability`, (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            error: "OVERLAP_CONFLICT",
            conflict: { startDate: "2026-08-01", endDate: "2026-08-07" },
          }),
        });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });
    await page.goto(`/host/listings/${LISTING_ID}/edit`);
    await page.getByLabel(/start date/i).fill("2026-08-01");
    await page.getByLabel(/end date/i).fill("2026-08-07");
    await page.getByRole("button", { name: /block dates/i }).click();
    await expect(page.getByRole("alert")).toContainText("OVERLAP_CONFLICT");
  });
});
