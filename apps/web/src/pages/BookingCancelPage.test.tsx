import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { BookingCancelPage } from "./BookingCancelPage.js";

function renderCancel(search = "?listingId=xyz789") {
  return render(
    <MemoryRouter initialEntries={[`/booking/cancel${search}`]}>
      <BookingCancelPage />
    </MemoryRouter>,
  );
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
