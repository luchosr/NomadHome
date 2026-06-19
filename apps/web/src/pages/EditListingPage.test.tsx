import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditListingPage } from "./EditListingPage.js";

const mockGetOne = vi.fn();
const mockUpdate = vi.fn();
const mockPublish = vi.fn();
const mockListPhotos = vi.fn();
const mockListAvailability = vi.fn();

vi.mock("../api/host.js", () => ({
  hostApi: {
    getOne: (...args: unknown[]) => mockGetOne(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    publish: (...args: unknown[]) => mockPublish(...args),
    unpublish: vi.fn(),
  },
}));
vi.mock("../api/photos.js", () => ({
  photoApi: {
    list: (...args: unknown[]) => mockListPhotos(...args),
    deletePhoto: vi.fn(),
    getUploadUrl: vi.fn(),
    register: vi.fn(),
  },
}));
vi.mock("../api/availability.js", () => ({
  availabilityApi: {
    list: (...args: unknown[]) => mockListAvailability(...args),
    block: vi.fn(),
    deleteBlock: vi.fn(),
  },
}));
vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    user: { id: "h1", email: "host@test.com", roles: ["host"] },
    isLoading: false,
  }),
}));

const mockListing = {
  id: "l1",
  title: "Beach House",
  type: "PROPERTY" as const,
  city: "Porto",
  country: "PT",
  addressLine: "2 Sea Rd",
  description: "Lovely",
  capacity: 3,
  nightlyRateCents: 8000,
  currency: "USD",
  status: "DRAFT" as const,
  amenities: [],
};

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage(id = "l1") {
  return render(
    <QueryClientProvider client={makeQC()}>
      <MemoryRouter initialEntries={[`/host/listings/${id}/edit`]}>
        <Routes>
          <Route path="/host/listings/:id/edit" element={<EditListingPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EditListingPage", () => {
  beforeEach(() => {
    mockGetOne.mockReset();
    mockUpdate.mockReset();
    mockPublish.mockReset();
    mockListPhotos.mockReset();
    mockListAvailability.mockReset();
  });

  it("renders pre-filled listing title", async () => {
    mockGetOne.mockResolvedValue(mockListing);
    mockListPhotos.mockResolvedValue([]);
    mockListAvailability.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByDisplayValue("Beach House")).toBeInTheDocument();
  });

  it("calls hostApi.publish when Publish button clicked", async () => {
    mockGetOne.mockResolvedValue(mockListing);
    mockPublish.mockResolvedValue({ ...mockListing, status: "PUBLISHED" });
    mockListPhotos.mockResolvedValue([]);
    mockListAvailability.mockResolvedValue([]);
    renderPage();

    const publishBtn = await screen.findByRole("button", { name: /publish/i });
    fireEvent.click(publishBtn);

    await waitFor(() => expect(mockPublish).toHaveBeenCalledWith("l1"));
  });

  it("shows no photos text when photos list is empty", async () => {
    mockGetOne.mockResolvedValue(mockListing);
    mockListPhotos.mockResolvedValue([]);
    mockListAvailability.mockResolvedValue([]);
    renderPage();

    await screen.findByDisplayValue("Beach House");
    expect(await screen.findByText(/no photos yet/i)).toBeInTheDocument();
  });
});
