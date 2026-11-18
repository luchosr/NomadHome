import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, it, expect, vi } from "vitest";
import type { ListingFormValues } from "../hooks/useEditListing.js";
import { ListingDetailsForm } from "./ListingDetailsForm.js";

// NH-122 identity tests (host-identity, task 1.6, ListingDetailsForm coverage). AmenityCheckboxGrid is
// replaced by a probe so the test can tell "renders the shared grid" from "renders inline amenity
// markup". jsdom does not compute Tailwind, so shape is asserted through class tokens.
// Tests marked GUARD pass before the restyle and must keep passing.

const gridProps = vi.fn();
vi.mock("./AmenityCheckboxGrid.js", () => ({
  AmenityCheckboxGrid: (props: { amenities: readonly unknown[]; selected: Set<string> }) => {
    gridProps(props);
    return <div data-testid="amenity-grid" />;
  },
}));

function Harness({ saveError = null }: { saveError?: string | null }) {
  const form = useForm<ListingFormValues>({
    defaultValues: {
      title: "Beach House",
      description: "Lovely",
      type: "PROPERTY",
      city: "Porto",
      country: "PT",
      addressLine: "2 Sea Rd",
      capacity: 3,
      nightlyRateCents: 8000,
      currency: "USD",
    },
  });
  return (
    <ListingDetailsForm
      form={form}
      selectedAmenities={new Set(["wifi"])}
      toggleAmenity={vi.fn()}
      onSubmit={(e) => e.preventDefault()}
      saveError={saveError}
    />
  );
}

describe("ListingDetailsForm", () => {
  it("renders the shared AmenityCheckboxGrid with the amenity list and the selection", () => {
    gridProps.mockClear();
    render(<Harness />);
    expect(screen.getByTestId("amenity-grid")).toBeInTheDocument();
    expect(gridProps).toHaveBeenCalled();
    const props = gridProps.mock.calls[0]?.[0] as { amenities: unknown[]; selected: Set<string> };
    expect(props.amenities).toHaveLength(10);
    expect(props.selected.has("wifi")).toBe(true);
  });

  it("renders no inline amenity checkbox markup", () => {
    render(<Harness />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("every label is bold ink", () => {
    const { container } = render(<Harness />);
    const labels = Array.from(container.querySelectorAll("label"));
    expect(labels.length).toBeGreaterThanOrEqual(7);
    for (const label of labels) expect(label).toHaveClass("font-bold", "text-fg");
    expect(screen.getByText("Amenities", { selector: "legend" })).toHaveClass(
      "font-bold",
      "text-fg",
    );
  });

  it("select and textarea have the 2px ink edge and no rounded-md", () => {
    const { container } = render(<Harness />);
    for (const id of ["edit-description", "edit-type"]) {
      const control = container.querySelector<HTMLElement>(`#${id}`);
      expect(control, id).not.toBeNull();
      expect(control, id).toHaveClass("border-2", "border-border");
      expect(control, id).not.toHaveClass("rounded-md");
    }
  });

  it("GUARD: required, min and valueAsNumber attributes are kept", () => {
    const { container } = render(<Harness />);
    for (const id of ["edit-title", "edit-description", "edit-type", "edit-capacity"]) {
      expect(container.querySelector(`#${id}`), id).toBeRequired();
    }
    expect(container.querySelector("#edit-capacity")).toHaveAttribute("min", "1");
    expect(container.querySelector("#edit-nightlyRateCents")).toHaveAttribute("min", "1");
  });

  it("GUARD: no control gains aria-describedby", () => {
    const { container } = render(<Harness saveError="x" />);
    expect(container.querySelector("[aria-describedby]")).toBeNull();
  });

  it("Save is a 44px target", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Save changes" })).toHaveClass("min-h-11");
  });

  it("a save error renders one shared alert with the same text", () => {
    render(<Harness saveError="Could not save." />);
    const alert = screen.getByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent("Could not save.");
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
  });
});
