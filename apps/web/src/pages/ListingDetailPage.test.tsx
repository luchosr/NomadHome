import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@nomadhome/shared";
import type { LocaleKey } from "@nomadhome/shared";
import pageSource from "./ListingDetailPage.tsx?raw";
import { ListingDetailPage } from "./ListingDetailPage.js";
import { expectButtonLink } from "../test/buttonLink.js";
import type { ListingDetail } from "../api/listings.js";
import { ApiError } from "../api/client.js";

const mockGetDetail = vi.fn();
const mockGetBlockedDates = vi.fn();

vi.mock("../api/listings.js", () => ({
  listingsApi: {
    getDetail: (...args: unknown[]) => mockGetDetail(...args),
    getBlockedDates: (...args: unknown[]) => mockGetBlockedDates(...args),
  },
}));

const mockUseAuth = vi.fn();

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => mockUseAuth(),
}));

function makeQueryClient() {
  return new QueryClient({
    // retryDelay 0: the page sets its own `retry` (two retries on non-404), so the 500 case settles fast.
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
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

describe("ListingDetailPage button-link variants (NH-138)", () => {
  beforeEach(() => {
    mockGetDetail.mockReset();
    mockGetBlockedDates.mockReset();
    mockGetBlockedDates.mockResolvedValue([]);
  });

  it("Book now is one primary anchor with no nested or wrapping button", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "guest@test.com", roles: ["guest"] },
      isLoading: false,
    });
    mockGetDetail.mockResolvedValue(mockListing);
    const { container } = renderDetail("listing-1", "?checkIn=2026-07-10&checkOut=2026-07-12");
    expectButtonLink(await screen.findByRole("link", { name: /book now/i }), "primary");
    expect(container.querySelector("a button")).toBeNull();
    expect(container.querySelector("button a")).toBeNull();
  });

  it("Log in to book is one secondary anchor", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    mockGetDetail.mockResolvedValue(mockListing);
    const { container } = renderDetail();
    const link = await screen.findByRole("link", { name: /log in to book/i });
    expectButtonLink(link, "secondary");
    expect(container.querySelector("a button")).toBeNull();
    expect(container.querySelector("button a")).toBeNull();
  });
});

describe("ListingDetailPage", () => {
  beforeEach(() => {
    mockGetDetail.mockReset();
    mockGetBlockedDates.mockReset();
    mockGetBlockedDates.mockResolvedValue([]);
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
  });

  it("shows a skeleton while fetching", async () => {
    // Never resolves during the test
    mockGetDetail.mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(screen.getByTestId("listing-detail-skeleton")).toBeInTheDocument();
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

  // ---- Identity (NH-126, listing-detail-identity) -------------------------------------
  // Selector assumptions (jsdom does not compute Tailwind, so shape is asserted by class):
  //  - primary photo = the only <img> with the listing title as alt; thumbnails are decorative
  //    (alt "" + aria-hidden) and found as img[aria-hidden="true"];
  //  - placeholder (no photo) = the only element carrying `border-dashed`;
  //  - panel of a state = nearest ancestor of its h1 carrying `border-2`;
  //  - tile of a state = first [aria-hidden="true"] inside that panel;
  //  - price band = nearest `.bg-ember` ancestor of the price text; panel = its parent;
  //  - paper = bg-surface-raised, ink = bg-fg / text-fg / border-border (tokens in DESIGN.md).

  const THREE_PHOTOS = [
    { id: "p1", url: "https://example.com/1.jpg", position: 0 },
    { id: "p2", url: "https://example.com/2.jpg", position: 1 },
    { id: "p3", url: "https://example.com/3.jpg", position: 2 },
  ];

  /** Classes that set a radius, excluding `rounded-none`. */
  function radiusClasses(el: Element): string[] {
    return Array.from(el.classList).filter((c) => /^rounded/.test(c) && c !== "rounded-none");
  }

  function panelOf(h1: HTMLElement): HTMLElement {
    const panel = h1.closest<HTMLElement>(".border-2");
    if (!panel) throw new Error("h1 has no .border-2 ancestor");
    return panel;
  }

  function tileOf(panel: HTMLElement): Element {
    const tile = panel.querySelector('[aria-hidden="true"]');
    if (!tile) throw new Error("panel has no aria-hidden tile");
    return tile;
  }

  async function renderLoaded(overrides: Partial<ListingDetail> = {}) {
    mockGetDetail.mockResolvedValue({ ...mockListing, ...overrides });
    const view = renderDetail();
    await screen.findByRole("heading", { level: 1, name: "Sunny Lisbon Apartment" });
    return view;
  }

  it("loaded: exactly one h1 (the title) plus the amenities and rating h2s", async () => {
    await renderLoaded();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: t("listings.detail.amenities") }));
    expect(screen.getByRole("heading", { level: 2, name: t("listings.detail.rating") }));
  });

  it("loaded: type, city and country, and address text render", async () => {
    await renderLoaded();
    expect(screen.getByText(t("host.listings.type_property"))).toBeInTheDocument();
    expect(screen.getByText("Lisbon, PT")).toBeInTheDocument();
    expect(screen.getByText("Rua Augusta 1, 1100-053 Lisboa")).toBeInTheDocument();
  });

  it("type tag: 2px ink edge, no pill radius", async () => {
    await renderLoaded();
    const tag = screen.getByText(t("host.listings.type_property"));
    expect(tag).toHaveClass("border-2", "border-border");
    expect(tag.className).not.toMatch(/rounded-(full|pill)/);
  });

  it("gallery: primary photo has the 2px ink edge and no radius class", async () => {
    await renderLoaded({ photos: THREE_PHOTOS });
    const primary = screen.getByAltText("Sunny Lisbon Apartment");
    expect(primary).toHaveAttribute("src", THREE_PHOTOS[0]!.url);
    expect(primary).toHaveClass("border-2", "border-border");
    expect(radiusClasses(primary!)).toEqual([]);
  });

  it("gallery: thumbnails are flat, edged and not interactive", async () => {
    const { container } = await renderLoaded({ photos: THREE_PHOTOS });
    expect(screen.getAllByAltText("Sunny Lisbon Apartment")).toHaveLength(1);
    const thumbs = Array.from(container.querySelectorAll("img[aria-hidden='true']"));
    expect(thumbs).toHaveLength(2);
    for (const thumb of thumbs) {
      expect(thumb).toHaveAttribute("alt", "");
      expect(thumb).toHaveClass("border-2", "border-border");
      expect(radiusClasses(thumb)).toEqual([]);
      expect(thumb.closest("a, button")).toBeNull();
      expect(thumb).not.toHaveAttribute("tabindex");
      expect(thumb).not.toHaveAttribute("role");
      expect(thumb.parentElement).not.toHaveClass("overflow-x-auto");
    }
    expect(screen.queryByRole("button", { name: /sunny lisbon/i })).not.toBeInTheDocument();
  });

  it("gallery: no photos renders a dashed stone placeholder without text", async () => {
    const { container } = await renderLoaded({ photos: [] });
    const placeholders = container.querySelectorAll(".border-dashed");
    expect(placeholders).toHaveLength(1);
    const ph = placeholders[0]!;
    expect(ph).toHaveClass("border-2", "border-border", "bg-stone");
    expect(radiusClasses(ph)).toEqual([]);
    expect(ph).toBeEmptyDOMElement();
    expect(ph.textContent).toBe("");
    expect(container.querySelector(".bg-slate-100")).toBeNull();
    expect(container.querySelector(".rounded-xl")).toBeNull();
  });

  it("amenities: a list with one flat 2px-edged listitem per amenity", async () => {
    await renderLoaded();
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item).toHaveClass("border-2", "border-border");
      expect(item.className).not.toMatch(/rounded-(full|pill)/);
    }
    expect(screen.getAllByText("WIFI")).toHaveLength(1);
    expect(screen.getAllByText("KITCHEN")).toHaveLength(1);
  });

  it("rating: text kept, emoji gone, one aria-hidden svg precedes the text", async () => {
    const { container } = await renderLoaded();
    const text = screen.getByText("4.5 / 5 (3 reviews)");
    expect(container.textContent).not.toContain("⭐");
    const section = screen.getByRole("heading", {
      level: 2,
      name: t("listings.detail.rating"),
    }).parentElement!;
    const svgs = section.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
    expect(svgs[0]).toHaveAttribute("aria-hidden", "true");
    const precedes =
      text.contains(svgs[0]!) ||
      Boolean(svgs[0]!.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(precedes).toBe(true);
  });

  it("rating: null average shows the no-reviews line and draws no star", async () => {
    const { container } = await renderLoaded({ avgRating: null });
    expect(screen.getByText(t("listings.detail.no_reviews"))).toBeInTheDocument();
    const section = screen.getByRole("heading", {
      level: 2,
      name: t("listings.detail.rating"),
    }).parentElement!;
    expect(section.querySelector("svg")).toBeNull();
    expect(container.textContent).not.toContain("⭐");
  });

  it("booking panel: ember price band with ink text only, paper panel with ink edge, no shadow, sticky", async () => {
    await renderLoaded();
    const price = screen.getByText(/90/);
    const band = price.closest<HTMLElement>(".bg-ember");
    expect(band).not.toBeNull();
    expect(band).toHaveClass("text-fg", "border-b-2", "border-border");
    expect(band).toHaveTextContent(t("search.per_night"));
    expect(band).toHaveTextContent(/90/);
    expect(price.className + band!.className).toContain("tabular-nums");
    for (const el of [band!, ...Array.from(band!.querySelectorAll("*"))]) {
      expect(el.className).not.toMatch(/text-fg-(muted|subtle|inverse)/);
    }
    expect(band!.querySelector("button, input, a, select")).toBeNull();

    const panel = band!.parentElement!;
    expect(panel).toHaveClass("border-2", "border-border", "bg-surface-raised", "md:sticky");
    expect(panel.className).not.toMatch(/shadow/);
    expect(panel.className).not.toMatch(/overflow-hidden/);
    expect(radiusClasses(panel).every((c) => c === "rounded-card")).toBe(true);
  });

  it("booking panel: guest with valid dates links Book now to the booking URL", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "guest@test.com", roles: ["guest"] },
      isLoading: false,
    });
    mockGetDetail.mockResolvedValue(mockListing);
    renderDetail("listing-1", "?checkIn=2026-07-10&checkOut=2026-07-12");
    const link = await screen.findByRole("link", { name: /book now/i });
    expect(link).toHaveAttribute(
      "href",
      "/listings/listing-1/book?checkIn=2026-07-10&checkOut=2026-07-12",
    );
    expect(link.tagName).toBe("A");
    expect(link.querySelector("button")).toBeNull();
    expect(link.closest("button")).toBeNull();
  });

  it("booking panel: guest without dates gets a disabled Book now", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "guest@test.com", roles: ["guest"] },
      isLoading: false,
    });
    await renderLoaded();
    expect(screen.getByRole("button", { name: /book now/i })).toBeDisabled();
    expect(screen.queryByRole("link", { name: /book now/i })).not.toBeInTheDocument();
  });

  it("booking panel: visitor sees Log in to book linking to /login", async () => {
    await renderLoaded();
    const link = screen.getByRole("link", { name: /log in to book/i });
    expect(link).toHaveAttribute("href", "/login");
    expect(link.tagName).toBe("A");
    expect(link.querySelector("button")).toBeNull();
    expect(link.closest("button")).toBeNull();
    expect(link.className).not.toMatch(/box-shadow|ring/);
  });

  it("loading: keeps its test id, is busy, has no h1 and no pill or xl radius", async () => {
    mockGetDetail.mockReturnValue(new Promise(() => {}));
    renderDetail();
    const skeleton = screen.getByTestId("listing-detail-skeleton");
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(skeleton.querySelector(".rounded-xl, .rounded-pill, .rounded-full")).toBeNull();
    expect(skeleton.innerHTML).not.toMatch(/shadow/);
  });

  it("not-found: one h1, paper sign panel with an ink tile, no alert", async () => {
    mockGetDetail.mockRejectedValue(new ApiError(404, { error: "Not found" }));
    renderDetail();
    const h1 = await screen.findByRole("heading", {
      level: 1,
      name: t("listings.detail.not_found"),
    });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    const panel = panelOf(h1);
    expect(panel).toHaveClass("border-border", "bg-surface-raised");
    expect(panel).not.toHaveClass("border-dashed");
    expect(tileOf(panel)).toHaveClass("bg-fg");
  });

  it("error: one alert holding one h1, solid danger edge, tint fill, filled tile", async () => {
    mockGetDetail.mockRejectedValue(new ApiError(500, { error: "boom" }));
    renderDetail();
    const h1 = await screen.findByRole("heading", {
      level: 1,
      name: t("error.generic.unexpected"),
    });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.contains(h1)).toBe(true);
    expect(alerts[0]).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
    expect(tileOf(alerts[0]!)).toHaveClass("bg-danger");
  });

  it("dictionary: strings read by the page are identical to the baseline", () => {
    const baseline: Record<string, string> = {
      "listings.detail.amenities": "Amenities",
      "listings.detail.reviews": "Reviews",
      "listings.detail.no_reviews": "No reviews yet.",
      "listings.detail.rating": "Rating",
      "listings.detail.book_now": "Book now",
      "listings.detail.login_to_book": "Log in to book",
      "listings.detail.capacity": "Capacity",
      "listings.detail.not_found": "Listing not found.",
      "listings.detail.guests": "guests",
      "host.listings.type_property": "Property",
      "host.listings.type_workspace": "Workspace",
      "search.per_night": "per night",
      "error.generic.unexpected": "Something went wrong. Please try again.",
    };
    for (const [key, value] of Object.entries(baseline)) {
      expect(t(key as LocaleKey)).toBe(value);
    }
    const used = Array.from(pageSource.matchAll(/\bt\(\s*"([^"]+)"\s*\)/g), (m) => m[1]!);
    expect(used.length).toBeGreaterThan(0);
    for (const key of used) {
      expect(t(key as LocaleKey)).not.toContain("key-not-found");
    }
  });
});
