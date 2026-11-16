import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge.js";

const LEGACY_SCALE_CLASS = /(?:^|[\s:])[a-z-]*-(?:sand|ink|forest|terracotta)-\d+/;

const OLD_GANTRY_CLASS =
  /(?:^|[\s:])[a-z-]*-(?:signal|sign-green|black|white)\b|surface-(?:signal|green)/;

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Resident</Badge>);
    expect(screen.getByText("Resident")).toBeInTheDocument();
  });

  it("applies the success tone", () => {
    render(<Badge tone="success">Confirmed</Badge>);
    expect(screen.getByText("Confirmed")).toHaveClass("text-success");
  });

  it.each(["neutral", "success", "warning", "danger", "info", "accent"] as const)(
    "tone %s uses no legacy scale classes",
    (tone) => {
      render(<Badge tone={tone}>{tone}</Badge>);
      expect(screen.getByText(tone).className).not.toMatch(LEGACY_SCALE_CLASS);
    },
  );

  // Spec (warm-palette-swap): accent badge is ember fill, ink text, ink edge.
  it("renders the accent tone as an ember fill with ink text and an ink edge", () => {
    render(<Badge tone="accent">New</Badge>);
    expect(screen.getByText("New")).toHaveClass("bg-ember", "text-fg", "border-border");
  });

  it.each(["neutral", "success", "warning", "danger", "info", "accent"] as const)(
    "tone %s uses no old Gantry palette classes",
    (tone) => {
      render(<Badge tone={tone}>{tone}</Badge>);
      expect(screen.getByText(tone).className).not.toMatch(OLD_GANTRY_CLASS);
    },
  );

  // Spec: "State is conveyed by shape as well as colour" (solid / dashed / struck).
  it("conveys the available state as a solid shape", () => {
    render(<Badge tone="success">Available</Badge>);
    expect(screen.getByText("Available")).toHaveClass("border-solid");
  });

  it("conveys a tentative state as a dashed shape", () => {
    render(<Badge tone="warning">Pending</Badge>);
    expect(screen.getByText("Pending")).toHaveClass("border-dashed");
  });

  it("conveys an unavailable state as a struck shape", () => {
    render(<Badge tone="danger">Unavailable</Badge>);
    expect(screen.getByText("Unavailable")).toHaveClass("line-through");
  });
});
