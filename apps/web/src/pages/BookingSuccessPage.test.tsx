import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { BookingSuccessPage } from "./BookingSuccessPage.js";

function renderSuccess(search = "?bookingId=abc123") {
  return render(
    <MemoryRouter initialEntries={[`/booking/success${search}`]}>
      <BookingSuccessPage />
    </MemoryRouter>,
  );
}

describe("BookingSuccessPage", () => {
  it("shows success title and View my bookings link", () => {
    renderSuccess();
    expect(screen.getByRole("heading", { name: /booking confirmed/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view my bookings/i })).toHaveAttribute(
      "href",
      "/bookings",
    );
  });

  it("shows the bookingId in the page", () => {
    renderSuccess("?bookingId=abc123");
    expect(screen.getByText(/#abc123/)).toBeInTheDocument();
  });
});
