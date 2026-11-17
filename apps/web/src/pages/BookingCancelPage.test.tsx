import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { BookingCancelPage } from "./BookingCancelPage.js";

// NH-124 identity tests (booking-payment-identity, task 1.7). jsdom does not compute Tailwind, so
// shape is asserted through class tokens. Selector assumptions:
//  - panel = nearest ".border-2" ancestor of the h1 (a paper sign panel, rounded-card, no shadow);
//  - outlined tile = the first [aria-hidden="true"] descendant of the panel: it has a 2px border and
//    no ink fill class (bg-fg or bg-ink).

function renderCancel(search = "?listingId=xyz789") {
  return render(
    <MemoryRouter initialEntries={[`/booking/cancel${search}`]}>
      <BookingCancelPage />
    </MemoryRouter>,
  );
}

function required<T extends Element>(el: T | null, what: string): T {
  if (!el) throw new Error(`missing structure: ${what}`);
  return el;
}

describe("BookingCancelPage", () => {
  it("shows cancel title and back-to-listing link when listingId is present", () => {
    renderCancel("?listingId=xyz789");
    expect(screen.getByRole("heading", { name: /payment cancelled/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to listing/i })).toHaveAttribute(
      "href",
      "/listings/xyz789",
    );
  });

  it("shows back-to-search link when no listingId", () => {
    renderCancel("");
    expect(screen.getByRole("link", { name: /back to search/i })).toHaveAttribute(
      "href",
      "/search",
    );
  });
});

describe("BookingCancelPage identity", () => {
  it("has one h1 in a neutral paper panel with no ember or danger class", () => {
    renderCancel();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Payment cancelled");
    const panel = required(h1s[0]!.closest<HTMLElement>(".border-2"), "2px panel around the h1");
    expect(panel).toHaveClass("border-border", "bg-surface-raised", "rounded-card");
    expect(Array.from(panel.classList).some((c) => /^shadow/.test(c))).toBe(false);
    const all = [panel, ...Array.from(panel.querySelectorAll("*"))].flatMap((el) =>
      Array.from(el.classList),
    );
    expect(all.filter((c) => /ember|danger/.test(c))).toEqual([]);
  });

  it("has an aria-hidden outlined tile", () => {
    renderCancel();
    const panel = required(
      screen.getByRole("heading", { level: 1 }).closest<HTMLElement>(".border-2"),
      "2px panel around the h1",
    );
    const tile = required(
      panel.querySelector<HTMLElement>('[aria-hidden="true"]'),
      "decorative tile",
    );
    expect(tile).toHaveClass("border-2", "border-border");
    expect(tile.className).not.toMatch(/\bbg-(fg|ink|ember)\b/);
  });

  it("with a listingId: one link to the listing with the existing name and no button inside", () => {
    renderCancel("?listingId=xyz789");
    const links = screen.getAllByRole("link", { name: /back to listing/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/listings/xyz789");
    expect(links[0]!.querySelector("button")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link", { name: /back to search/i })).toBeNull();
  });

  it("without a listingId: one link to /search with the existing name and no button inside", () => {
    renderCancel("");
    const links = screen.getAllByRole("link", { name: /back to search/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/search");
    expect(links[0]!.querySelector("button")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
