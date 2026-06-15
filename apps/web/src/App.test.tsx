import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.js";

describe("App shell", () => {
  it("renders the app name sourced from the t() helper", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "NomadHome" })).toBeInTheDocument();
  });
});
