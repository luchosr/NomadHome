import { test, expect } from "@playwright/test";
import { mockSession } from "./helpers/auth.js";

test.describe("US-7.1 — Host views upcoming bookings dashboard", () => {
  test("shows Upcoming bookings heading", async ({ page }) => {
    await mockSession(page, { email: "host@test.com", roles: ["guest", "host"] });
    await page.route("**/bookings/host-upcoming*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );
    await page.goto("/host/upcoming");
    await expect(page.getByRole("heading", { name: /upcoming bookings/i })).toBeVisible();
  });

  test("shows empty state when no upcoming bookings", async ({ page }) => {
    await mockSession(page, { email: "host@test.com", roles: ["guest", "host"] });
    await page.route("**/bookings/host-upcoming*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );
    await page.goto("/host/upcoming");
    await expect(page.getByText(/no upcoming bookings/i)).toBeVisible();
  });

  test("shows booking rows when bookings exist", async ({ page }) => {
    await mockSession(page, { email: "host@test.com", roles: ["guest", "host"] });
    await page.route("**/bookings/host-upcoming*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "b1",
            listing: { title: "Sunny Loft in Lisbon" },
            guest: { email: "guest@test.com" },
            checkIn: "2027-08-01",
            checkOut: "2027-08-04",
          },
        ]),
      }),
    );
    await page.goto("/host/upcoming");
    await expect(page.getByText("Sunny Loft in Lisbon")).toBeVisible();
    await expect(page.getByText("guest@test.com")).toBeVisible();
  });
});
