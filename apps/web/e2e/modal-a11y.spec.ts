import { chromium, test, expect } from "@playwright/test";
import type { Locator, Page, Route } from "@playwright/test";
import { mockSession } from "./helpers/auth";

// Accessibility of the booking dialogs (NH-146, modal-a11y). Real browser, API mocked through one
// catch-all route on the API origin; the page is reached with relative URLs so the spec runs on any
// port. Same policy as booking-payment-identity.spec.ts: computed styles and focus are asserted.
//
// Selector assumptions:
//  - opener = the Cancel / Leave a review button inside the card (main .rounded-card) of the booking;
//  - dialog = the role="dialog" element, surface = its first element child;
//  - backdrop click = a mouse click at (5, 5), a viewport corner far outside the centred surface.

const API = "http://localhost:3000";

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-360", width: 360, height: 800 },
] as const;

type Status = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

function makeBooking(id: string, status: Status, title: string, checkIn = "2099-08-01") {
  return {
    id,
    listingId: "listing-1",
    guestId: "guest-1",
    hostId: "host-1",
    listing: { title },
    checkIn,
    checkOut: "2099-08-04",
    nightlyRateCents: 9000,
    totalCents: 27000,
    status,
    cancellationReason: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

// Enough cards that the page scrolls at both viewport heights (so overflow:hidden removes a scrollbar).
const BOOKINGS = [
  makeBooking("b-confirmed", "CONFIRMED", "Confirmed Loft"),
  makeBooking("b-completed", "COMPLETED", "Completed Loft", "2024-01-10"),
  ...Array.from({ length: 12 }, (_, i) =>
    makeBooking(`b-cancelled-${i}`, "CANCELLED", `Cancelled Loft ${i + 1}`),
  ),
];

type Mocks = {
  /** Resolves when the cancel / review request may be answered; undefined answers immediately. */
  gate?: Promise<void>;
  failWith?: { status: number; body: unknown };
};

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function setup(page: Page, mocks: Mocks = {}) {
  await mockSession(page, { email: "guest@test.com", roles: ["guest"] });
  await page.route(`${API}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/auth/refresh") return route.fallback();
    if (path === "/bookings/me") {
      return json(route, 200, { data: BOOKINGS, total: BOOKINGS.length, page: 1, limit: 20 });
    }
    if (path.endsWith("/cancel") || path.endsWith("/review")) {
      if (mocks.gate) await mocks.gate;
      if (mocks.failWith) return json(route, mocks.failWith.status, mocks.failWith.body);
      return json(route, path.endsWith("/review") ? 201 : 200, {});
    }
    return json(route, 404, { error: "NOT_FOUND" });
  });
}

function cancelOpener(page: Page): Locator {
  return page
    .locator("main .rounded-card", { hasText: "Confirmed Loft" })
    .getByRole("button", { name: /^cancel$/i });
}

function reviewOpener(page: Page): Locator {
  return page
    .locator("main .rounded-card", { hasText: "Completed Loft" })
    .getByRole("button", { name: /leave a review/i });
}

async function openCancel(page: Page) {
  await page.goto("/bookings");
  await cancelOpener(page).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

async function openReview(page: Page) {
  await page.goto("/bookings");
  await reviewOpener(page).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

const DIALOGS = [
  {
    name: "cancel",
    open: openCancel,
    opener: cancelOpener,
    initialFocus: (page: Page) => page.getByRole("dialog").locator("#cancel-reason"),
    controls: 3, // textarea, Close, Yes cancel
  },
  {
    name: "review",
    open: openReview,
    opener: reviewOpener,
    initialFocus: (page: Page) => page.getByRole("dialog").getByRole("button", { name: "1 star" }),
    controls: 7, // five stars, textarea, Close (Submit is disabled until a rating is chosen)
  },
] as const;

/** Describes the focused element and whether it sits inside the open dialog. */
async function focusState(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    const dialog = document.querySelector("dialog");
    const label =
      active instanceof HTMLElement
        ? active.getAttribute("aria-label") || active.id || active.textContent?.trim() || ""
        : "";
    return {
      inside: !!dialog && !!active && dialog.contains(active),
      // A native modal dialog hands focus to the browser UI after its last control; the document
      // then reports BODY. That is not a page control outside the dialog being reached.
      contained:
        !!dialog &&
        !!active &&
        (dialog.contains(active) ||
          active === document.body ||
          active === document.documentElement),
      tag: active?.tagName ?? null,
      label,
    };
  });
}

async function bodyOverflow(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).overflow);
}

async function backdropClick(page: Page) {
  await page.mouse.click(5, 5);
}

for (const vp of VIEWPORTS) {
  test.describe(`Modal accessibility at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const d of DIALOGS) {
      test.describe(`${d.name} dialog`, () => {
        test("initial focus is inside the dialog on the data-autofocus control", async ({
          page,
        }) => {
          await setup(page);
          await d.open(page);
          expect((await focusState(page)).inside).toBe(true);
          await expect(d.initialFocus(page)).toBeFocused();
        });

        test("Tab and Shift+Tab loop inside the dialog and never leave", async ({ page }) => {
          await setup(page);
          await d.open(page);

          const seen = new Set<string>();
          for (let i = 0; i < d.controls + 3; i++) {
            await page.keyboard.press("Tab");
            const s = await focusState(page);
            expect(s.contained, `Tab #${i + 1} landed on ${s.tag} "${s.label}" outside`).toBe(true);
            if (s.inside) seen.add(`${s.tag}:${s.label}`);
          }
          expect(seen.size).toBe(d.controls);

          for (let i = 0; i < d.controls + 3; i++) {
            await page.keyboard.press("Shift+Tab");
            const s = await focusState(page);
            expect(s.contained, `Shift+Tab #${i + 1} landed on ${s.tag} "${s.label}" outside`).toBe(
              true,
            );
          }
        });

        test("Escape closes the dialog and focus returns to the opener", async ({ page }) => {
          await setup(page);
          await d.open(page);
          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog")).toHaveCount(0);
          await expect(d.opener(page)).toBeFocused();
        });

        test("a backdrop click at a corner closes; a click inside the surface does not", async ({
          page,
        }) => {
          await setup(page);
          await d.open(page);
          const dialog = page.getByRole("dialog");

          await dialog.locator(":scope > *").first().locator("h2").click();
          await expect(dialog).toBeVisible();
          await d.initialFocus(page).click();
          await expect(dialog).toBeVisible();

          await backdropClick(page);
          await expect(page.getByRole("dialog")).toHaveCount(0);
          await expect(d.opener(page)).toBeFocused();
        });

        test("a drag that starts inside the surface and ends on the backdrop does not close", async ({
          page,
        }) => {
          await setup(page);
          await d.open(page);
          const dialog = page.getByRole("dialog");
          const box = await dialog.locator("h2").boundingBox();
          if (!box) throw new Error("missing structure: dialog title box");

          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(5, 5, { steps: 5 });
          await page.mouse.up();
          await expect(dialog).toBeVisible();

          // A genuine backdrop click afterwards still closes (no stale gesture state).
          await backdropClick(page);
          await expect(page.getByRole("dialog")).toHaveCount(0);
        });

        test("Escape and backdrop are ignored while the request is in flight, then it closes", async ({
          page,
        }) => {
          let release: () => void = () => {};
          const gate = new Promise<void>((resolve) => {
            release = resolve;
          });
          await setup(page, { gate });
          await d.open(page);
          const dialog = page.getByRole("dialog");

          if (d.name === "review") {
            await dialog.getByRole("button", { name: "4 stars", exact: true }).click();
            await dialog.getByRole("button", { name: /submit review/i }).click();
          } else {
            await dialog.getByRole("button", { name: /yes, cancel/i }).click();
          }
          await expect(dialog.getByRole("button", { name: "Close" })).toBeDisabled();

          await page.keyboard.press("Escape");
          await expect(dialog).toBeVisible();
          await backdropClick(page);
          await expect(dialog).toBeVisible();

          release();
          await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 5000 });
        });

        test("Escape pressed twice while pending keeps the dialog open and the page locked", async ({
          page,
        }) => {
          // Chromium (CloseWatcher) delivers the second Escape with no user interaction in between as
          // a non-cancelable `cancel` and closes the native dialog behind React's back.
          let release: () => void = () => {};
          const gate = new Promise<void>((resolve) => {
            release = resolve;
          });
          await setup(page, { gate });
          await d.open(page);
          const dialog = page.getByRole("dialog");

          if (d.name === "review") {
            await dialog.getByRole("button", { name: "4 stars", exact: true }).click();
            await dialog.getByRole("button", { name: /submit review/i }).click();
          } else {
            await dialog.getByRole("button", { name: /yes, cancel/i }).click();
          }
          await expect(dialog.getByRole("button", { name: "Close" })).toBeDisabled();

          await page.keyboard.press("Escape");
          await page.keyboard.press("Escape");
          await page.keyboard.press("Escape");

          await expect(dialog).toBeVisible();
          expect(await bodyOverflow(page)).toBe("hidden");
          expect(
            await page.evaluate(() => document.querySelector("dialog")?.matches(":modal")),
          ).toBe(true);

          release();
          await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 5000 });
          expect(await bodyOverflow(page)).not.toBe("hidden");
        });

        test("Escape works again after a failed submit", async ({ page }) => {
          await setup(page, { failWith: { status: 500, body: { error: "SERVER_ERROR" } } });
          await d.open(page);
          const dialog = page.getByRole("dialog");
          if (d.name === "review") {
            await dialog.getByRole("button", { name: "4 stars", exact: true }).click();
            await dialog.getByRole("button", { name: /submit review/i }).click();
          } else {
            await dialog.getByRole("button", { name: /yes, cancel/i }).click();
          }
          await expect(page.getByRole("alert")).toHaveCount(1);
          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog")).toHaveCount(0);
        });

        test("body overflow is hidden while open and restored after close", async ({ page }) => {
          await setup(page);
          await page.goto("/bookings");
          await expect(cancelOpener(page)).toBeVisible();
          const before = await bodyOverflow(page);
          expect(before).not.toBe("hidden");

          await d.opener(page).click();
          await expect(page.getByRole("dialog")).toBeVisible();
          expect(await bodyOverflow(page)).toBe("hidden");

          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog")).toHaveCount(0);
          expect(await bodyOverflow(page)).toBe(before);
        });

        test("the existing flat identity still holds: 2px edge, 4px radius, no shadow, no blur", async ({
          page,
        }) => {
          await setup(page);
          await d.open(page);
          const dialog = page.getByRole("dialog");
          await expect(dialog).toHaveAttribute("aria-modal", "true");
          const surface = dialog.locator(":scope > *").first();
          await expect(surface).toHaveCSS("border-top-width", "2px");
          await expect(surface).toHaveCSS("border-top-color", "rgb(30, 30, 30)");
          await expect(surface).toHaveCSS("box-shadow", "none");
          await expect(surface).toHaveCSS("border-top-left-radius", "4px");
          await expect(dialog).toHaveCSS("backdrop-filter", "none");
          const backdrop = await dialog.evaluate((el) => {
            const cs = getComputedStyle(el, "::backdrop");
            return { filter: cs.backdropFilter, bg: cs.backgroundColor };
          });
          expect(backdrop.filter).toBe("none");
          expect(backdrop.bg).not.toBe("rgba(0, 0, 0, 0)");
          const overflow = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          }));
          expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
        });
      });
    }
  });
}

// The review success state replaces the form (which held focus), so focus must move to the success
// panel, and Escape from there must still close the dialog and hand focus back to the opener.
for (const vp of VIEWPORTS) {
  test.describe(`Review success state at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("focus moves to the success status and Escape closes with focus on the opener", async ({
      page,
    }) => {
      await setup(page);
      await openReview(page);
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: "4 stars", exact: true }).click();
      await dialog.getByRole("button", { name: /submit review/i }).click();

      const status = dialog.getByRole("status");
      await expect(status).toBeVisible();
      await expect(status).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(reviewOpener(page)).toBeFocused();
    });
  });
}

// Scrollbar shift (design open point, tasks 2.4 and 3.5). Headless Chromium hides scrollbars by
// default and macOS uses overlay scrollbars, so a classic 15px scrollbar is forced. The scroll lock
// (body overflow:hidden) removes the scrollbar; `scrollbar-gutter: stable` must keep its space so the
// page content does not move horizontally when the dialog opens.
test.describe("No horizontal shift when the dialog opens at desktop-1440", () => {
  for (const d of DIALOGS) {
    test(`${d.name} dialog: content stays put with a classic scrollbar`, async ({
      baseURL,
    }, testInfo) => {
      // Own browser: Playwright's headless default passes --hide-scrollbars, and launchOptions cannot
      // be overridden per describe group.
      const browser = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
      try {
        const page = await browser.newPage({ baseURL, viewport: { width: 1440, height: 900 } });
        await setup(page);
        await page.goto("/bookings");
        // Headless Chromium on macOS renders overlay scrollbars that take no layout space, so a
        // classic scrollbar is forced with a styled ::-webkit-scrollbar, which always reserves it.
        await page.addStyleTag({ content: "html::-webkit-scrollbar { width: 15px; }" });
        await expect(d.opener(page)).toBeVisible();

        const measure = () =>
          page.evaluate(() => {
            const h1 = document.querySelector("h1")?.getBoundingClientRect();
            const card = document.querySelector("main .rounded-card")?.getBoundingClientRect();
            return {
              h1Left: h1?.left ?? null,
              cardLeft: card?.left ?? null,
              cardWidth: card?.width ?? null,
              clientWidth: document.documentElement.clientWidth,
              innerWidth: window.innerWidth,
              scrollable:
                document.documentElement.scrollHeight > document.documentElement.clientHeight,
            };
          });

        const closed = await measure();
        expect(closed.scrollable).toBe(true);
        expect(
          closed.innerWidth - closed.clientWidth,
          "a classic scrollbar must be present for the measurement",
        ).toBeGreaterThan(0);

        await d.opener(page).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        const open = await measure();

        console.log(`SCROLLBAR_MEASUREMENT ${d.name} ${JSON.stringify({ closed, open })}`);
        await page.screenshot({ path: testInfo.outputPath(`scrollbar-${d.name}.png`) });

        expect(open.h1Left).toBe(closed.h1Left);
        expect(open.cardLeft).toBe(closed.cardLeft);
        expect(open.cardWidth).toBe(closed.cardWidth);
      } finally {
        await browser.close();
      }
    });
  }
});
