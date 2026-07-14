import { test, expect, type Page } from "@playwright/test";

const API = "http://localhost:3000";
const BOOKING_ID = "booking-1";

const COMPLETED_BOOKING = {
  id: BOOKING_ID,
  listingId: "listing-1",
  listing: { title: "Sunny Loft in Lisbon" },
  checkIn: "2026-07-01",
  checkOut: "2026-07-04",
  status: "COMPLETED",
  nightlyRateCents: 7500,
  currency: "EUR",
};

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
  await page.route(`${API}/bookings/me*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [COMPLETED_BOOKING], total: 1, page: 1, limit: 20 }),
    }),
  );
}

test.describe("US-6.1 — Guest leaves a review", () => {
  test("shows Leave a review button for a completed booking", async ({ page }) => {
    await mockGuestSession(page);
    await page.goto("/bookings");
    await expect(page.getByText("Sunny Loft in Lisbon")).toBeVisible();
    await expect(page.getByRole("button", { name: /leave a review/i })).toBeVisible();
  });

  test("opens review modal on Leave a review click", async ({ page }) => {
    await mockGuestSession(page);
    await page.goto("/bookings");
    await page.getByRole("button", { name: /leave a review/i }).click();
    await expect(page.getByRole("heading", { name: /how was your stay/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /submit review/i })).toBeVisible();
  });

  test("submits review after selecting a star rating", async ({ page }) => {
    await mockGuestSession(page);
    await page.route(`${API}/bookings/${BOOKING_ID}/review`, (route) =>
      route.fulfill({ status: 201, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/bookings");
    await page.getByRole("button", { name: /leave a review/i }).click();
    await page.getByRole("button", { name: "5 stars" }).click();
    await page.getByRole("button", { name: /submit review/i }).click();
    await expect(page.getByRole("heading", { name: /how was your stay/i })).not.toBeVisible();
  });
});
