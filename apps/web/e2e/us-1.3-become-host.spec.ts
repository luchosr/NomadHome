import { test, expect, type Page } from "@playwright/test";

const API = "http://localhost:3000";

async function mockGuestSession(page: Page) {
  await page.addInitScript(() => localStorage.setItem("nh_refresh_token", "test-token"));
  await page.route(`${API}/auth/refresh`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "test-access",
        refreshToken: "test-token-2",
        user: { id: "u1", email: "guest@test.com", roles: ["guest"] },
      }),
    }),
  );
}

test.describe("US-1.3 — Guest upgrades to host", () => {
  test("renders display name, payout email and terms checkbox", async ({ page }) => {
    await mockGuestSession(page);
    await page.goto("/become-host");
    await expect(page.getByLabel(/display name/i)).toBeVisible();
    await expect(page.getByLabel(/payout email/i)).toBeVisible();
    await expect(page.getByLabel(/terms/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /become a host/i })).toBeVisible();
  });

  test("redirects to host listings on successful submission", async ({ page }) => {
    await mockGuestSession(page);
    await page.route(`${API}/users/me/become-host`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "test-access-2",
          roles: ["guest", "host"],
        }),
      }),
    );
    await page.route(`${API}/listings/host*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      }),
    );
    await page.goto("/become-host");
    await page.getByLabel(/display name/i).fill("My Host Name");
    await page.getByLabel(/payout email/i).fill("host@test.com");
    await page.getByLabel(/terms/i).check();
    await page.getByRole("button", { name: /become a host/i }).click();
    await expect(page).toHaveURL("/host/listings");
  });
});
