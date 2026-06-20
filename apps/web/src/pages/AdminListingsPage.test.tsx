import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminListingsPage } from "./AdminListingsPage.js";

const mockListListings = vi.fn();
const mockDisableListing = vi.fn();
const mockEnableListing = vi.fn();

vi.mock("../api/admin.js", () => ({
  adminApi: {
    listListings: (...args: unknown[]) => mockListListings(...args),
    disableListing: (...args: unknown[]) => mockDisableListing(...args),
    enableListing: (...args: unknown[]) => mockEnableListing(...args),
  },
}));

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    user: { id: "a1", email: "admin@test.com", roles: ["admin"] },
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
        <AdminListingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockListings = {
  data: [
    {
      id: "l1",
      title: "Beach Loft",
      type: "PROPERTY" as const,
      city: "Lisbon",
      status: "PUBLISHED" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
      host: { email: "host@example.com" },
    },
    {
      id: "l2",
      title: "City Desk",
      type: "WORKSPACE" as const,
      city: "Porto",
      status: "DISABLED" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
      host: { email: "host2@example.com" },
    },
  ],
  total: 2,
  page: 1,
  limit: 50,
};

describe("AdminListingsPage", () => {
  beforeEach(() => {
    mockListListings.mockReset();
    mockDisableListing.mockReset();
    mockEnableListing.mockReset();
  });

  it("renders listing title and host email", async () => {
    mockListListings.mockResolvedValue(mockListings);
    renderPage();
    expect(await screen.findByText("Beach Loft")).toBeInTheDocument();
    expect(screen.getByText("host@example.com")).toBeInTheDocument();
  });

  it("calls adminApi.disableListing when Disable clicked", async () => {
    mockListListings.mockResolvedValue(mockListings);
    mockDisableListing.mockResolvedValue({
      ...mockListings.data[0],
      status: "DISABLED",
    });
    renderPage();

    const disableBtn = await screen.findByRole("button", { name: /disable/i });
    await userEvent.click(disableBtn);

    await waitFor(() => expect(mockDisableListing).toHaveBeenCalledWith("l1"));
  });

  it("shows empty state when no listings", async () => {
    mockListListings.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
    renderPage();
    expect(await screen.findByText(/no listings found/i)).toBeInTheDocument();
  });
});
