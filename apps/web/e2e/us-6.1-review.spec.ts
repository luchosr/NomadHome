import { test, expect, type Page } from "@playwright/test";
import type { BookingWithListing } from "../src/api/bookings.js";

const BOOKING_ID = "booking-1";
const NIGHTLY_RATE_CENTS = 7500;
const TOTAL_CENTS = 22500; // 3 nights × NIGHTLY_RATE_CENTS
const HTTP_OK = 200;
const HTTP_CREATED = 201;
const PAGE = 1;
const PAGE_LIMIT = 20;

const COMPLETED_BOOKING = {
  id: BOOKING_ID,
  listingId: "listing-1",
  guestId: "guest-1",
  hostId: "host-1",
  listing: { title: "Sunny Loft in Lisbon" },
  checkIn: "2026-07-01",
  checkOut: "2026-07-04",
  nightlyRateCents: NIGHTLY_RATE_CENTS,
  totalCents: TOTAL_CENTS,
  status: "COMPLETED" as const,
  cancellationReason: null,
  createdAt: "2026-01-01T00:00:00.000Z",
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
        status: HTTP_OK,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken,
          refreshToken: nextRefreshToken,
          user: { id: crypto.randomUUID(), email: "guest@test.com", roles: ["guest"] },
        }),
      }),
    );
    await page.route("**/bookings/me*", (route) =>
      route.fulfill({
        status: HTTP_OK,
        contentType: "application/json",
        body: JSON.stringify({
          data: [COMPLETED_BOOKING],
          total: 1,
          page: PAGE,
          limit: PAGE_LIMIT,
        }),
      }),
    );
  } catch (err) {
    throw new Error(`mockGuestSession setup failed: ${String(err)}`);
  }
}

test.describe("US-6.1 — Guest leaves a review", () => {
  test("shows Leave a review button for a completed booking", async ({ page }) => {
    await mockGuestSession(page);
    await page.goto("/bookings");
    const bookingCard = page.locator(".rounded-card", { hasText: "Sunny Loft in Lisbon" });
    await expect(bookingCard.getByText("Sunny Loft in Lisbon")).toBeVisible();
    await expect(bookingCard.getByRole("button", { name: /leave a review/i })).toBeVisible();
  });

  test("opens review modal on Leave a review click", async ({ page }) => {
    await mockGuestSession(page);
    await page.goto("/bookings");
    const bookingCard = page.locator(".rounded-card", { hasText: "Sunny Loft in Lisbon" });
    await bookingCard.getByRole("button", { name: /leave a review/i }).click();
    await expect(page.getByRole("heading", { name: /how was your stay/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /submit review/i })).toBeVisible();
  });

  test("submits review after selecting a star rating", async ({ page }) => {
    await mockGuestSession(page);
    await page.route(`**/bookings/${BOOKING_ID}/review`, (route) =>
      route.fulfill({ status: HTTP_CREATED, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/bookings");
    const bookingCard = page.locator(".rounded-card", { hasText: "Sunny Loft in Lisbon" });
    await bookingCard.getByRole("button", { name: /leave a review/i }).click();
    await page.getByRole("button", { name: "5 stars" }).click();
    await page.getByRole("button", { name: /submit review/i }).click();
    await expect(page.getByRole("heading", { name: /how was your stay/i })).not.toBeVisible();
  });
});
