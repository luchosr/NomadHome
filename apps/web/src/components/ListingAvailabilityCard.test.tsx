import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ListingAvailabilityCard } from "./ListingAvailabilityCard.js";

// NH-122 identity tests (host-identity, task 1.8). jsdom does not compute Tailwind, so shape is
// asserted through class tokens. Selector assumptions: block row = the li holding the dates; date
// text = the span inside it; error = the single role="alert".
// Tests marked GUARD pass before the restyle and must keep passing.

const BLOCKS = [{ id: "k1", startDate: "2099-03-01", endDate: "2099-03-05" }];

function setup(overrides: Partial<Parameters<typeof ListingAvailabilityCard>[0]> = {}) {
  const props = {
    blocks: BLOCKS,
    startDate: "",
    endDate: "",
    blockError: null,
    setStartDate: vi.fn(),
    setEndDate: vi.fn(),
    addBlock: vi.fn().mockResolvedValue(undefined),
    deleteBlock: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { props, ...render(<ListingAvailabilityCard {...props} />) };
}

describe("ListingAvailabilityCard identity", () => {
  it("the heading is a bold ink h2", () => {
    setup();
    expect(screen.getByRole("heading", { level: 2, name: "Blocked dates" })).toHaveClass(
      "font-bold",
      "text-fg",
    );
  });

  it("each block row has the 2px ink edge and no radius, with tabular ink dates", () => {
    const { container } = setup();
    const row = container.querySelector("li");
    expect(row).not.toBeNull();
    expect(row).toHaveClass("border-2", "border-border", "rounded-none");
    expect(row).not.toHaveClass("rounded-md");
    const dates = row?.querySelector("span");
    expect(dates).toHaveClass("text-fg", "tabular-nums");
  });

  it("the date labels are bold ink and the inputs keep their labels", () => {
    setup();
    expect(screen.getByText("Start date")).toHaveClass("font-bold", "text-fg");
    expect(screen.getByText("End date")).toHaveClass("font-bold", "text-fg");
    expect(screen.getByLabelText("Start date")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("End date")).toHaveAttribute("type", "date");
  });

  it("Remove stays destructive and is a 44px target that calls deleteBlock", async () => {
    const { props } = setup();
    const remove = screen.getByRole("button", { name: "Remove" });
    expect(remove).toHaveClass("bg-danger", "min-h-11");
    await userEvent.click(remove);
    expect(props.deleteBlock).toHaveBeenCalledWith("k1");
  });

  it("GUARD: Block dates keeps its disabled condition", () => {
    const { unmount } = setup({ startDate: "", endDate: "" });
    expect(screen.getByRole("button", { name: "Block dates" })).toBeDisabled();
    unmount();
    setup({ startDate: "2099-04-01", endDate: "2099-04-02" });
    expect(screen.getByRole("button", { name: "Block dates" })).toBeEnabled();
  });

  it("Block dates is a 44px target", () => {
    setup({ startDate: "2099-04-01", endDate: "2099-04-02" });
    expect(screen.getByRole("button", { name: "Block dates" })).toHaveClass("min-h-11");
  });

  it("a block error renders one shared alert with the same text", () => {
    setup({ blockError: "Dates are not available." });
    const alert = screen.getByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent("Dates are not available.");
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
  });

  it("GUARD: no blocks shows the existing text and no error means no alert", () => {
    setup({ blocks: [] });
    expect(screen.getByText("No blocked dates.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
