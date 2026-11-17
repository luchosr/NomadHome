import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t, type LocaleKey, type SearchResponse, type SearchResultItem } from "@nomadhome/shared";
import { FeaturedStaysSection } from "./FeaturedStaysSection.js";

const mockSearch = vi.fn();

vi.mock("../../api/search.js", () => ({
  searchApi: {
    search: (...args: unknown[]) => mockSearch(...args),
  },
}));

const tk = (key: string) => t(key as LocaleKey);

// Expected prices are computed with Intl so the tests do not depend on the (not yet
// extracted) formatRate helper; they assert the real, unconverted API values.
const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

const LISBON: SearchResultItem = {
  id: "listing-lisbon",
  title: "Alfama Loft",
  type: "PROPERTY",
  city: "Lisbon",
  country: "PT",
  nightlyRateCents: 7500,
  currency: "USD",
  totalCents: 7500,
  primaryPhotoUrl: "https://cdn.example.test/photos/alfama.jpg",
  amenities: ["wifi", "kitchen", "ac", "pool"],
};

const BERLIN: SearchResultItem = {
  id: "listing-berlin",
  title: "Mitte Desk Suite",
  type: "WORKSPACE",
  city: "Berlin",
  country: "DE",
  nightlyRateCents: 4200,
  currency: "EUR",
  totalCents: 4200,
  primaryPhotoUrl: null,
  amenities: ["wifi"],
};

function response(data: SearchResultItem[]): SearchResponse {
  return { data, pagination: { total: data.length, page: 1, pageSize: 3, hasMore: false } };
}

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <FeaturedStaysSection />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function rows() {
  return screen.findAllByRole("listitem");
}

beforeEach(() => {
  mockSearch.mockReset();
});

describe("FeaturedStaysSection with real listings", () => {
  it("renders exactly one departure-board row per returned listing", async () => {
    mockSearch.mockResolvedValue(response([LISBON, BERLIN]));
    renderSection();
    const items = await rows();
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText("Alfama Loft")).toBeInTheDocument();
    expect(within(items[1]!).getByText("Mitte Desk Suite")).toBeInTheDocument();
  });

  it("shows city, country, type and the unconverted nightly price per row", async () => {
    mockSearch.mockResolvedValue(response([LISBON, BERLIN]));
    renderSection();
    const [first, second] = await rows();
    expect(first!).toHaveTextContent(/Lisbon,\s*PT/);
    expect(first!).toHaveTextContent(tk("host.listings.type_property"));
    expect(first!).toHaveTextContent(money(7500, "USD"));
    expect(first!).toHaveTextContent(tk("home.featured.price_per_night"));
    expect(second!).toHaveTextContent(/Berlin,\s*DE/);
    expect(second!).toHaveTextContent(tk("host.listings.type_workspace"));
    expect(second!).toHaveTextContent(money(4200, "EUR"));
  });

  it("links each row to the real listing detail page", async () => {
    mockSearch.mockResolvedValue(response([LISBON, BERLIN]));
    renderSection();
    const [first, second] = await rows();
    expect(within(first!).getByRole("link")).toHaveAttribute("href", "/listings/listing-lisbon");
    expect(within(second!).getByRole("link")).toHaveAttribute("href", "/listings/listing-berlin");
  });

  it("shows no state tag, invented tag text or monthly price", async () => {
    mockSearch.mockResolvedValue(response([LISBON, BERLIN]));
    renderSection();
    const items = await rows();
    for (const item of items) {
      expect(item).not.toHaveTextContent(/featured|available|coming soon|\/\s*mo\b/i);
    }
    expect(screen.queryByText(/oaxaca|medell[ií]n/i)).toBeNull();
  });

  it("uses the real primary photo and a type pictogram fallback", async () => {
    mockSearch.mockResolvedValue(response([LISBON, BERLIN]));
    renderSection();
    const [first, second] = await rows();
    const img = first!.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "https://cdn.example.test/photos/alfama.jpg");
    expect(img).toHaveAttribute("alt", "");
    expect(second!.querySelector("img")).toBeNull();
    // Pictogram glyph markers: bed headboard path vs desk chair backrest path.
    expect(first!.querySelector('svg path[d="M4 5v22"]')).not.toBeNull();
    expect(second!.querySelector('svg path[d="M27 6v13"]')).not.toBeNull();
  });

  it("lists at most three known amenity labels and skips unknown codes", async () => {
    mockSearch.mockResolvedValue(
      response([{ ...LISBON, amenities: ["wifi", "teleporter", "kitchen", "ac", "pool"] }]),
    );
    renderSection();
    const [row] = await rows();
    expect(row!).toHaveTextContent(tk("search.filter_amenity_wifi"));
    expect(row!).toHaveTextContent(tk("search.filter_amenity_kitchen"));
    expect(row!).toHaveTextContent(tk("search.filter_amenity_ac"));
    expect(row!).not.toHaveTextContent(tk("search.filter_amenity_pool"));
    expect(row!).not.toHaveTextContent("teleporter");
  });

  it("renders a row when amenities is missing", async () => {
    const { amenities: _omit, ...noAmenities } = LISBON;
    mockSearch.mockResolvedValue(response([noAmenities]));
    renderSection();
    const [row] = await rows();
    expect(within(row!).getByRole("link")).toHaveAttribute("href", "/listings/listing-lisbon");
  });

  it("omits the comma when the country is blank", async () => {
    mockSearch.mockResolvedValue(response([{ ...LISBON, country: "" }]));
    renderSection();
    const [row] = await rows();
    expect(row!).toHaveTextContent("Lisbon");
    expect(row!).not.toHaveTextContent("Lisbon,");
  });

  it("keeps the see-all link to /search", async () => {
    mockSearch.mockResolvedValue(response([LISBON]));
    renderSection();
    await rows();
    expect(screen.getByRole("link", { name: tk("home.featured.see_all") })).toHaveAttribute(
      "href",
      "/search",
    );
  });
});

describe("FeaturedStaysSection request", () => {
  it("asks the existing search client for page 1, pageSize 3 and no filters", async () => {
    mockSearch.mockResolvedValue(response([LISBON]));
    renderSection();
    await waitFor(() => expect(mockSearch).toHaveBeenCalledTimes(1));
    expect(mockSearch).toHaveBeenCalledWith({ page: 1, pageSize: 3 });
  });
});

describe("FeaturedStaysSection hidden states", () => {
  it("renders nothing when the result is empty", async () => {
    mockSearch.mockResolvedValue(response([]));
    const { container } = renderSection();
    await waitFor(() => expect(mockSearch).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing, no error text and no retry control when the request fails", async () => {
    mockSearch.mockRejectedValue(new Error("API 500"));
    const { container } = renderSection();
    await waitFor(() => expect(mockSearch).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText(/error|retry|try again|something went wrong/i)).toBeNull();
  });
});

describe("FeaturedStaysSection loading", () => {
  it("shows busy, labelled skeletons and no listing or invented text while pending", () => {
    mockSearch.mockReturnValue(new Promise(() => {}));
    const { container } = renderSection();
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy).not.toBeNull();
    expect(busy).toHaveAttribute("aria-label", tk("home.featured.loading_label"));
    expect(busy!.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByRole("link", { name: /\/listings\// })).toBeNull();
    expect(container).not.toHaveTextContent(/\$\s?\d|oaxaca|lisbon|medell[ií]n|\/\s*mo\b/i);
    expect(container.querySelectorAll("a[href^='/listings/']")).toHaveLength(0);
  });
});

describe("FeaturedStaysSection edge cases", () => {
  const LONG: SearchResultItem = {
    ...LISBON,
    id: "listing-long",
    title: "An exceptionally long listing title ".repeat(8).trim(),
    city: "Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch",
    primaryPhotoUrl: null,
    nightlyRateCents: 0,
  };

  it("keeps a long-title, photoless, priceless listing as a working link without a price", async () => {
    mockSearch.mockResolvedValue(response([LONG]));
    renderSection();
    const [row] = await rows();
    expect(row!).toHaveTextContent(LONG.title);
    expect(within(row!).getByRole("link")).toHaveAttribute("href", "/listings/listing-long");
    expect(row!.querySelector("img")).toBeNull();
    expect(row!.querySelector('svg path[d="M4 5v22"]')).not.toBeNull();
    expect(row!).not.toHaveTextContent(/\$|0\.00|\/\s*night/);
  });

  it("wraps or clamps the long title instead of overflowing", async () => {
    mockSearch.mockResolvedValue(response([LONG]));
    renderSection();
    const [row] = await rows();
    const title = within(row!).getByText(LONG.title);
    expect(title.className).toMatch(/break-words|line-clamp-\d|truncate/);
  });

  it("omits the price for a negative rate", async () => {
    mockSearch.mockResolvedValue(response([{ ...LISBON, nightlyRateCents: -500 }]));
    renderSection();
    const [row] = await rows();
    expect(row!).not.toHaveTextContent(/\$|-5\.00|\/\s*night/);
  });
});
