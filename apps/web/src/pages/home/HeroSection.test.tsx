import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { t, type LocaleKey } from "@nomadhome/shared";
import { HeroSection } from "./HeroSection.js";

// New copy keys (home.hero.*) do not exist yet; the green phase adds them.
const tk = (key: string) => t(key as LocaleKey);

function Where() {
  const loc = useLocation();
  return <div data-testid="where">{loc.pathname + loc.search}</div>;
}

function renderHero() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <HeroSection />
      <Where />
    </MemoryRouter>,
  );
}

// Spec: "Landing and search screens use the Gantry Signage identity".
describe("HeroSection first viewport", () => {
  it("shows the city input, both date inputs and the search action", () => {
    renderHero();
    expect(screen.getByLabelText(t("home.hero.search_label"))).toBeInTheDocument();
    expect(screen.getByLabelText(tk("home.hero.checkin_label"))).toBeInTheDocument();
    expect(screen.getByLabelText(tk("home.hero.checkout_label"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("home.hero.search_aria") })).toBeInTheDocument();
  });

  it("shows a stay-length numeral derived from the dates", () => {
    renderHero();
    fireEvent.change(screen.getByLabelText(tk("home.hero.checkin_label")), {
      target: { value: "2027-01-01" },
    });
    fireEvent.change(screen.getByLabelText(tk("home.hero.checkout_label")), {
      target: { value: "2027-01-07" },
    });
    expect(screen.getByTestId("stay-length")).toHaveTextContent("6");
  });

  it("shows Live and Work pictograms sharing one arrow to the search action", () => {
    const { container } = renderHero();
    expect(screen.getByText(tk("home.hero.live_label"))).toBeInTheDocument();
    expect(screen.getByText(tk("home.hero.work_label"))).toBeInTheDocument();
    expect(container.querySelectorAll("svg[aria-hidden='true']").length).toBeGreaterThanOrEqual(3);
  });

  it("has no hero photo", () => {
    const { container } = renderHero();
    expect(container.querySelector("img")).toBeNull();
    expect(within(container).queryByRole("img")).toBeNull();
  });
});

// Spec (warm-palette-swap): placeholder text on orange is ink or sits in a paper field;
// fg-subtle on ember is 2.20:1 and fg-muted 3.20:1 (design.md D2/D5).
describe("HeroSection placeholder legibility on the orange panel", () => {
  it("never styles the city placeholder with fg-subtle or fg-muted directly on orange", () => {
    renderHero();
    const input = screen.getByLabelText(t("home.hero.search_label"));
    const cls = input.className;
    const paperFilled = /(?:^|\s)bg-surface(?:\s|$)/.test(cls);
    const inkPlaceholder = /placeholder:text-fg(?:\s|$)/.test(cls);
    expect(paperFilled || inkPlaceholder).toBe(true);
    if (!paperFilled) expect(cls).not.toMatch(/placeholder:text-fg-(?:subtle|muted)/);
  });

  it("uses no old Gantry palette classes in the hero", () => {
    const { container } = renderHero();
    expect(container.innerHTML).not.toMatch(
      /(?:^|[\s"':])[a-z-]*-(?:signal|sign-green|black|white)\b|surface-(?:signal|green)/,
    );
  });

  it("puts the hero on the ember panel with ink text", () => {
    const { container } = renderHero();
    const section = container.querySelector("section")!;
    expect(section).toHaveClass("bg-ember");
    expect(section.className).not.toMatch(/text-fg-inverse/);
  });
});

describe("HeroSection search submit (behavior unchanged)", () => {
  it("navigates to /search with the city query param", async () => {
    renderHero();
    await userEvent.type(screen.getByLabelText(t("home.hero.search_label")), "Lisbon");
    await userEvent.click(screen.getByRole("button", { name: t("home.hero.search_aria") }));
    expect(screen.getByTestId("where")).toHaveTextContent("/search?city=Lisbon");
  });

  it("keeps the same query parameters when dates are entered", async () => {
    renderHero();
    await userEvent.type(screen.getByLabelText(t("home.hero.search_label")), "Lisbon");
    fireEvent.change(screen.getByLabelText(tk("home.hero.checkin_label")), {
      target: { value: "2027-01-01" },
    });
    fireEvent.change(screen.getByLabelText(tk("home.hero.checkout_label")), {
      target: { value: "2027-01-07" },
    });
    await userEvent.click(screen.getByRole("button", { name: t("home.hero.search_aria") }));
    expect(screen.getByTestId("where")).toHaveTextContent("/search?city=Lisbon");
  });

  it("navigates to bare /search when the city is empty", async () => {
    renderHero();
    await userEvent.click(screen.getByRole("button", { name: t("home.hero.search_aria") }));
    expect(screen.getByTestId("where").textContent).toBe("/search");
  });
});
