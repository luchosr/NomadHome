import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListingDetailPage } from "./ListingDetailPage.js";
import type { ListingDetail } from "../api/listings.js";
import { ApiError } from "../api/client.js";

const mockGetDetail = vi.fn();

vi.mock("../api/listings.js", () => ({
  listingsApi: {
    getDetail: (...args: unknown[]) => mockGetDetail(...args),
  },
}));

const mockUseAuth = vi.fn();

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => mockUseAuth(),
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderDetail(listingId = "listing-1", search = "") {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[`/listings/${listingId}${search}`]}>
        <Routes>
          <Route path="/listings/:id" element={<ListingDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockListing: ListingDetail = {
  id: "listing-1",
  title: "Sunny Lisbon Apartment",
  type: "PROPERTY",
  city: "Lisbon",
  country: "PT",
  addressLine: "Rua Augusta 1, 1100-053 Lisboa",
  description: "A bright apartment in the heart of Lisbon.",
  capacity: 4,
  nightlyRateCents: 9000,
  currency: "EUR",
  amenities: [{ amenityCode: "WIFI" }, { amenityCode: "KITCHEN" }],
  photos: [
    { id: "photo-1", url: "https://example.com/photo1.jpg", position: 0 },
    { id: "photo-2", url: "https://example.com/photo2.jpg", position: 1 },
  ],
  _count: { reviews: 3 },
  avgRating: 4.5,
};

describe("ListingDetailPage", () => {
  beforeEach(() => {
    mockGetDetail.mockReset();
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
  });

  it("shows loading state while fetching", async () => {
    // Never resolves during the test
    mockGetDetail.mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders listing title, description, and amenities after load", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    renderDetail();

    expect(await screen.findByText("Sunny Lisbon Apartment")).toBeInTheDocument();
    expect(screen.getByText("A bright apartment in the heart of Lisbon.")).toBeInTheDocument();
    expect(screen.getByText("WIFI")).toBeInTheDocument();
    expect(screen.getByText("KITCHEN")).toBeInTheDocument();
  });

  it("renders nightly rate", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    renderDetail();

    // €90.00 formatted by Intl.NumberFormat
    expect(await screen.findByText(/90/)).toBeInTheDocument();
  });

  it("shows Book now CTA for guest users", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "guest@test.com", roles: ["guest"] },
      isLoading: false,
    });
    renderDetail("listing-1", "?checkIn=2026-07-10&checkOut=2026-07-12");

    expect(await screen.findByRole("link", { name: /book now/i })).toBeInTheDocument();
  });

  it("shows Log in to book CTA for unauthenticated visitors", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    renderDetail();

    expect(await screen.findByRole("link", { name: /log in to book/i })).toBeInTheDocument();
  });

  it("shows not found message on 404 error", async () => {
    mockGetDetail.mockRejectedValue(new ApiError(404, { error: "Not found" }));
    renderDetail();

    expect(await screen.findByText(/listing not found/i)).toBeInTheDocument();
  });

  it("does not show book CTA for host users", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockUseAuth.mockReturnValue({
      user: { id: "u2", email: "host@test.com", roles: ["host"] },
      isLoading: false,
    });
    renderDetail();

    await screen.findByText("Sunny Lisbon Apartment");
    expect(screen.queryByRole("link", { name: /book now/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /log in to book/i })).not.toBeInTheDocument();
  });
});
