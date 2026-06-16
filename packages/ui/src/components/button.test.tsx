import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button.js";

describe("Button", () => {
  it("renders its children as an accessible button", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("defaults to the forest-filled primary variant", () => {
    render(<Button>Book this stay</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-forest-700");
  });

  it("renders a bordered, transparent secondary variant", () => {
    render(<Button variant="secondary">Cancel</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("border-forest-700");
    expect(btn).not.toHaveClass("bg-forest-700");
  });

  it("renders the destructive variant in terracotta", () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-terracotta-500");
  });
});
