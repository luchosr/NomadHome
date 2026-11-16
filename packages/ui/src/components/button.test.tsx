import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button.js";

const LEGACY_SCALE_CLASS = /(?:^|[\s:])[a-z-]*-(?:sand|ink|forest|terracotta)-\d+/;

// Spec (warm-palette-swap): no Gantry yellow/green or black/white utilities.
const OLD_GANTRY_CLASS =
  /(?:^|[\s:])[a-z-]*-(?:signal|sign-green|black|white)\b|surface-(?:signal|green)/;

describe("Button", () => {
  it("renders its children as an accessible button", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("defaults to the solid ink primary variant with paper lettering", () => {
    render(<Button>Book this stay</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("bg-action");
    expect(btn.className).toMatch(/\btext-(action-fg|fg-inverse)\b/);
    expect(btn.className).not.toMatch(LEGACY_SCALE_CLASS);
    expect(btn.className).not.toMatch(OLD_GANTRY_CLASS);
  });

  it("renders an outlined, transparent-fill secondary variant", () => {
    render(<Button variant="secondary">Cancel</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("border", "bg-transparent");
    expect(btn.className).not.toMatch(/\bbg-action\b/);
    expect(btn.className).not.toMatch(LEGACY_SCALE_CLASS);
  });

  it("renders a link-style tertiary variant without legacy classes", () => {
    render(<Button variant="tertiary">Learn more</Button>);
    expect(screen.getByRole("button").className).not.toMatch(LEGACY_SCALE_CLASS);
  });

  it("renders the destructive variant without legacy classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button").className).not.toMatch(LEGACY_SCALE_CLASS);
  });

  it.each(["primary", "secondary", "tertiary", "destructive"] as const)(
    "variant %s uses no old Gantry palette classes",
    (variant) => {
      render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole("button").className).not.toMatch(OLD_GANTRY_CLASS);
    },
  );

  it("keeps the same props surface (type, disabled, onClick passthrough)", () => {
    render(
      <Button type="submit" disabled>
        Go
      </Button>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("type", "submit");
  });
});
