import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchPage } from "./SearchPage.js";

const mockSearch = vi.fn();

vi.mock("../api/search.js", () => ({
  searchApi: {
    search: (...args: unknown[]) => mockSearch(...args),
  },
}));

// Keep useSearchParams functional via real MemoryRouter, only mock useNavigate
vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return { ...mod };
});

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderSearch(initialEntries = ["/search"]) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={initialEntries}>
        <SearchPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockSearchResult = {
  data: [
    {
      id: "listing-1",
      title: "Lisbon Studio",
      type: "PROPERTY" as const,
      city: "Lisbon",
      country: "PT",
      nightlyRateCents: 7500,
      currency: "EUR",
      totalCents: 52500,
      primaryPhotoUrl: null,
    },
  ],
  pagination: { total: 1, page: 1, pageSize: 20, hasMore: false },
};

describe("SearchPage", () => {
  beforeEach(() => {
    mockSearch.mockReset();
  });

  it("renders form fields: city, check-in, check-out, and search button", () => {
    renderSearch();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/check-in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/check-out/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("shows validation error when city is empty on submit", async () => {
    renderSearch();
    await userEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(await screen.findByText(/required/i)).toBeInTheDocument();
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("calls searchApi.search and renders ListingCard on valid submit", async () => {
    mockSearch.mockResolvedValue(mockSearchResult);
    renderSearch();

    await userEvent.type(screen.getByLabelText(/city/i), "Lisbon");
    // userEvent.type does not work for <input type="date"> in jsdom; use fireEvent.change
    fireEvent.change(screen.getByLabelText(/check-in/i), { target: { value: "2027-01-01" } });
    fireEvent.change(screen.getByLabelText(/check-out/i), { target: { value: "2027-01-07" } });
    await userEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => expect(mockSearch).toHaveBeenCalledTimes(1));
    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({ city: "Lisbon", checkIn: "2027-01-01", checkOut: "2027-01-07" }),
    );
    expect(await screen.findByText("Lisbon Studio")).toBeInTheDocument();
  });

  it("shows no_results message when search returns empty data", async () => {
    mockSearch.mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, pageSize: 20, hasMore: false },
    });
    renderSearch();

    await userEvent.type(screen.getByLabelText(/city/i), "Nowhere");
    fireEvent.change(screen.getByLabelText(/check-in/i), { target: { value: "2027-01-01" } });
    fireEvent.change(screen.getByLabelText(/check-out/i), { target: { value: "2027-01-07" } });
    await userEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(await screen.findByText(/no listings found/i)).toBeInTheDocument();
  });
});
