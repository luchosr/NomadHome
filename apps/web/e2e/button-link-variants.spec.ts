import { test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";
import { mockSession } from "./helpers/auth";
import { expectButtonLinkContract } from "./helpers/button-link";

// NH-138 (button-link-variants). Red until the Button primitive is flat (no ring, no box shadow)
// and every CTA that wraps a Button in a Link becomes one anchor. All API calls are mocked through
// one catch-all route on the API origin; pages are reached with relative URLs so the spec runs on
// any port. Duplicated DOM is narrowed with `.filter({ visible: true })`.

const API = "http://localhost:3000";

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-360", width: 360, height: 800 },
] as const;

const LISTING = {
  id: "l1",
  title: "Sunny Lisbon Apartment",
  description: "A bright apartment.",
  type: "PROPERTY",
  city: "Lisbon",
  country: "PT",
  addressLine: "Rua Augusta 1",
  capacity: 4,
  nightlyRateCents: 9000,
  currency: "EUR",
  status: "DRAFT",
  amenities: [{ amenityCode: "wifi" }],
  photos: [],
  primaryPhotoUrl: null,
  _count: { reviews: 0, bookings: 0 },
  avgRating: null,
};

const QUOTE = {
  nights: 2,
  nightlyRateCents: 9000,
  subtotalCents: 18000,
  guestServiceFeeBps: 1500,
  guestServiceFeeCents: 2700,
  totalChargedCents: 20700,
  currency: "EUR",
};

const MY_BOOKING = {
  id: "b1",
  listingId: "l1",
  guestId: "g1",
  hostId: "h1",
  checkIn: "2099-08-01",
  checkOut: "2099-08-04",
  nightlyRateCents: 9000,
  totalCents: 27000,
  status: "CONFIRMED",
  cancellationReason: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  listing: { title: "Sunny Lisbon Apartment" },
};

type Data = { listings?: unknown[]; myBookings?: unknown[]; upcoming?: unknown[] };

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function mockApi(page: Page, d: Data = {}) {
  await page.route(`${API}/**`, (route) => {
    const method = route.request().method();
    const path = new URL(route.request().url()).pathname;
    if (path === "/auth/refresh") return route.fallback();
    if (path === "/auth/verify") return json(route, { status: "verified" });
    if (path === "/listings/mine") return json(route, d.listings ?? [LISTING]);
    if (path === "/listings/l1/manage") return json(route, LISTING);
    if (path === "/listings/l1/photos") return json(route, []);
    if (path === "/listings/l1/availability") return json(route, []);
    if (path === "/listings/l1/blocked-dates") return json(route, []);
    if (path === "/listings/l1") return json(route, LISTING);
    if (path === "/bookings/quote") return json(route, QUOTE);
    if (path === "/bookings/me") {
      const data = d.myBookings ?? [];
      return json(route, { data, total: data.length, page: 1, limit: 20 });
    }
    if (path === "/bookings/host-all") return json(route, d.upcoming ?? []);
    if (method === "POST" && path === "/bookings/b1/sync-payment") return json(route, {});
    if (path === "/bookings/b1") return json(route, { ...MY_BOOKING, status: "CONFIRMED" });
    if (path === "/admin/users") {
      const user = {
        id: "u2",
        email: "off@test.com",
        roles: ["guest"],
        disabledAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      return json(route, { data: [user], total: 1, page: 1, limit: 50 });
    }
    if (path === "/admin/listings") {
      const row = {
        id: "l9",
        title: "Off Listing",
        type: "PROPERTY",
        city: "Lisbon",
        status: "DISABLED",
        createdAt: "2026-01-01T00:00:00.000Z",
        host: { email: "host@test.com" },
      };
      return json(route, { data: [row], total: 1, page: 1, limit: 50 });
    }
    return json(route, { error: "NOT_FOUND" }, 404);
  });
}

async function as(page: Page, roles: string[], d: Data = {}) {
  await mockSession(page, { email: "user@test.com", roles });
  await mockApi(page, d);
}

const visible = { visible: true } as const;

for (const vp of VIEWPORTS) {
  test.describe(`button-link variants at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("my bookings empty state: one link, flat panel", async ({ page }) => {
      await as(page, ["guest"]);
      await page.goto("/bookings");
      const cta = page.locator("main a").filter(visible).first();
      await cta.waitFor();
      await expectButtonLinkContract(page, { links: [cta] });
    });

    test("my bookings: secondary Review button and cards are flat", async ({ page }) => {
      await as(page, ["guest"], { myBookings: [{ ...MY_BOOKING, status: "COMPLETED" }] });
      await page.goto("/bookings");
      const cancel = page
        .getByRole("button", { name: /review/i })
        .filter(visible)
        .first();
      await cancel.waitFor();
      await expectButtonLinkContract(page, {
        secondaries: [cancel],
        cards: [page.locator(".rounded-card").filter(visible).first()],
      });
    });

    test("host upcoming empty state: one link", async ({ page }) => {
      await as(page, ["guest", "host"]);
      await page.goto("/host/upcoming");
      const cta = page.locator("main a").filter(visible).first();
      await cta.waitFor();
      await expectButtonLinkContract(page, { links: [cta] });
    });

    test("host listings: New listing and Edit are single tab stops", async ({ page }) => {
      await as(page, ["guest", "host"]);
      await page.goto("/host/listings");
      await expectButtonLinkContract(page, {
        links: [
          page.getByRole("link", { name: "New listing" }).filter(visible).first(),
          page.getByRole("link", { name: "Edit" }).filter(visible).first(),
        ],
      });
    });

    test("listing detail: Book now is one anchor", async ({ page }) => {
      await as(page, ["guest"]);
      await page.goto("/listings/l1?checkIn=2099-07-10&checkOut=2099-07-12");
      const book = page
        .getByRole("link", { name: /book now/i })
        .filter(visible)
        .first();
      await book.waitFor();
      await expectButtonLinkContract(page, { links: [book] });
    });

    test("listing detail: Log in to book is one anchor for visitors", async ({ page }) => {
      await mockApi(page);
      await page.route(`${API}/auth/refresh`, (route) => json(route, { error: "UNAUTH" }, 401));
      await page.goto("/listings/l1");
      const login = page
        .getByRole("link", { name: /log in to book/i })
        .filter(visible)
        .first();
      await login.waitFor();
      await expectButtonLinkContract(page, { links: [login] });
    });

    test("booking form: back link is one anchor", async ({ page }) => {
      await as(page, ["guest"]);
      await page.goto("/listings/l1/book?checkIn=2099-07-10&checkOut=2099-07-12");
      const back = page
        .getByRole("link", { name: /back to listing/i })
        .filter(visible)
        .first();
      await back.waitFor();
      await expectButtonLinkContract(page, { links: [back] });
    });

    test("booking cancel: secondary CTA is one anchor", async ({ page }) => {
      await as(page, ["guest"]);
      await page.goto("/booking/cancel?listingId=l1");
      const back = page
        .getByRole("link", { name: /back to listing/i })
        .filter(visible)
        .first();
      await back.waitFor();
      await expectButtonLinkContract(page, { links: [back] });
    });

    test("booking success: View my bookings is one anchor", async ({ page }) => {
      await as(page, ["guest"]);
      await page.goto("/booking/success?bookingId=b1");
      const link = page
        .getByRole("link", { name: /view my bookings/i })
        .filter(visible)
        .first();
      await link.waitFor();
      await expectButtonLinkContract(page, { links: [link] });
    });

    test("verify email: CTA is one anchor", async ({ page }) => {
      await mockApi(page);
      await page.route(`${API}/auth/refresh`, (route) => json(route, { error: "UNAUTH" }, 401));
      await page.goto("/verify?token=abc");
      const cta = page.locator("main a").filter(visible).first();
      await cta.waitFor();
      await expectButtonLinkContract(page, { links: [cta] });
    });

    test("admin users: Re-enable secondary and cards are flat", async ({ page }) => {
      await as(page, ["guest", "admin"]);
      await page.goto("/admin/users");
      const enable = page.getByRole("button", { name: "Re-enable" }).filter(visible).first();
      await enable.waitFor();
      await expectButtonLinkContract(page, { secondaries: [enable] });
    });

    test("admin listings: Re-enable secondary is flat", async ({ page }) => {
      await as(page, ["guest", "admin"]);
      await page.goto("/admin/listings");
      const enable = page.getByRole("button", { name: "Re-enable" }).filter(visible).first();
      await enable.waitFor();
      await expectButtonLinkContract(page, { secondaries: [enable] });
    });

    test("edit listing: secondary buttons and cards are flat", async ({ page }) => {
      await as(page, ["guest", "host"]);
      await page.goto("/host/listings/l1/edit");
      const card = page.locator(".rounded-card").filter(visible).first();
      await card.waitFor();
      await expectButtonLinkContract(page, {
        cards: [card],
        secondaries: [
          page.locator("main button.border-border.bg-transparent").filter(visible).first(),
        ],
      });
    });
  });
}
