import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingFormPage } from "./BookingFormPage.js";
import { ApiError } from "../api/client.js";
import type { ListingDetail } from "../api/listings.js";

// --- mocks ---

const mockGetDetail = vi.fn();
vi.mock("../api/listings.js", () => ({
  listingsApi: { getDetail: (...args: unknown[]) => mockGetDetail(...args) },
}));

const mockCreate = vi.fn();
const mockCheckout = vi.fn();
vi.mock("../api/bookings.js", () => ({
  bookingsApi: {
    create: (...args: unknown[]) => mockCreate(...args),
    checkout: (...args: unknown[]) => mockCheckout(...args),
  },
}));

const mockUseAuth = vi.fn();
vi.mock("../contexts/auth.js", () => ({
  useAuth: () => mockUseAuth(),
}));

// --- helpers ---

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderForm(search = "?checkIn=2026-07-10&checkOut=2026-07-12") {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[`/listings/abc/book${search}`]}>
        <Routes>
          <Route path="/listings/:id/book" element={<BookingFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockListing: ListingDetail = {
  id: "abc",
  title: "Ocean View Suite",
  type: "PROPERTY",
  city: "Porto",
  country: "PT",
  addressLine: "Rua da Praia 10",
  description: "A beautiful suite.",
  capacity: 2,
  nightlyRateCents: 10000,
  currency: "EUR",
  amenities: [],
  photos: [],
  _count: { reviews: 0 },
  avgRating: null,
};

// --- tests ---

describe("BookingFormPage", () => {
  beforeEach(() => {
    mockGetDetail.mockReset();
    mockCreate.mockReset();
    mockCheckout.mockReset();
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "guest@test.com", roles: ["guest"] },
      isLoading: false,
    });
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("shows listing title and computed nights + total when listing loads", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    renderForm();

    expect(await screen.findByText("Ocean View Suite")).toBeInTheDocument();
    // 2 nights × €100.00 = €200.00
    expect(screen.getByText(/nights/i)).toBeInTheDocument();
    expect(screen.getAllByText(/200/).length).toBeGreaterThan(0);
  });

  it("calls create then checkout then redirects on Pay now click", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockCreate.mockResolvedValue({
      id: "booking-1",
      listingId: "abc",
      checkIn: "2026-07-10",
      checkOut: "2026-07-12",
      status: "PENDING",
      totalCents: 20000,
    });
    mockCheckout.mockResolvedValue({
      url: "https://checkout.stripe.com/abc",
      sessionId: "sess_1",
    });

    renderForm();
    await screen.findByText("Ocean View Suite");

    await userEvent.click(screen.getByRole("button", { name: /pay now/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        listingId: "abc",
        checkIn: "2026-07-10",
        checkOut: "2026-07-12",
      });
    });
    await waitFor(() => expect(mockCheckout).toHaveBeenCalledWith("booking-1"));
    await waitFor(() => expect(window.location.href).toBe("https://checkout.stripe.com/abc"));
  });

  it("shows overlap error when create throws ApiError 422 BOOKING_OVERLAP", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockCreate.mockRejectedValue(new ApiError(422, { error: "BOOKING_OVERLAP" }));

    renderForm();
    await screen.findByText("Ocean View Suite");

    await userEvent.click(screen.getByRole("button", { name: /pay now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no longer available/i);
  });

  it("shows verification error when create throws ApiError 403 EMAIL_NOT_VERIFIED", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockCreate.mockRejectedValue(new ApiError(403, { error: "EMAIL_NOT_VERIFIED" }));

    renderForm();
    await screen.findByText("Ocean View Suite");

    await userEvent.click(screen.getByRole("button", { name: /pay now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/verify your email/i);
  });

  it("shows select_dates message when no checkIn param is provided", () => {
    renderForm("?checkOut=2026-07-12");
    expect(screen.getByText(/select check-in and check-out/i)).toBeInTheDocument();
    expect(mockGetDetail).not.toHaveBeenCalled();
  });
});
