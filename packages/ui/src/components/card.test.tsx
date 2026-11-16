import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./card.js";

const LEGACY_SCALE_CLASS = /(?:^|[\s:])[a-z-]*-(?:sand|ink|forest|terracotta)-\d+/;

describe("Card", () => {
  it("renders its children inside a bordered surface", () => {
    render(<Card>A quiet desk</Card>);
    expect(screen.getByText("A quiet desk")).toHaveClass("border");
  });

  it("uses no old Gantry palette classes, including when interactive", () => {
    render(
      <>
        <Card>Plain</Card>
        <Card interactive>Tappable</Card>
      </>,
    );
    const re = /(?:^|[\s:])[a-z-]*-(?:signal|sign-green|black|white)\b|surface-(?:signal|green)/;
    expect(screen.getByText("Plain").className).not.toMatch(re);
    expect(screen.getByText("Tappable").className).not.toMatch(re);
  });

  it("uses no legacy scale classes, including when interactive", () => {
    render(
      <>
        <Card>Plain</Card>
        <Card interactive>Tappable</Card>
      </>,
    );
    expect(screen.getByText("Plain").className).not.toMatch(LEGACY_SCALE_CLASS);
    expect(screen.getByText("Tappable").className).not.toMatch(LEGACY_SCALE_CLASS);
  });
});
