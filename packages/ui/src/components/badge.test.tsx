import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge.js";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Resident</Badge>);
    expect(screen.getByText("Resident")).toBeInTheDocument();
  });

  it("applies the success tone", () => {
    render(<Badge tone="success">Confirmed</Badge>);
    expect(screen.getByText("Confirmed")).toHaveClass("text-success");
  });
});
