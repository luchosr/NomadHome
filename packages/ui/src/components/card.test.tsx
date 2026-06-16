import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./card.js";

describe("Card", () => {
  it("renders its children inside a rounded, bordered surface", () => {
    render(<Card>A quiet desk</Card>);
    const card = screen.getByText("A quiet desk");
    expect(card).toHaveClass("rounded-card");
    expect(card).toHaveClass("border");
  });
});
