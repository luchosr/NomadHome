import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { EmptyState } from "./EmptyState.js";

// NH-124 identity tests (booking-payment-identity, task 1.10). jsdom does not compute Tailwind, so
// shape is asserted through class tokens. Selector assumption: root = the message's parent element.
// Tests marked GUARD pass before the restyle and must keep passing.

function root(message: string): HTMLElement {
  const el = screen.getByText(message).parentElement;
  if (!el) throw new Error("missing structure: empty state root");
  return el;
}

describe("EmptyState", () => {
  it("is a flat 2px dashed panel with no rounded-xl", () => {
    render(
      <MemoryRouter>
        <EmptyState message="Nothing here" />
      </MemoryRouter>,
    );
    const el = root("Nothing here");
    expect(el).toHaveClass("border-2", "border-dashed", "border-border");
    expect(el).not.toHaveClass("rounded-xl");
    expect(Array.from(el.classList).filter((c) => /^shadow/.test(c))).toEqual([]);
  });

  it("GUARD: keeps the message and the optional link to ctaTo with ctaLabel", () => {
    render(
      <MemoryRouter>
        <EmptyState message="Nothing here" ctaLabel="Go search" ctaTo="/search" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go search" })).toHaveAttribute("href", "/search");
  });

  it("GUARD: renders no link when the cta props are missing", () => {
    render(
      <MemoryRouter>
        <EmptyState message="Nothing here" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });
});
