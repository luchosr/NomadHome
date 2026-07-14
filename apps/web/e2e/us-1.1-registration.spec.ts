import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";

test.describe("US-1.1 — Guest registration", () => {
  test("renders email, password, confirm-password fields and submit", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("shows error when passwords do not match", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel(/email/i).fill("new@test.com");
    await page.getByLabel(/^password$/i).fill("password1234");
    await page.getByLabel(/confirm password/i).fill("different1234");
    await page.getByLabel(/^password$/i).blur();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("shows error on duplicate email (409)", async ({ page }) => {
    await page.route(`${API}/auth/register`, (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "email_taken" }),
      }),
    );
    await page.goto("/register");
    await page.getByLabel(/email/i).fill("existing@test.com");
    await page.getByLabel(/^password$/i).fill("password1234");
    await page.getByLabel(/confirm password/i).fill("password1234");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("redirects to home on successful registration", async ({ page }) => {
    await page.route(`${API}/auth/register`, (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "test-access",
          refreshToken: "test-refresh",
          user: { id: "u1", email: "new@test.com", roles: ["guest"] },
        }),
      }),
    );
    await page.goto("/register");
    await page.getByLabel(/email/i).fill("new@test.com");
    await page.getByLabel(/^password$/i).fill("password1234");
    await page.getByLabel(/confirm password/i).fill("password1234");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL("/");
  });
});
