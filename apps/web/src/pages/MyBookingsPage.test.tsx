import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MyBookingsPage } from "./MyBookingsPage.js";
import type { BookingsPage } from "../api/bookings.js";

const mockListMine = vi.fn();
vi.mock("../api/bookings.js", () => ({
  bookingsApi: {
    listMine: (...args: unknown[]) => mockListMine(...args),
    cancel: vi.fn(),
    review: vi.fn(),
  },
}));

vi.mock("../components/CancelBookingModal.js", () => ({
  CancelBookingModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="cancel-modal">
      <button onClick={onClose}>close-cancel</button>
    </div>
  ),
}));

vi.mock("../components/ReviewModal.js", () => ({
  ReviewModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="review-modal">
      <button onClick={onClose}>close-review</button>
    </div>
  ),
}));

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "guest@test.com", roles: ["guest"] },
    isLoading: false,
  }),
}));

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);
const futureDateStr = futureDate.toISOString().split("T")[0] as string;
const pastDate = "2024-01-10";

const mockBookings: BookingsPage = {
  data: [
    {
      id: "b1",
      listingId: "l1",
      guestId: "u1",
      hostId: "h1",
      checkIn: futureDateStr,
      checkOut: futureDateStr,
      nightlyRateCents: 10000,
      totalCents: 10000,
      status: "CONFIRMED",
      cancellationReason: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      listing: { title: "Confirmed Listing" },
    },
    {
      id: "b2",
      listingId: "l2",
      guestId: "u1",
      hostId: "h2",
      checkIn: pastDate,
      checkOut: "2024-01-15",
      nightlyRateCents: 8000,
      totalCents: 40000,
      status: "COMPLETED",
      cancellationReason: null,
      createdAt: "2024-01-01T00:00:00.000Z",
      listing: { title: "Completed Listing" },
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
};

describe("MyBookingsPage", () => {
  beforeEach(() => {
    mockListMine.mockReset();
  });

  it("shows 'My Bookings' heading and listing titles from mock data", async () => {
    mockListMine.mockResolvedValue(mockBookings);
    renderPage();
    expect(await screen.findByRole("heading", { name: /my bookings/i })).toBeInTheDocument();
    expect(await screen.findByText("Confirmed Listing")).toBeInTheDocument();
    expect(screen.getByText("Completed Listing")).toBeInTheDocument();
  });

  it("shows 'Cancel' button for CONFIRMED booking with future checkIn", async () => {
    mockListMine.mockResolvedValue(mockBookings);
    renderPage();
    expect(await screen.findByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows 'Leave a review' button for COMPLETED booking", async () => {
    mockListMine.mockResolvedValue(mockBookings);
    renderPage();
    expect(await screen.findByRole("button", { name: /leave a review/i })).toBeInTheDocument();
  });

  it("shows empty state when no bookings", async () => {
    mockListMine.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    renderPage();
    expect(await screen.findByText(/you have no bookings yet/i)).toBeInTheDocument();
  });
});
