import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HostListingsPage } from "./HostListingsPage.js";

const mockListMine = vi.fn();
vi.mock("../api/host.js", () => ({
  hostApi: { listMine: (...args: unknown[]) => mockListMine(...args) },
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
        <HostListingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockListings = [
  {
    id: "l1",
    title: "Forest Cabin",
    type: "PROPERTY" as const,
    city: "Lisbon",
    country: "PT",
    addressLine: "1 Main St",
    description: "Nice",
    capacity: 4,
    nightlyRateCents: 10000,
    currency: "USD",
    status: "PUBLISHED" as const,
    amenities: [],
    primaryPhotoUrl: "https://example.com/forest-cabin.jpg",
    _count: { bookings: 2 },
  },
];

describe("HostListingsPage", () => {
  beforeEach(() => {
    mockListMine.mockReset();
  });

  it("shows listing titles and Edit links", async () => {
    mockListMine.mockResolvedValue(mockListings);
    renderPage();
    expect(await screen.findByText("Forest Cabin")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument();
  });

  it("shows empty state when no listings", async () => {
    mockListMine.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText(/you have no listings yet/i)).toBeInTheDocument();
  });

  it("shows New listing link", async () => {
    mockListMine.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByRole("link", { name: /new listing/i })).toBeInTheDocument();
  });

  it("shows a thumbnail image when the listing has a primary photo", async () => {
    mockListMine.mockResolvedValue(mockListings);
    renderPage();
    const img = await screen.findByRole("img", { name: "Forest Cabin" });
    expect(img).toHaveAttribute("src", "https://example.com/forest-cabin.jpg");
  });

  it("shows the confirmed booking count when the listing has bookings", async () => {
    mockListMine.mockResolvedValue(mockListings);
    renderPage();
    expect(await screen.findByText(/2/)).toBeInTheDocument();
  });

  it("shows an empty placeholder when the listing has no primary photo", async () => {
    mockListMine.mockResolvedValue([{ ...mockListings[0], primaryPhotoUrl: null }]);
    renderPage();
    await screen.findByText("Forest Cabin");
    expect(screen.queryByRole("img", { name: "Forest Cabin" })).not.toBeInTheDocument();
  });
});
