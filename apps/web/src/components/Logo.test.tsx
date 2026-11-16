import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { t } from "@nomadhome/shared";
import { Logo } from "./Logo.js";

describe("Logo", () => {
  it("shows the product name and a decorative mark", () => {
    const { container } = render(<Logo />);
    expect(screen.getByText(t("common.app.name"))).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  // Spec (warm-palette-swap): ember square, ink arch and base; no old Gantry hex.
  it("draws the mark in ember and ink, not the old yellow and black", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg")!.outerHTML.toLowerCase();
    expect(svg).toContain("#e65f35");
    expect(svg).toContain("#1e1e1e");
    expect(svg).not.toContain("#ffc700");
    expect(svg).not.toContain("#0a0a0a");
  });
});
