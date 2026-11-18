import { render, screen, within } from "@testing-library/react";
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

// NH-122 identity tests (host-identity, tasks 1.1 to 1.3). jsdom does not compute Tailwind, so shape
// is asserted through class tokens. Selector assumptions:
//  - row = nearest ".rounded-card" ancestor of the listing title (the e2e locator is kept);
//  - thumbnail = parent of the listing img, or parent of the [aria-hidden] pictogram svg;
//  - pictogram = the only svg[aria-hidden="true"] in the row (bed has the headboard path "M4 5v22");
//  - status tag = the single element whose own text is exactly the status label;
//  - error panel = the single role="alert" element; tile = its [aria-hidden="true"] descendant.
// Tests marked GUARD pass before the restyle and must keep passing.

function required<T extends Element>(el: T | null, what: string): T {
  if (!el) throw new Error(`missing structure: ${what}`);
  return el;
}

function rowOf(title: string): HTMLElement {
  return required(screen.getByText(title).closest<HTMLElement>(".rounded-card"), `row ${title}`);
}

function hasClassMatching(el: Element, re: RegExp): boolean {
  return Array.from(el.classList).some((c) => re.test(c));
}

function listing(
  id: string,
  title: string,
  overrides: Partial<(typeof mockListings)[number]> = {},
): (typeof mockListings)[number] {
  return { ...(mockListings[0] as (typeof mockListings)[number]), id, title, ...overrides };
}

const MIXED = [
  listing("m1", "Photo Cabin", { status: "PUBLISHED" }),
  listing("m2", "Draft Flat", { status: "DRAFT", primaryPhotoUrl: null, _count: { bookings: 0 } }),
  listing("m3", "Desk Space", {
    status: "DISABLED",
    type: "WORKSPACE" as never,
    primaryPhotoUrl: null,
    _count: { bookings: 1 },
  }),
];

describe("HostListingsPage identity: header and actions", () => {
  beforeEach(() => {
    mockListMine.mockReset();
    mockListMine.mockResolvedValue(MIXED);
  });

  it("has exactly one black h1 and no ember surface", async () => {
    const { container } = renderPage();
    await screen.findByText("Photo Cabin");
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("My Listings");
    expect(h1s[0]).toHaveClass("font-black", "text-fg");
    expect(container.innerHTML).not.toMatch(/ember/);
  });

  it("GUARD: New listing and each Edit keep their destination and accessible name", async () => {
    renderPage();
    await screen.findByText("Photo Cabin");
    expect(screen.getByRole("link", { name: "New listing" })).toHaveAttribute(
      "href",
      "/host/listings/new",
    );
    const edits = screen.getAllByRole("link", { name: "Edit" });
    expect(edits.map((a) => a.getAttribute("href"))).toEqual([
      "/host/listings/m1/edit",
      "/host/listings/m2/edit",
      "/host/listings/m3/edit",
    ]);
  });

  it("New listing is one link with no button inside and a 44px target", async () => {
    renderPage();
    await screen.findByText("Photo Cabin");
    const link = screen.getByRole("link", { name: "New listing" });
    expect(within(link).queryByRole("button")).toBeNull();
    expect(link.querySelector("button")).toBeNull();
    expect(link).toHaveClass("min-h-11");
  });

  it("each Edit is one link with no button inside and a 44px target", async () => {
    renderPage();
    await screen.findByText("Photo Cabin");
    for (const link of screen.getAllByRole("link", { name: "Edit" })) {
      expect(link.querySelector("button")).toBeNull();
      expect(link).toHaveClass("min-h-11");
    }
  });
});

describe("HostListingsPage identity: rows and thumbnails", () => {
  beforeEach(() => {
    mockListMine.mockReset();
    mockListMine.mockResolvedValue(MIXED);
  });

  it("each row keeps rounded-card, has the 2px ink border and no shadow or ring", async () => {
    renderPage();
    await screen.findByText("Photo Cabin");
    for (const title of ["Photo Cabin", "Draft Flat", "Desk Space"]) {
      const row = rowOf(title);
      expect(row).toHaveClass("rounded-card", "border-2", "border-border");
      expect(hasClassMatching(row, /^(shadow|ring)/)).toBe(false);
    }
  });

  it("the photo thumbnail is a framed square holding the img with the title alt", async () => {
    renderPage();
    await screen.findByText("Photo Cabin");
    const img = screen.getByRole("img", { name: "Photo Cabin" });
    const thumb = required(img.parentElement, "photo thumbnail");
    expect(thumb).toHaveClass("h-16", "w-16", "border-2", "border-border", "rounded-none");
  });

  it("a property without a photo shows an aria-hidden bed pictogram on a framed tile", async () => {
    renderPage();
    await screen.findByText("Draft Flat");
    const row = rowOf("Draft Flat");
    const glyph = required(row.querySelector('svg[aria-hidden="true"]'), "bed pictogram");
    expect(glyph.querySelector('path[d="M4 5v22"]')).not.toBeNull();
    expect(within(row).queryByRole("img")).toBeNull();
    const tile = required(glyph.parentElement, "pictogram tile");
    expect(tile).toHaveClass("border-2", "border-border", "rounded-none", "bg-surface-inset");
  });

  it("a workspace without a photo shows an aria-hidden desk pictogram on a framed tile", async () => {
    renderPage();
    await screen.findByText("Desk Space");
    const row = rowOf("Desk Space");
    const glyph = required(row.querySelector('svg[aria-hidden="true"]'), "desk pictogram");
    expect(glyph.querySelector('path[d="M4 5v22"]')).toBeNull();
    expect(glyph.querySelector('rect[x="2"][y="18"]')).not.toBeNull();
    const tile = required(glyph.parentElement, "pictogram tile");
    expect(tile).toHaveClass("border-2", "border-border", "rounded-none");
  });

  it("the confirmed-bookings text is intact and bold", async () => {
    renderPage();
    await screen.findByText("Photo Cabin");
    const count = screen.getByText("2 confirmed bookings");
    expect(count).toHaveClass("font-bold", "text-success");
    expect(screen.getByText("1 confirmed booking")).toBeInTheDocument();
  });
});

describe("HostListingsPage identity: status tags", () => {
  beforeEach(() => {
    mockListMine.mockReset();
    mockListMine.mockResolvedValue(MIXED);
  });

  it("GUARD: Published and Draft each match exactly one element", async () => {
    renderPage();
    await screen.findByText("Photo Cabin");
    expect(screen.getAllByText("Published")).toHaveLength(1);
    expect(screen.getAllByText("Draft")).toHaveLength(1);
    expect(screen.getAllByText("Disabled")).toHaveLength(1);
  });

  it("carries the status by shape through ListingStatusTag, never a pill", async () => {
    renderPage();
    await screen.findByText("Photo Cabin");
    expect(screen.getByText("Draft")).toHaveClass("border-2", "border-dashed");
    const published = screen.getByText("Published");
    expect(published).toHaveClass("border-2", "border-border");
    expect(published).not.toHaveClass("border-dashed");
    required(published.querySelector('[aria-hidden="true"]'), "published marker");
    expect(screen.getByText("Disabled")).toHaveClass("line-through", "border-border-muted");
    for (const label of ["Draft", "Published", "Disabled"]) {
      expect(screen.getByText(label)).not.toHaveClass("rounded-pill");
    }
  });
});

describe("HostListingsPage identity: states", () => {
  beforeEach(() => {
    mockListMine.mockReset();
  });

  it("empty: the existing text sits in a dashed 2px panel and the only link is New listing", async () => {
    mockListMine.mockResolvedValue([]);
    renderPage();
    const text = await screen.findByText("You have no listings yet.");
    const panel = required(text.closest<HTMLElement>(".border-dashed"), "dashed empty panel");
    expect(panel).toHaveClass("border-2", "border-border");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "New listing" })).toBeInTheDocument();
  });

  it("error: one alert holding one h1 with the generic text, solid danger edge, tint and a filled tile", async () => {
    mockListMine.mockRejectedValue(new Error("boom"));
    const { container } = renderPage();
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    const h1 = within(alert).getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent("Something went wrong. Please try again.");
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
    const tile = required(alert.querySelector<HTMLElement>('[aria-hidden="true"]'), "danger tile");
    expect(tile).toHaveClass("bg-danger");
    expect(container.querySelector(".max-w-5xl")?.contains(alert)).toBe(true);
  });

  it("loading: aria-busy, no h1 and no pill, rounded or shadow block", () => {
    mockListMine.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    const busy = required(container.querySelector('[aria-busy="true"]'), "aria-busy container");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    const classes = [busy, ...Array.from(busy.querySelectorAll("*"))].flatMap((el) =>
      Array.from(el.classList),
    );
    expect(classes.filter((c) => /^(rounded-(pill|md|lg|xl|full)|shadow.*)$/.test(c))).toEqual([]);
  });
});
