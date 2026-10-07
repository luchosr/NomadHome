import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton } from "./skeleton.js";

describe("Skeleton", () => {
  it("renders a pulsing placeholder that merges caller classes", () => {
    render(<Skeleton data-testid="sk" className="h-4 w-24 rounded-full" />);
    const el = screen.getByTestId("sk");
    expect(el).toHaveClass("animate-pulse");
    expect(el).toHaveClass("h-4");
    expect(el).toHaveClass("w-24");
    expect(el).toHaveClass("rounded-full");
  });
});
