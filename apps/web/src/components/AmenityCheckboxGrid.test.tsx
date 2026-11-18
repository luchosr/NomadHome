import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AmenityCheckboxGrid } from "./AmenityCheckboxGrid.js";
import { AMENITIES } from "../lib/listingData.js";

// NH-122 identity tests (host-identity, task 1.7). jsdom does not compute Tailwind, so shape is
// asserted through class tokens. Selector assumptions:
//  - the control is the native input (role "checkbox"), label = its closest label;
//  - the check glyph = an [aria-hidden="true"] svg inside the label.
// Tests marked GUARD pass before the restyle and must keep passing.

function setup(selected: string[] = ["wifi"]) {
  const onToggle = vi.fn();
  const utils = render(
    <AmenityCheckboxGrid amenities={AMENITIES} selected={new Set(selected)} onToggle={onToggle} />,
  );
  return { onToggle, ...utils };
}

describe("AmenityCheckboxGrid", () => {
  it("GUARD: every amenity is a checkbox named by its label and the selected one is checked", () => {
    setup(["wifi"]);
    expect(screen.getAllByRole("checkbox")).toHaveLength(AMENITIES.length);
    expect(screen.getByRole("checkbox", { name: "Wi-Fi" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Kitchen" })).not.toBeChecked();
  });

  it("GUARD: clicking a label calls the handler once with that amenity code", async () => {
    const { onToggle } = setup();
    await userEvent.click(screen.getByText("Kitchen"));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("kitchen");
  });

  it("GUARD: Space on a focused checkbox calls the handler once with that amenity code", async () => {
    const { onToggle } = setup();
    screen.getByRole("checkbox", { name: "Laundry" }).focus();
    await userEvent.keyboard(" ");
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("laundry");
  });

  it("each input is the square 2px ink box with no radius and no accent colour", () => {
    setup();
    for (const box of screen.getAllByRole("checkbox")) {
      expect(box).toHaveClass("h-5", "w-5", "border-2", "border-border", "rounded-none");
      expect(box).toHaveClass("appearance-none", "checked:bg-ink");
      expect(box).not.toHaveClass("accent-action");
      expect(box).not.toHaveClass("rounded");
    }
  });

  it("each label is a 44px target holding an aria-hidden check glyph", () => {
    setup();
    for (const box of screen.getAllByRole("checkbox")) {
      const label = box.closest("label");
      expect(label).not.toBeNull();
      expect(label).toHaveClass("min-h-11");
      expect(label?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    }
  });
});
