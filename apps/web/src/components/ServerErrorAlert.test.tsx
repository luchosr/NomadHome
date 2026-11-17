import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ServerErrorAlert } from "./ServerErrorAlert.js";

describe("ServerErrorAlert", () => {
  it("renders nothing for null", () => {
    const { container } = render(<ServerErrorAlert error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an empty message", () => {
    const { container } = render(<ServerErrorAlert error="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders exactly one alert with the message", () => {
    render(<ServerErrorAlert error="Invalid email or password." />);
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent("Invalid email or password.");
  });

  it("has a solid danger edge and the danger tint fill", () => {
    render(<ServerErrorAlert error="Invalid email or password." />);
    expect(screen.getByRole("alert")).toHaveClass(
      "border-2",
      "border-solid",
      "border-danger",
      "bg-danger-bg",
    );
  });

  it("carries a decorative filled marker tile", () => {
    render(<ServerErrorAlert error="Invalid email or password." />);
    const tile = screen.getByRole("alert").querySelector('[aria-hidden="true"]');
    expect(tile).not.toBeNull();
    expect(tile).toHaveClass("bg-danger");
  });

  it("keeps the optional className", () => {
    render(<ServerErrorAlert error="Invalid email or password." className="mt-4" />);
    expect(screen.getByRole("alert")).toHaveClass("mt-4");
  });
});
