import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as ui from "../index.js";

// Spec: "Wayfinding pictograms and arrows ship as shared primitives".
describe("Pictogram", () => {
  it("is exported from the package entry point", () => {
    expect(ui.Pictogram).toBeDefined();
    expect(ui.Arrow).toBeDefined();
  });

  it.each(["bed", "desk"] as const)("%s is decorative by default", (name) => {
    const { container } = render(<ui.Pictogram name={name} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
    expect(svg).not.toHaveAttribute("aria-label");
  });

  it("exposes role=img and the label as accessible name when labelled", () => {
    const { getByRole } = render(<ui.Pictogram name="bed" label="Live" />);
    const svg = getByRole("img", { name: "Live" });
    expect(svg).not.toHaveAttribute("aria-hidden", "true");
  });

  it("inherits text colour and uses no icon font or external asset", () => {
    const { container } = render(<ui.Pictogram name="desk" />);
    expect(container.innerHTML).toContain("currentColor");
    expect(container.querySelector("img, use[href^='http'], i")).toBeNull();
  });
});

describe("Arrow", () => {
  it("is decorative by default and inherits colour", () => {
    const { container } = render(<ui.Arrow />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(container.innerHTML).toContain("currentColor");
  });

  it("exposes a label when provided", () => {
    const { getByRole } = render(<ui.Arrow label="Next" />);
    expect(getByRole("img", { name: "Next" })).toBeInTheDocument();
  });
});
