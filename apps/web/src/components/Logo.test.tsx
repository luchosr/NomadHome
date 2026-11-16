import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { t } from "@nomadhome/shared";
import { Logo } from "./Logo.js";

describe("Logo", () => {
  it("shows the product name and a decorative mark", () => {
    const { container } = render(<Logo />);
    expect(screen.getByText(t("common.app.name"))).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
