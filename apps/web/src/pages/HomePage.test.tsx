import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t, type LocaleKey } from "@nomadhome/shared";
import { HomePage } from "./HomePage.js";
import { CtaBandSection } from "./home/CtaBandSection.js";
import { SectionHeading } from "./home/SectionHeading.js";
import { FeatureList } from "./home/FeatureList.js";
import { LOCATION_CARDS, STAT_ITEMS, FOOTER_NAV_COLS } from "./home/constants.js";

vi.mock("../contexts/auth.js", () => ({ useAuth: vi.fn() }));
import { useAuth } from "../contexts/auth.js";
const mockUseAuth = vi.mocked(useAuth);

const tk = (key: string) => t(key as LocaleKey);

function setUser(user: unknown) {
  mockUseAuth.mockReturnValue({ user, isLoading: false } as ReturnType<typeof useAuth>);
}

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

beforeEach(() => setUser(null));

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

  it("renders featured stay rows as links to search", async () => {
    renderHome();
    const title = await screen.findByText(tk("home.featured.cards.oaxaca.title"));
    expect(title.closest("a")).toHaveAttribute("href", "/search");
    expect(screen.getByText(tk("home.featured.cards.lisbon.tag"))).toBeInTheDocument();
  });

  it("shows co-living price panel and feature checklist", async () => {
    renderHome();
    expect(await screen.findByText(tk("home.coliving.price_value"))).toBeInTheDocument();
    expect(screen.getByText(tk("home.coliving.feature_1"))).toBeInTheDocument();
    expect(screen.getByText(tk("home.coliving.feature_3"))).toBeInTheDocument();
  });

  it("shows the workspace status strip, image alt and checklist", async () => {
    renderHome();
    expect(await screen.findByAltText(tk("home.workspace.image_alt"))).toBeInTheDocument();
    expect(screen.getByText(tk("home.workspace.status_open"))).toBeInTheDocument();
    expect(screen.getByText(tk("home.workspace.feature_2"))).toBeInTheDocument();
  });

  it("shows stats and testimonial with attribution", async () => {
    renderHome();
    for (const s of STAT_ITEMS) {
      expect(await screen.findByText(tk(s.lKey))).toBeInTheDocument();
      expect(screen.getByText(s.v, { selector: "p" })).toBeInTheDocument();
    }
    expect(
      screen.getByText(new RegExp(tk("home.testimonial.quote_original_1"))),
    ).toBeInTheDocument();
    expect(screen.getByText(tk("home.testimonial.author_name"))).toBeInTheDocument();
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
