import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingSuccessPage } from "./BookingSuccessPage.js";

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({ isLoading: false, user: null }),
}));

const mockGetById = vi.fn();
vi.mock("../api/bookings.js", () => ({
  bookingsApi: {
    getById: (...args: unknown[]) => mockGetById(...args),
  },
}));

function renderSuccess(search = "?bookingId=abc123") {
  return render(
    <MemoryRouter initialEntries={[`/booking/success${search}`]}>
      <BookingSuccessPage />
    </MemoryRouter>,
  );
}

describe("BookingSuccessPage", () => {
  beforeEach(() => {
    mockGetById.mockReset();
    mockGetById.mockResolvedValue({ status: "CONFIRMED" });
  });

  it("shows success title and View my bookings link", async () => {
    renderSuccess();
    expect(await screen.findByRole("heading", { name: /booking confirmed/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view my bookings/i })).toHaveAttribute(
      "href",
      "/bookings",
    );
  });

  it("shows the bookingId in the page", async () => {
    renderSuccess("?bookingId=abc123");
    expect(await screen.findByText(/#abc123/)).toBeInTheDocument();
  });
});
