import { test, expect, type Page } from "@playwright/test";
import type { BookingWithListing } from "../src/api/bookings.js";

const BOOKING_ID = "booking-1";

const CONFIRMED_BOOKING = {
  id: BOOKING_ID,
  listingId: "listing-1",
  guestId: "guest-1",
  hostId: "host-1",
  listing: { title: "Sunny Loft in Lisbon" },
  checkIn: "2027-08-01",
  checkOut: "2027-08-04",
  nightlyRateCents: 7500,
  totalCents: 22500,
  status: "CONFIRMED" as const,
  cancellationReason: null,
  createdAt: "2027-01-01T00:00:00.000Z",
} satisfies BookingWithListing;

async function mockGuestSession(page: Page) {
  try {
    const refreshToken = crypto.randomUUID();
    const accessToken = crypto.randomUUID();
    const nextRefreshToken = crypto.randomUUID();
    await page.addInitScript(
      (token) => localStorage.setItem("nh_refresh_token", token),
      refreshToken,
    );
    await page.route("**/auth/refresh", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken,
          refreshToken: nextRefreshToken,
          user: { id: crypto.randomUUID(), email: "guest@test.com", roles: ["guest"] },
        }),
      }),
    );
  } catch (err) {
    throw new Error(`mockGuestSession setup failed: ${String(err)}`);
  }
}

function mockBookings(page: Page, bookings: BookingWithListing[]) {
  return page.route("**/bookings/me*", (route) =>
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
    const bookingCard = page.locator(".rounded-card", { hasText: "Sunny Loft in Lisbon" });
    await expect(bookingCard.getByText("Sunny Loft in Lisbon")).toBeVisible();
    await expect(bookingCard.getByRole("button", { name: /^cancel$/i })).toBeVisible();
  });

  test("opens cancel modal on Cancel click", async ({ page }) => {
    await mockGuestSession(page);
    await mockBookings(page, [CONFIRMED_BOOKING]);
    await page.goto("/bookings");
    const bookingCard = page.locator(".rounded-card", { hasText: "Sunny Loft in Lisbon" });
    await bookingCard.getByRole("button", { name: /^cancel$/i }).click();
    await expect(page.getByRole("heading", { name: /cancel booking/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /yes, cancel/i })).toBeVisible();
  });

  test("confirms cancellation and updates status badge", async ({ page }) => {
    await mockGuestSession(page);
    const cancelled = { current: false };
    await page.route("**/bookings/me*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            cancelled.current ? { ...CONFIRMED_BOOKING, status: "CANCELLED" } : CONFIRMED_BOOKING,
          ],
          total: 1,
          page: 1,
          limit: 20,
        }),
      }),
    );
    await page.route(`**/bookings/${BOOKING_ID}/cancel`, (route) => {
      cancelled.current = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...CONFIRMED_BOOKING, status: "CANCELLED" }),
      });
    });
    await page.goto("/bookings");
    const bookingCard = page.locator(".rounded-card", { hasText: "Sunny Loft in Lisbon" });
    await bookingCard.getByRole("button", { name: /^cancel$/i }).click();
    await page.getByRole("button", { name: /yes, cancel/i }).click();
    await expect(bookingCard.getByText("Cancelled")).toBeVisible();
  });
});
