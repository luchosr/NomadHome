import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReviewModal } from "./ReviewModal.js";
import { ApiError } from "../api/client.js";

const mockReview = vi.fn();
vi.mock("../api/bookings.js", () => ({
  bookingsApi: {
    review: (...args: unknown[]) => mockReview(...args),
  },
}));

describe("ReviewModal", () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    mockReview.mockReset();
    onSuccess.mockReset();
    onClose.mockReset();
  });

  it("renders star buttons and submit is disabled initially", () => {
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    const submitButton = screen.getByRole("button", { name: /submit review/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getAllByRole("button", { name: /star/i })).toHaveLength(5);
  });

  it("clicking 4 stars and submitting calls bookingsApi.review with { rating: 4 }", async () => {
    mockReview.mockResolvedValue({});
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "4 stars" }));

    const submitButton = screen.getByRole("button", { name: /submit review/i });
    expect(submitButton).not.toBeDisabled();

    await userEvent.click(submitButton);
    await waitFor(() => expect(mockReview).toHaveBeenCalledWith("b2", { rating: 4 }));
  });

  it("shows the server-provided message when the booking isn't confirmed yet, instead of the generic fallback", async () => {
    mockReview.mockRejectedValue(
      new ApiError(422, {
        error: "BOOKING_NOT_CONFIRMED",
        message: "This booking hasn't been confirmed yet, so it can't be reviewed.",
      }),
    );
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "4 stars" }));
    await userEvent.click(screen.getByRole("button", { name: /submit review/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This booking hasn't been confirmed yet, so it can't be reviewed.",
    );
  });

  it("shows the generic fallback message when the server sends no message field", async () => {
    mockReview.mockRejectedValue(new ApiError(500, {}));
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "4 stars" }));
    await userEvent.click(screen.getByRole("button", { name: /submit review/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
  });
});

// NH-124 identity tests (booking-payment-identity, tasks 1.10 and 1.11). jsdom does not compute
// Tailwind, so shape is asserted through class tokens. Selector assumptions:
//  - surface = first element child of the role="dialog" element;
//  - star glyph = the "svg[aria-hidden]" inside each star button; "filled" means the svg (or the
//    first ancestor-or-self of its path up to the svg) carries a fill attribute other than "none" or
//    a "fill-*" class other than "fill-none"; "outline" means fill "none" / "fill-none";
//  - success panel = nearest ".border-2" ancestor-or-self of the success text.
// Tests marked GUARD pass before the restyle and must keep passing.

function starButtons(): HTMLElement[] {
  return screen.getAllByRole("button", { name: /star/i });
}

function isFilled(svg: Element): boolean {
  const shape = svg.querySelector("path, polygon") ?? svg;
  for (let el: Element | null = shape; el; el = el.parentElement) {
    const fill = el.getAttribute("fill");
    if (fill !== null) return fill !== "none";
    const cls = Array.from(el.classList).find((c) => /^fill-/.test(c));
    if (cls) return cls !== "fill-none";
    if (el === svg) break;
  }
  return false;
}

describe("ReviewModal identity", () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    mockReview.mockReset();
    onSuccess.mockReset();
    onClose.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dialog surface has the 2px border class and no shadow", () => {
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    const surface = screen.getByRole("dialog").firstElementChild;
    expect(surface).toHaveClass("border-2", "border-border");
    expect(Array.from(surface?.classList ?? []).filter((c) => /^shadow/.test(c))).toEqual([]);
  });

  it("textarea has the 2px border class and the label is bold", () => {
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    const textarea = screen.getByLabelText(/your review/i);
    expect(textarea).toHaveClass("border-2", "border-border");
    expect(textarea.className).not.toMatch(/focus-visible:outline-none/);
    expect(screen.getByText("Your review (optional)")).toHaveClass("font-bold");
  });

  it("a failed submit renders exactly one alert with the same text and a tile", async () => {
    mockReview.mockRejectedValue(new ApiError(422, { error: "X", message: "Not yet reviewable." }));
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "4 stars" }));
    await userEvent.click(screen.getByRole("button", { name: /submit review/i }));
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent("Not yet reviewable.");
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger");
    expect(alert.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("GUARD: star buttons are named 1 star to 5 stars and expose aria-pressed", async () => {
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    expect(starButtons().map((b) => b.getAttribute("aria-label"))).toEqual([
      "1 star",
      "2 stars",
      "3 stars",
      "4 stars",
      "5 stars",
    ]);
    for (const b of starButtons()) expect(b).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(screen.getByRole("button", { name: "4 stars" }));
    expect(screen.getByRole("button", { name: "4 stars" })).toHaveAttribute("aria-pressed", "true");
  });

  it("each star button contains one aria-hidden svg and the document has no unicode star", () => {
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    for (const b of starButtons()) {
      expect(b.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(1);
    }
    expect(document.body.textContent).not.toMatch(/[★☆]/);
  });

  it("selecting 4 stars fills four glyphs and leaves the fifth an outline", async () => {
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "4 stars" }));
    const glyphs = starButtons().map((b) => b.querySelector('svg[aria-hidden="true"]'));
    expect(glyphs.every((g) => g !== null)).toBe(true);
    expect(glyphs.map((g) => (g ? isFilled(g) : null))).toEqual([true, true, true, true, false]);
  });

  it("star buttons drop the old ring-offset focus combo", () => {
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    for (const b of starButtons()) {
      expect(b.className).not.toMatch(/ring-offset|focus-visible:outline-none|text-warning/);
    }
  });

  it("success text renders in a flat 2px panel and onSuccess runs after 1200 ms", async () => {
    vi.useFakeTimers();
    mockReview.mockResolvedValue({});
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    // fireEvent: user-event awaits real timers through RTL and would hang under fake timers.
    fireEvent.click(screen.getByRole("button", { name: "4 stars" }));
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const text = screen.getByText("Review submitted!");
    const panel = text.closest<HTMLElement>(".border-2");
    expect(panel).not.toBeNull();
    expect(panel).toHaveClass("border-border");
    expect(Array.from(panel?.classList ?? []).filter((c) => /^shadow/.test(c))).toEqual([]);
    expect(onSuccess).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1199);
    });
    expect(onSuccess).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("GUARD: submits the trimmed text with the rating and keeps Close wired", async () => {
    mockReview.mockResolvedValue({});
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "5 stars" }));
    await userEvent.type(screen.getByLabelText(/your review/i), " lovely ");
    await userEvent.click(screen.getByRole("button", { name: /submit review/i }));
    await waitFor(() =>
      expect(mockReview).toHaveBeenCalledWith("b2", { rating: 5, text: "lovely" }),
    );
  });
});

// NH-146 (modal-a11y): Escape arrives as the dialog's `cancel` event, the backdrop is a click on the
// dialog element itself; both are suppressed while the review request is pending and allowed in the
// success state. `showModal`/`close` are the jsdom stubs from src/test/setup.ts.
describe("ReviewModal keyboard, focus and timer (NH-146)", () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    mockReview.mockReset();
    onSuccess.mockReset();
    onClose.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function pressEscape() {
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
  }

  /** Fake-timer friendly: rate, submit and flush the resolved review request. */
  async function submitUnderFakeTimers() {
    vi.useFakeTimers();
    mockReview.mockResolvedValue({});
    const view = render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "4 stars" }));
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText("Review submitted!")).toBeInTheDocument();
    return view;
  }

  it("the first star has focus after render (data-autofocus)", () => {
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    expect(screen.getByRole("button", { name: "1 star" })).toHaveFocus();
  });

  it("Escape and a backdrop click call onClose", async () => {
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("Escape and backdrop click are ignored while the review request is pending", async () => {
    mockReview.mockReturnValue(new Promise(() => {}));
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "4 stars" }));
    await userEvent.click(screen.getByRole("button", { name: /submit review/i }));
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();

    pressEscape();
    await userEvent.click(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Escape and backdrop click work again after a failed submit", async () => {
    mockReview.mockRejectedValue(new ApiError(500, {}));
    render(<ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "4 stars" }));
    await userEvent.click(screen.getByRole("button", { name: /submit review/i }));
    await screen.findByRole("alert");

    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("in the success state Escape and backdrop click call onClose", async () => {
    await submitUnderFakeTimers();
    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
    // A real backdrop click is press + release + click on the dialog; a bare click event (no press)
    // is not one (NH-146 drag rule), and userEvent is avoided here because of the fake timers.
    const dialog = screen.getByRole("dialog");
    fireEvent.mouseDown(dialog);
    fireEvent.mouseUp(dialog);
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("the success panel is a live region and takes focus when the form is replaced", async () => {
    await submitUnderFakeTimers();
    const panel = screen.getByRole("status");
    expect(panel).toHaveTextContent("Review submitted!");
    expect(panel).toHaveAttribute("tabindex", "-1");
    expect(panel).toHaveFocus();
  });

  it("a request that resolves after the dialog unmounted never arms the success timer", async () => {
    vi.useFakeTimers();
    let resolve: (v: unknown) => void = () => {};
    mockReview.mockReturnValue(new Promise((r) => (resolve = r)));
    const { unmount } = render(
      <ReviewModal bookingId="b2" onSuccess={onSuccess} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "4 stars" }));
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));
    unmount();
    resolve({});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("unmounting in the success state clears the 1200 ms timer: onSuccess is never called", async () => {
    const { unmount } = await submitUnderFakeTimers();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("GUARD: leaving the success state open calls onSuccess exactly once after 1200 ms", async () => {
    await submitUnderFakeTimers();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1199);
    });
    expect(onSuccess).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
