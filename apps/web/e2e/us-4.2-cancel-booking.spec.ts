import { test, expect, type Page } from "@playwright/test";

const API = "http://localhost:3000";
const BOOKING_ID = "booking-1";

const CONFIRMED_BOOKING = {
  id: BOOKING_ID,
  listingId: "listing-1",
  listing: { title: "Sunny Loft in Lisbon" },
  checkIn: "2027-08-01",
  checkOut: "2027-08-04",
  status: "CONFIRMED",
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
}

function mockBookings(page: Page, bookings: object[]) {
  return page.route(`${API}/bookings/me*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: bookings, total: bookings.length, page: 1, limit: 20 }),
    }),
  );
}

test.describe("US-4.2 — Guest cancels a booking", () => {
  test("shows Cancel button for a confirmed future booking", async ({ page }) => {
    await mockGuestSession(page);
    await mockBookings(page, [CONFIRMED_BOOKING]);
    await page.goto("/bookings");
    await expect(page.getByText("Sunny Loft in Lisbon")).toBeVisible();
    await expect(page.getByRole("button", { name: /^cancel$/i })).toBeVisible();
  });

  test("opens cancel modal on Cancel click", async ({ page }) => {
    await mockGuestSession(page);
    await mockBookings(page, [CONFIRMED_BOOKING]);
    await page.goto("/bookings");
    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(page.getByRole("heading", { name: /cancel booking/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /yes, cancel/i })).toBeVisible();
  });

  test("confirms cancellation and updates status badge", async ({ page }) => {
    await mockGuestSession(page);
    let cancelled = false;
    await page.route(`${API}/bookings/me*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [cancelled ? { ...CONFIRMED_BOOKING, status: "CANCELLED" } : CONFIRMED_BOOKING],
          total: 1,
          page: 1,
          limit: 20,
        }),
      }),
    );
    await page.route(`${API}/bookings/${BOOKING_ID}/cancel`, (route) => {
      cancelled = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...CONFIRMED_BOOKING, status: "CANCELLED" }),
      });
    });
    await page.goto("/bookings");
    await page.getByRole("button", { name: /^cancel$/i }).click();
    await page.getByRole("button", { name: /yes, cancel/i }).click();
    await expect(page.getByText("Cancelled")).toBeVisible();
  });
});
