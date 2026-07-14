import { test, expect, type Page } from "@playwright/test";

const API = "http://localhost:3000";

async function mockAuthenticatedSession(page: Page) {
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

test.describe("Login", () => {
  test("renders email, password fields and submit button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
  });

  test("shows error message on invalid credentials", async ({ page }) => {
    await page.route(`${API}/auth/login`, (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "invalid_credentials" }),
      }),
    );
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("bad@test.com");
    await page.getByLabel(/^password$/i).fill("wrongpassword");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("redirects to home on successful login", async ({ page }) => {
    await page.route(`${API}/auth/login`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "test-access",
          refreshToken: "test-refresh",
          user: { id: "u1", email: "guest@test.com", roles: ["guest"] },
        }),
      }),
    );
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("guest@test.com");
    await page.getByLabel(/^password$/i).fill("password1234");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("Protected routes", () => {
  test("redirects /bookings to /login when not authenticated", async ({ page }) => {
    await page.goto("/bookings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("renders /bookings when authenticated", async ({ page }) => {
    await mockAuthenticatedSession(page);
    await page.route(`${API}/bookings/me*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], total: 0, page: 1, limit: 20 }),
      }),
    );
    await page.goto("/bookings");
    await expect(page.getByRole("heading", { name: /my bookings/i })).toBeVisible();
  });
});
