import { test, expect } from "@playwright/test";
import { mockSession } from "./helpers/auth.js";

test.describe("Login", () => {
  test("renders email, password fields and submit button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
  });

  test("shows error message on invalid credentials", async ({ page }) => {
    await page.route("**/auth/login", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        }),
      }),
    );
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("bad@test.com");
    await page.getByLabel(/^password$/i).fill("wrongpassword");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("redirects to home on successful login", async ({ page }) => {
    await page.route("**/auth/login", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: crypto.randomUUID(),
          refreshToken: crypto.randomUUID(),
          user: { id: crypto.randomUUID(), email: "guest@test.com", roles: ["guest"] },
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
    await mockSession(page, { email: "guest@test.com", roles: ["guest"] });
    await page.route("**/bookings/me*", (route) =>
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
