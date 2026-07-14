import { test, expect, type Page } from "@playwright/test";

const LISTING_ID = "listing-1";
const BOOKING_ID = "booking-1";
const NIGHTLY_RATE_CENTS = 7500;

const LISTING = {
  id: LISTING_ID,
  title: "Sunny Loft in Lisbon",
  nightlyRateCents: NIGHTLY_RATE_CENTS,
  currency: "EUR",
};

async function mockGuestSession(page: Page) {
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
}

test.describe("US-4.1 — Guest books a listing", () => {
  test("shows select-dates message when no dates provided", async ({ page }) => {
    await mockGuestSession(page);
    await page.goto(`/listings/${LISTING_ID}/book`);
    await expect(page.getByText(/select check-in and check-out dates/i)).toBeVisible();
  });

  test("shows price breakdown when dates are provided", async ({ page }) => {
    await mockGuestSession(page);
    await page.route(`**/listings/${LISTING_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(LISTING),
      }),
    );
    await page.goto(`/listings/${LISTING_ID}/book?checkIn=2026-08-01&checkOut=2026-08-04`);
    await expect(page.getByText("Sunny Loft in Lisbon")).toBeVisible();
    await expect(page.getByText("2026-08-01")).toBeVisible();
    await expect(page.getByText("2026-08-04")).toBeVisible();
    await expect(page.getByRole("button", { name: /pay now/i })).toBeVisible();
  });

  test("creates booking and shows success page after payment", async ({ page }) => {
    await mockGuestSession(page);
    await page.route(`**/listings/${LISTING_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(LISTING),
      }),
    );
    await page.route("**/bookings", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: BOOKING_ID, status: "PENDING_PAYMENT" }),
      }),
    );
    await page.route(`**/bookings/${BOOKING_ID}/checkout`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: `http://localhost:5173/booking/success?bookingId=${BOOKING_ID}`,
          sessionId: crypto.randomUUID(),
        }),
      }),
    );
    await page.route(`**/bookings/${BOOKING_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: BOOKING_ID, status: "CONFIRMED" }),
      }),
    );
    await page.goto(`/listings/${LISTING_ID}/book?checkIn=2026-08-01&checkOut=2026-08-04`);
    await page.getByRole("button", { name: /pay now/i }).click();
    await expect(page).toHaveURL(/booking\/success/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /booking confirmed/i })).toBeVisible();
  });
});
