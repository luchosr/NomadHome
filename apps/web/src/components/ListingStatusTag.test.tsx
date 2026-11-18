import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ListingStatusTag } from "./ListingStatusTag.js";

// NH-122 identity tests (host-identity, task 1.2). ListingStatusTag does not exist before the
// restyle, so this file is red because the module is missing (expected: the component is created in
// the green phase). jsdom does not compute Tailwind, so shape is asserted through class tokens:
//  - tag = the single element whose own text is exactly the status label (the label is its only text
//    node, design D2); shape classes sit on that element;
//  - published marker = an empty [aria-hidden="true"] descendant of the tag.

function tag(label: string): HTMLElement {
  return screen.getByText(label, { exact: true });
}

describe("ListingStatusTag", () => {
  it("draft: the exact label, a dashed 2px ink edge, no marker, no strike", () => {
    render(<ListingStatusTag status="DRAFT" />);
    const el = tag("Draft");
    expect(el.textContent).toBe("Draft");
    expect(el).toHaveClass("border-2", "border-dashed", "border-border");
    expect(el).not.toHaveClass("line-through");
    expect(el.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it("published: the exact label, a solid 2px ink edge and an empty aria-hidden marker", () => {
    render(<ListingStatusTag status="PUBLISHED" />);
    const el = tag("Published");
    expect(el.textContent).toBe("Published");
    expect(el).toHaveClass("border-2", "border-border");
    expect(el).not.toHaveClass("border-dashed");
    expect(el).not.toHaveClass("line-through");
    const marker = el.querySelector('[aria-hidden="true"]');
    expect(marker).not.toBeNull();
    expect(marker?.textContent).toBe("");
  });

  it("disabled: the exact label, struck through with the solid muted edge", () => {
    render(<ListingStatusTag status="DISABLED" />);
    const el = tag("Disabled");
    expect(el.textContent).toBe("Disabled");
    expect(el).toHaveClass("border-2", "border-border-muted", "line-through");
    expect(el).not.toHaveClass("border-dashed");
  });

  it("no status renders as a pill", () => {
    for (const status of ["DRAFT", "PUBLISHED", "DISABLED"] as const) {
      const { unmount } = render(<ListingStatusTag status={status} />);
      const el = screen.getByText(/^(Draft|Published|Disabled)$/);
      expect(el).not.toHaveClass("rounded-pill");
      expect(el).toHaveClass("rounded-sm");
      unmount();
    }
  });

  it("a strict text query for each label matches exactly one element", () => {
    const { unmount } = render(<ListingStatusTag status="PUBLISHED" />);
    expect(screen.getAllByText("Published")).toHaveLength(1);
    unmount();
    render(<ListingStatusTag status="DRAFT" />);
    expect(screen.getAllByText("Draft")).toHaveLength(1);
  });
});
