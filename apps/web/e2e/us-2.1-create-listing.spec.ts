import { test, expect, type Page } from "@playwright/test";

const API = "http://localhost:3000";

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
}

test.describe("US-2.1 — Host creates a listing", () => {
  test("renders required form fields", async ({ page }) => {
    await mockHostSession(page);
    await page.goto("/host/listings/new");
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.locator("#city")).toBeVisible();
    await expect(page.getByLabel(/nightly rate/i)).toBeVisible();
  });

  test("shows validation error when title is too short", async ({ page }) => {
    await mockHostSession(page);
    await page.goto("/host/listings/new");
    const title = page.getByLabel(/title/i);
    await title.fill("ab");
    await title.blur();
    await expect(page.getByText(/at least 5 characters/i)).toBeVisible();
  });

  test("redirects to edit page on successful creation", async ({ page }) => {
    await mockHostSession(page);
    await page.route(`${API}/listings`, (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: "listing-1", title: "My Space" }),
      }),
    );
    await page.route(`${API}/listings/listing-1/manage`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "listing-1", title: "My Space", status: "DRAFT" }),
      }),
    );
    await page.goto("/host/listings/new");
    await page.getByLabel(/title/i).fill("My Lovely Space");
    await page.getByLabel(/description/i).fill("A wonderful place for digital nomads to work");
    await page.locator("#city").fill("Lisbon");
    await page.getByLabel(/nightly rate/i).fill("75");
    await page.getByLabel(/country/i).selectOption("PT");
    await page.getByLabel(/address/i).fill("Rua do Ouro 123");
    await page.locator("#capacity").fill("4");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL("/host/listings/listing-1/edit");
  });
});
