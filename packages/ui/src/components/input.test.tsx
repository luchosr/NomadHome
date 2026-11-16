import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./input.js";

const LEGACY_SCALE_CLASS = /(?:^|[\s:])[a-z-]*-(?:sand|ink|forest|terracotta)-\d+/;

describe("Input", () => {
  it("renders an accessible textbox", () => {
    render(<Input aria-label="City" placeholder="Where to?" />);
    expect(screen.getByRole("textbox", { name: "City" })).toBeInTheDocument();
  });

  it("forwards the value prop", () => {
    render(<Input aria-label="City" value="CDMX" readOnly />);
    expect(screen.getByRole("textbox")).toHaveValue("CDMX");
  });

  it("uses no legacy scale classes and merges caller classes", () => {
    render(<Input aria-label="City" className="w-24" />);
    const el = screen.getByRole("textbox");
    expect(el.className).not.toMatch(LEGACY_SCALE_CLASS);
    expect(el).toHaveClass("w-24");
  });
});
