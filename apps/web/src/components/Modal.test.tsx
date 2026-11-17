import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Modal } from "./Modal.js";

// NH-124 identity tests (booking-payment-identity, tasks 1.10 and 1.11). jsdom does not compute
// Tailwind, so shape is asserted through class tokens. Selector assumptions:
//  - backdrop = the role="dialog" element; frame = its first element child.
// Tests marked GUARD pass before the restyle and must keep passing.

function renderModal() {
  render(
    <Modal labelledBy="m-title">
      <h2 id="m-title">Dialog title</h2>
      <button>inside</button>
    </Modal>,
  );
}

function frame(): HTMLElement {
  const el = screen.getByRole("dialog").firstElementChild;
  if (!(el instanceof HTMLElement)) throw new Error("missing structure: modal frame");
  return el;
}

describe("Modal", () => {
  it("GUARD: exposes role dialog, aria-modal and its title as the label", () => {
    renderModal();
    const dialog = screen.getByRole("dialog", { name: "Dialog title" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "m-title");
  });

  it("frame has the 2px ink border, rounded-card and no shadow", () => {
    renderModal();
    expect(frame()).toHaveClass("border-2", "border-border", "rounded-card");
    expect(Array.from(frame().classList).filter((c) => /^shadow/.test(c))).toEqual([]);
  });

  it("GUARD: backdrop is flat: no blur and no gradient class", () => {
    renderModal();
    const classes = Array.from(screen.getByRole("dialog").classList);
    expect(classes.filter((c) => /blur|gradient|shadow/.test(c))).toEqual([]);
  });

  it("GUARD: adds no key handler and no backdrop-click close (follow-up recorded, not fixed)", async () => {
    renderModal();
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
