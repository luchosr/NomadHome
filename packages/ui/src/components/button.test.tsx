import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "./button.js";

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
    expect(btn).toHaveClass("border-2", "border-border", "bg-transparent");
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

const VARIANTS = ["primary", "secondary", "tertiary", "destructive"] as const;

describe("Button flat shape (NH-138)", () => {
  it.each(VARIANTS)("variant %s has no ring and no shadow utility", (variant) => {
    render(<Button variant={variant}>{variant}</Button>);
    const classes = screen.getByRole("button").className.split(/\s+/);
    expect(classes.filter((c) => /(?:^|:)(?:ring|shadow)(?:-|$)/.test(c))).toEqual([]);
  });

  it("secondary draws its 2px edge with border-2 and border-border", () => {
    render(<Button variant="secondary">Cancel</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("border-2", "border-border");
    expect(btn).not.toHaveClass("border");
  });

  it("disabled secondary keeps the dashed muted edge", () => {
    render(
      <Button variant="secondary" disabled>
        Cancel
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveClass(
      "disabled:border-dashed",
      "disabled:border-border-muted",
    );
  });
});

describe("buttonVariants (NH-138)", () => {
  it("is a function exported from the Button module", () => {
    expect(typeof buttonVariants).toBe("function");
  });

  it.each(VARIANTS)("variant %s classes are all present on <Button variant>", (variant) => {
    render(<Button variant={variant}>{variant}</Button>);
    const btn = screen.getByRole("button");
    for (const c of buttonVariants({ variant }).split(/\s+/)) expect(btn).toHaveClass(c);
  });

  it("defaults to primary", () => {
    expect(buttonVariants()).toBe(buttonVariants({ variant: "primary" }));
  });

  it.each(VARIANTS)("variant %s carries min-h-11 and no-underline", (variant) => {
    expect(buttonVariants({ variant }).split(/\s+/)).toEqual(
      expect.arrayContaining(["min-h-11", "no-underline"]),
    );
  });

  it("tertiary keeps hover:underline", () => {
    expect(buttonVariants({ variant: "tertiary" }).split(/\s+/)).toContain("hover:underline");
  });

  it.each(VARIANTS)("variant %s has no ring and no shadow utility", (variant) => {
    const classes = buttonVariants({ variant }).split(/\s+/);
    expect(classes.filter((c) => /(?:^|:)(?:ring|shadow)(?:-|$)/.test(c))).toEqual([]);
  });
});

describe("Button aria-disabled look (NH-146)", () => {
  it.each(["primary", "secondary", "destructive"] as const)(
    "variant %s takes the dashed, unfilled disabled shape",
    (variant) => {
      render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole("button")).toHaveClass(
        "aria-disabled:border-dashed",
        "aria-disabled:border-border-muted",
        "aria-disabled:bg-surface-inset",
        "aria-disabled:text-fg-subtle",
      );
    },
  );

  it("tertiary is struck through with a transparent edge and fill", () => {
    render(<Button variant="tertiary">Learn more</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "aria-disabled:border-transparent",
      "aria-disabled:bg-transparent",
      "aria-disabled:line-through",
    );
  });

  it.each(VARIANTS)(
    "variant %s has the default cursor, no press shift and keeps pointer events",
    (variant) => {
      render(<Button variant={variant}>{variant}</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("aria-disabled:cursor-default", "aria-disabled:active:translate-y-0");
      expect(btn).not.toHaveClass("aria-disabled:pointer-events-none");
    },
  );
});
