import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./input.js";

describe("Input", () => {
  it("renders an accessible textbox", () => {
    render(<Input aria-label="City" placeholder="Where to?" />);
    expect(screen.getByRole("textbox", { name: "City" })).toBeInTheDocument();
  });

  it("forwards the value prop", () => {
    render(<Input aria-label="City" value="CDMX" readOnly />);
    expect(screen.getByRole("textbox")).toHaveValue("CDMX");
  });
});
