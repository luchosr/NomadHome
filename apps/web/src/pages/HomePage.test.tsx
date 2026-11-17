import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t, type LocaleKey, type SearchResponse, type SearchResultItem } from "@nomadhome/shared";
import { HomePage } from "./HomePage.js";
import { CtaBandSection } from "./home/CtaBandSection.js";
import { SectionHeading } from "./home/SectionHeading.js";
import { FeatureList } from "./home/FeatureList.js";
import { LOCATION_CARDS, FOOTER_NAV_COLS } from "./home/constants.js";

vi.mock("../contexts/auth.js", () => ({ useAuth: vi.fn() }));

const mockSearch = vi.fn();
vi.mock("../api/search.js", () => ({
  searchApi: { search: (...args: unknown[]) => mockSearch(...args) },
}));
import { useAuth } from "../contexts/auth.js";
const mockUseAuth = vi.mocked(useAuth);

const tk = (key: string) => t(key as LocaleKey);

function setUser(user: unknown) {
  mockUseAuth.mockReturnValue({ user, isLoading: false } as ReturnType<typeof useAuth>);
}

const REAL_LISTINGS: SearchResultItem[] = [
  {
    id: "listing-a",
    title: "Alfama Loft",
    type: "PROPERTY",
    city: "Lisbon",
    country: "PT",
    nightlyRateCents: 7500,
    currency: "USD",
    totalCents: 7500,
    primaryPhotoUrl: null,
    amenities: ["wifi"],
  },
  {
    id: "listing-b",
    title: "Mitte Desk Suite",
    type: "WORKSPACE",
    city: "Berlin",
    country: "DE",
    nightlyRateCents: 4200,
    currency: "EUR",
    totalCents: 4200,
    primaryPhotoUrl: null,
    amenities: [],
  },
];

function searchResponse(data: SearchResultItem[]): SearchResponse {
  return { data, pagination: { total: data.length, page: 1, pageSize: 3, hasMore: false } };
}

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Waits until every lazy section (down to the CTA band) and the search settled. */
async function renderSettledHome() {
  const view = renderHome();
  await screen.findByRole("heading", { level: 2, name: new RegExp(tk("home.cta.headline_pre")) });
  await screen.findByRole("contentinfo");
  await waitFor(() => expect(mockSearch).toHaveBeenCalled());
  return view;
}

beforeEach(() => {
  setUser(null);
  mockSearch.mockReset();
  mockSearch.mockResolvedValue(searchResponse(REAL_LISTINGS));
});

describe("HomePage landing sections", () => {
  it("renders every section heading once lazy sections resolve", async () => {
    renderHome();
    const headings = [
      "home.featured.headline_pre",
      "home.how_it_works.headline_pre",
      "home.coliving.headline_pre",
      "home.workspace.headline_pre",
      "home.locations.headline_pre",
      "home.cta.headline_pre",
    ];
    for (const key of headings) {
      const h = await screen.findByRole("heading", { level: 2, name: new RegExp(tk(key)) });
      expect(h).toBeInTheDocument();
    }
  });

  it("lists the three numbered how-it-works steps", async () => {
    renderHome();
    await screen.findByRole("heading", { name: tk("home.how_it_works.step_01_heading") });
    expect(
      screen.getByRole("heading", { name: tk("home.how_it_works.step_02_heading") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: tk("home.how_it_works.step_03_heading") }),
    ).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("links each location row to search with that city preselected", async () => {
    renderHome();
    for (const loc of LOCATION_CARDS) {
      const city = tk(loc.cityKey);
      const link = (await screen.findByText(city, { selector: "span" })).closest("a");
      expect(link).toHaveAttribute("href", `/search?city=${encodeURIComponent(city)}`);
    }
  });

  it("links explore-all and see-all to /search", async () => {
    renderHome();
    const explore = await screen.findByRole("link", { name: tk("home.locations.explore_all") });
    expect(explore).toHaveAttribute("href", "/search");
    expect(screen.getByRole("link", { name: tk("home.featured.see_all") })).toHaveAttribute(
      "href",
      "/search",
    );
  });

  it("renders featured stay rows from the search API as links to the listing", async () => {
    renderHome();
    const title = await screen.findByText("Alfama Loft");
    expect(title.closest("a")).toHaveAttribute("href", "/listings/listing-a");
    expect(screen.getByText("Mitte Desk Suite").closest("a")).toHaveAttribute(
      "href",
      "/listings/listing-b",
    );
  });

  it("shows the co-living feature checklist without an example rate", async () => {
    renderHome();
    expect(await screen.findByText(tk("home.coliving.feature_1"))).toBeInTheDocument();
    expect(screen.getByText(tk("home.coliving.feature_3"))).toBeInTheDocument();
  });

  it("shows the workspace image alt and checklist without a status strip", async () => {
    renderHome();
    expect(await screen.findByAltText(tk("home.workspace.image_alt"))).toBeInTheDocument();
    expect(screen.getByText(tk("home.workspace.feature_2"))).toBeInTheDocument();
  });

  it("renders the footer columns, links and legal row", async () => {
    renderHome();
    const footer = await screen.findByRole("contentinfo");
    for (const col of FOOTER_NAV_COLS) {
      expect(within(footer).getByRole("heading", { name: tk(col.hKey) })).toBeInTheDocument();
      for (const l of col.links) {
        expect(within(footer).getByRole("link", { name: tk(l) })).toBeInTheDocument();
      }
    }
    expect(within(footer).getByText(tk("home.footer.tagline"))).toBeInTheDocument();
    expect(
      within(footer).getByRole("link", { name: tk("home.footer.privacy") }),
    ).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: tk("home.footer.terms") })).toBeInTheDocument();
    expect(
      within(footer).getByRole("link", { name: tk("home.footer.cookies") }),
    ).toBeInTheDocument();
    expect(within(footer).getByText(tk("home.footer.copyright"))).toBeInTheDocument();
  });
});

describe("CtaBandSection", () => {
  it("offers search and register to guests", () => {
    setUser(null);
    render(
      <MemoryRouter>
        <CtaBandSection />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: new RegExp(t("search.submit")) })).toHaveAttribute(
      "href",
      "/search",
    );
    expect(screen.getByRole("link", { name: t("nav.register") })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("hides register for signed-in users", () => {
    setUser({ id: "u1", email: "a@b.c", roles: ["guest"] });
    render(
      <MemoryRouter>
        <CtaBandSection />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: new RegExp(t("search.submit")) })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: t("nav.register") })).toBeNull();
  });
});

describe("SectionHeading", () => {
  it("ends with a period when there is no post text", () => {
    render(<SectionHeading pre="Find" em="home" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Find home.");
  });

  it("uses the post text instead of a period", () => {
    render(<SectionHeading pre="Find" em="home" post="fast" />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Find home fast");
  });
});

describe("FeatureList", () => {
  const keys = ["home.coliving.feature_1", "home.coliving.feature_2"] as LocaleKey[];

  it("renders one decorated item per feature", () => {
    const { container } = render(<FeatureList features={keys} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText(t(keys[0]!))).toBeInTheDocument();
    expect(container.querySelectorAll("svg[aria-hidden='true']")).toHaveLength(2);
  });

  it("pads items in flush mode", () => {
    render(<FeatureList features={keys} flush />);
    expect(screen.getAllByRole("listitem")[0]).toHaveClass("px-6");
  });
});

describe("HomePage without invented content (NH-121)", () => {
  it("has no statistics strip, NPS figure or testimonial", async () => {
    mockSearch.mockResolvedValue(searchResponse([]));
    const { container } = await renderSettledHome();
    expect(container).not.toHaveTextContent(/NPS|occupancy|private rooms/i);
    expect(container.querySelector("blockquote, figure, figcaption, cite")).toBeNull();
    expect(container).not.toHaveTextContent(/Andr[eé]s Soto|stayed three months|Casa del Fig/i);
  });

  it("shows no price value anywhere when there are no real listings", async () => {
    mockSearch.mockResolvedValue(searchResponse([]));
    const { container } = await renderSettledHome();
    expect(container).not.toHaveTextContent(/[$€£]\s?\d|\/\s*mo\b/);
    expect(container).not.toHaveTextContent(/workspace listing(?!s)|dedicated desk/i);
  });

  it("shows only real prices, in the API currency, when listings exist", async () => {
    const { container } = await renderSettledHome();
    await screen.findByText("Alfama Loft");
    const text = container.textContent ?? "";
    const prices = text.match(/[$€£]\s?\d[\d,]*(?:\.\d+)?/g) ?? [];
    expect(prices.sort()).toEqual(["$75.00", "€42.00"]);
    expect(text).not.toMatch(/\$1,100|\/\s*mo\b/);
  });

  it("hides the featured section (heading, see-all link, rows) for an empty result", async () => {
    mockSearch.mockResolvedValue(searchResponse([]));
    await renderSettledHome();
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", {
          level: 2,
          name: new RegExp(tk("home.featured.headline_pre")),
        }),
      ).toBeNull(),
    );
    expect(screen.queryByRole("link", { name: tk("home.featured.see_all") })).toBeNull();
    expect(
      screen.queryAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/listings/")),
    ).toHaveLength(0);
    // The rest of the page still renders.
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: new RegExp(tk("home.how_it_works.headline_pre")),
      }),
    ).toBeInTheDocument();
  });

  it("hides the featured section when the request fails, without error text", async () => {
    mockSearch.mockRejectedValue(new Error("API 500"));
    await renderSettledHome();
    await waitFor(() =>
      expect(screen.queryByRole("link", { name: tk("home.featured.see_all") })).toBeNull(),
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText(/something went wrong|try again|retry/i)).toBeNull();
  });
});

describe("HomePage section rhythm (NH-121)", () => {
  const FIELD_BG = /^bg-(?:surface-inverse|surface-inset|surface|sage|ember)$/;

  function fieldOf(section: Element): string {
    const token = section.className.split(/\s+/).find((c) => FIELD_BG.test(c));
    if (!token) throw new Error(`section without a background field: ${section.className}`);
    return token;
  }

  async function sections(data: SearchResultItem[]) {
    mockSearch.mockResolvedValue(searchResponse(data));
    const { container } = await renderSettledHome();
    if (data.length > 0) await screen.findByText(data[0]!.title);
    else
      await waitFor(() =>
        expect(screen.queryByRole("link", { name: tk("home.featured.see_all") })).toBeNull(),
      );
    return [...container.querySelectorAll("section")];
  }

  it("renders exactly hero, featured, how-it-works, co-living, workspace, locations and CTA", async () => {
    expect(await sections(REAL_LISTINGS)).toHaveLength(7);
  });

  it("renders six sections when the featured section is hidden", async () => {
    expect(await sections([])).toHaveLength(6);
  });

  it.each([
    ["with the featured section", REAL_LISTINGS],
    ["without the featured section", [] as SearchResultItem[]],
  ])("never repeats a background field between adjacent sections %s", async (_name, data) => {
    const fields = (await sections(data)).map(fieldOf);
    for (let i = 1; i < fields.length; i++) {
      expect(fields[i], `sections ${i - 1} and ${i} share ${fields[i]}`).not.toBe(fields[i - 1]);
    }
  });
});
