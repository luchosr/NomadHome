import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HostUpcomingPage } from "./HostUpcomingPage.js";

const mockHostAll = vi.fn();
vi.mock("../api/bookings.js", () => ({
  bookingsApi: { hostAll: (...args: unknown[]) => mockHostAll(...args) },
}));
vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    user: { id: "h1", email: "host@test.com", roles: ["host"] },
    isLoading: false,
  }),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <MemoryRouter>
        <HostUpcomingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockBookings = [
  {
    id: "b1",
    checkIn: "2027-01-10",
    checkOut: "2027-01-15",
    status: "CONFIRMED" as const,
    totalCents: 30000,
    currency: "USD",
    listing: { title: "Beach House" },
    guest: { email: "guest@example.com" },
  },
];

describe("HostUpcomingPage", () => {
  beforeEach(() => {
    mockHostAll.mockReset();
  });

  it("renders listing title and guest email", async () => {
    mockHostAll.mockResolvedValue(mockBookings);
    renderPage();
    expect(await screen.findByText("Beach House")).toBeInTheDocument();
    expect(screen.getByText("guest@example.com")).toBeInTheDocument();
  });

  it("shows empty state when no bookings", async () => {
    mockHostAll.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText(/no bookings yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view my listings/i })).toHaveAttribute(
      "href",
      "/host/listings",
    );
  });
});
