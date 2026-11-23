import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { Modal } from "./Modal.js";

// NH-124 identity tests plus NH-146 (modal-a11y) behaviour tests. jsdom does not compute Tailwind or
// implement the top layer, so shape is asserted through class tokens and `showModal`/`close` are the
// stubs from src/test/setup.ts. Tab loop, inert and ::backdrop are covered by the Playwright e2e.
// Selector assumptions: dialog = the role="dialog" element (a native <dialog> after NH-146);
// surface = its first element child.

function renderModal(onClose = vi.fn()) {
  const utils = render(
    <Modal labelledBy="m-title" onClose={onClose}>
      <h2 id="m-title">Dialog title</h2>
      <button>inside</button>
    </Modal>,
  );
  return { onClose, ...utils };
}

function frame(): HTMLElement {
  const el = screen.getByRole("dialog").firstElementChild;
  if (!(el instanceof HTMLElement)) throw new Error("missing structure: modal frame");
  return el;
}

const openers: HTMLElement[] = [];

function makeOpener(): HTMLButtonElement {
  const opener = document.createElement("button");
  opener.textContent = "open";
  document.body.append(opener);
  openers.push(opener);
  return opener;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.style.overflow = "";
  for (const o of openers.splice(0)) o.remove();
});

describe("Modal", () => {
  it("GUARD: exposes role dialog, aria-modal and its title as the label", () => {
    renderModal();
    const dialog = screen.getByRole("dialog", { name: "Dialog title" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "m-title");
  });

  it("is a native <dialog> element", () => {
    renderModal();
    expect(screen.getByRole("dialog").tagName).toBe("DIALOG");
  });

  it("calls showModal on mount and the dialog is open", () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    renderModal();
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("the surface is the only element child and holds the content", () => {
    renderModal();
    expect(screen.getByRole("dialog").children).toHaveLength(1);
    expect(frame()).toContainElement(screen.getByRole("button", { name: "inside" }));
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

  it("dialog keeps the reset and flat scrim classes, surface keeps its frame classes", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toHaveClass(
      "p-0",
      "border-0",
      "bg-transparent",
      "max-w-[calc(100%-2rem)]",
      "backdrop:bg-ink/40",
    );
    expect(frame()).toHaveClass(
      "w-full",
      "max-w-md",
      "rounded-card",
      "border-2",
      "border-border",
      "bg-surface-raised",
      "p-6",
    );
    expect(frame()).not.toHaveClass("mx-4");
  });

  describe("Escape (cancel event)", () => {
    it("default-prevents the cancel event and calls onClose once", () => {
      const { onClose } = renderModal();
      const dialog = screen.getByRole("dialog");
      const event = createEvent("cancel", dialog, { cancelable: true });
      fireEvent(dialog, event);
      expect(event.defaultPrevented).toBe(true);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("leaves the dialog mounted: only the parent unmounts it", () => {
      renderModal();
      fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("initial focus", () => {
    // `autoFocus` is a no-op in browsers (the dialog is display:none at commit), so Modal focuses the
    // `[data-autofocus]` element itself after showModal().
    it("focuses the [data-autofocus] element even when it is not first in DOM order", () => {
      render(
        <Modal labelledBy="m-title" onClose={vi.fn()}>
          <h2 id="m-title">Dialog title</h2>
          <button>first in DOM order</button>
          <input aria-label="target" data-autofocus />
        </Modal>,
      );
      expect(screen.getByLabelText("target")).toHaveFocus();
    });

    it("focuses it after showModal, not before", () => {
      const order: string[] = [];
      vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(function (
        this: HTMLDialogElement,
      ) {
        order.push("showModal");
        this.setAttribute("open", "");
      });
      const focus = vi.spyOn(HTMLElement.prototype, "focus").mockImplementation(() => {
        order.push("focus");
      });
      render(
        <Modal labelledBy="m-title" onClose={vi.fn()}>
          <h2 id="m-title">Dialog title</h2>
          <input aria-label="target" data-autofocus />
        </Modal>,
      );
      expect(order).toEqual(["showModal", "focus"]);
      focus.mockRestore();
    });

    it("does nothing when no element is marked", () => {
      renderModal();
      expect(screen.getByRole("button", { name: "inside" })).not.toHaveFocus();
    });
  });

  describe("native close while still mounted", () => {
    // Chromium can deliver a second, non-cancelable `cancel` (CloseWatcher) that closes the dialog
    // behind React's back. The dialog must be re-opened while React still renders the Modal.
    it("re-opens the dialog with showModal when it is closed natively", () => {
      renderModal();
      const dialog = screen.getByRole("dialog") as HTMLDialogElement;
      const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
      dialog.close();
      expect(showModal).toHaveBeenCalledTimes(1);
      expect(dialog).toHaveAttribute("open");
    });

    it("does not re-open the dialog while unmounting", () => {
      const { unmount } = renderModal();
      const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
      unmount();
      expect(showModal).not.toHaveBeenCalled();
    });

    it("keeps the body scroll lock after a native close", () => {
      renderModal();
      (screen.getByRole("dialog") as HTMLDialogElement).close();
      expect(document.body.style.overflow).toBe("hidden");
    });
  });

  describe("backdrop click", () => {
    it("a click on the dialog element itself calls onClose once", async () => {
      const { onClose } = renderModal();
      await userEvent.click(screen.getByRole("dialog"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("a click on the surface does not call onClose", async () => {
      const { onClose } = renderModal();
      await userEvent.click(frame());
      expect(onClose).not.toHaveBeenCalled();
    });

    it("a click on an element inside the surface does not call onClose", async () => {
      const { onClose } = renderModal();
      await userEvent.click(screen.getByRole("button", { name: "inside" }));
      await userEvent.click(screen.getByRole("heading", { name: "Dialog title" }));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("a drag that starts inside the surface and ends on the backdrop does not call onClose", () => {
      const { onClose } = renderModal();
      const dialog = screen.getByRole("dialog");
      const inside = screen.getByRole("button", { name: "inside" });
      // The browser dispatches the click on the common ancestor (the dialog) after such a drag.
      fireEvent.mouseDown(inside);
      fireEvent.mouseUp(dialog);
      fireEvent.click(dialog);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("a drag that starts on the backdrop and ends inside the surface does not call onClose", () => {
      const { onClose } = renderModal();
      const dialog = screen.getByRole("dialog");
      fireEvent.mouseDown(dialog);
      fireEvent.mouseUp(frame());
      fireEvent.click(dialog);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("a stale drag does not leak into the next genuine backdrop click", () => {
      const { onClose } = renderModal();
      const dialog = screen.getByRole("dialog");
      fireEvent.mouseDown(screen.getByRole("button", { name: "inside" }));
      fireEvent.mouseUp(dialog);
      fireEvent.click(dialog);
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.mouseDown(dialog);
      fireEvent.mouseUp(dialog);
      fireEvent.click(dialog);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("scroll lock", () => {
    it("sets body overflow hidden while mounted and restores a previous non-empty value", () => {
      document.body.style.overflow = "scroll";
      const { unmount } = renderModal();
      expect(document.body.style.overflow).toBe("hidden");
      unmount();
      expect(document.body.style.overflow).toBe("scroll");
    });

    it("restores an empty previous value on unmount", () => {
      document.body.style.overflow = "";
      const { unmount } = renderModal();
      expect(document.body.style.overflow).toBe("hidden");
      unmount();
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("scrollbar compensation", () => {
    // jsdom has no layout: model a classic 15px scrollbar that vanishes with `overflow: hidden`.
    function mockScrollbar(width: number, vanishes: boolean) {
      vi.spyOn(window, "innerWidth", "get").mockReturnValue(1000);
      Object.defineProperty(document.documentElement, "clientWidth", {
        configurable: true,
        get: () => (vanishes && document.body.style.overflow === "hidden" ? 1000 : 1000 - width),
      });
    }

    afterEach(() => {
      Reflect.deleteProperty(document.documentElement, "clientWidth");
      document.body.style.paddingRight = "";
    });

    it("pads the body by the vanished scrollbar width and restores the padding on unmount", () => {
      document.body.style.paddingRight = "8px";
      mockScrollbar(15, true);
      const { unmount } = renderModal();
      expect(document.body.style.paddingRight).toBe("23px");
      unmount();
      expect(document.body.style.paddingRight).toBe("8px");
    });

    it("adds no padding when the gutter is kept (the scrollbar width does not change)", () => {
      mockScrollbar(15, false);
      const { unmount } = renderModal();
      expect(document.body.style.paddingRight).toBe("");
      unmount();
      expect(document.body.style.paddingRight).toBe("");
    });

    it("adds no padding with overlay scrollbars (no width to lose)", () => {
      mockScrollbar(0, true);
      renderModal();
      expect(document.body.style.paddingRight).toBe("");
    });
  });

  describe("StrictMode", () => {
    it("opens the dialog, keeps the scroll lock and closes cleanly on unmount", () => {
      document.body.style.overflow = "scroll";
      const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
      const { unmount } = render(
        <StrictMode>
          <Modal labelledBy="m-title" onClose={vi.fn()}>
            <h2 id="m-title">Dialog title</h2>
            <input aria-label="target" data-autofocus />
          </Modal>
        </StrictMode>,
      );
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("open");
      expect(showModal).toHaveBeenCalled();
      expect(document.body.style.overflow).toBe("hidden");
      expect(screen.getByLabelText("target")).toHaveFocus();
      // The simulated effect re-run must not leave the dialog un-reopenable: a native close re-opens.
      (dialog as HTMLDialogElement).close();
      expect(dialog).toHaveAttribute("open");
      unmount();
      expect(document.body.style.overflow).toBe("scroll");
      expect(dialog).not.toHaveAttribute("open");
    });
  });

  describe("focus return", () => {
    it("returns focus to the opener on unmount when it is still connected", () => {
      const opener = makeOpener();
      opener.focus();
      expect(opener).toHaveFocus();

      const { unmount } = renderModal();
      // The browser moves focus into the dialog in showModal(); the jsdom stub does not, so do it here.
      screen.getByRole("button", { name: "inside" }).focus();
      expect(opener).not.toHaveFocus();

      unmount();
      expect(opener).toHaveFocus();
    });

    it("GUARD: a detached opener does not throw and is not focused", () => {
      const opener = makeOpener();
      opener.focus();
      const focus = vi.spyOn(opener, "focus");

      const { unmount } = renderModal();
      opener.remove();
      expect(opener.isConnected).toBe(false);

      expect(() => unmount()).not.toThrow();
      expect(focus).not.toHaveBeenCalled();
    });
  });
});
