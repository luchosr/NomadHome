import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CancelBookingModal } from "./CancelBookingModal.js";
import { ApiError } from "../api/client.js";

const mockCancel = vi.fn();
vi.mock("../api/bookings.js", () => ({
  bookingsApi: {
    cancel: (...args: unknown[]) => mockCancel(...args),
  },
}));

describe("CancelBookingModal", () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    mockCancel.mockReset();
    onSuccess.mockReset();
    onClose.mockReset();
  });

  it("renders the cancel confirmation message", () => {
    render(<CancelBookingModal bookingId="b1" onSuccess={onSuccess} onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to cancel/i)).toBeInTheDocument();
  });

  it("calls bookingsApi.cancel and fires onSuccess on confirm click", async () => {
    mockCancel.mockResolvedValue({});
    render(<CancelBookingModal bookingId="b1" onSuccess={onSuccess} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /yes, cancel/i }));
    await waitFor(() => expect(mockCancel).toHaveBeenCalledWith("b1", undefined));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("shows the server-provided message when the booking isn't cancellable, instead of a canned string", async () => {
    mockCancel.mockRejectedValue(
      new ApiError(422, {
        error: "BOOKING_NOT_CANCELLABLE",
        message: "This booking is past the cancellation window.",
      }),
    );
    render(<CancelBookingModal bookingId="b1" onSuccess={onSuccess} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /yes, cancel/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This booking is past the cancellation window.",
    );
  });

  it("shows the generic fallback message when the server sends no message field", async () => {
    mockCancel.mockRejectedValue(new ApiError(500, {}));
    render(<CancelBookingModal bookingId="b1" onSuccess={onSuccess} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /yes, cancel/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
  });
});

// NH-124 identity tests (booking-payment-identity, tasks 1.10 and 1.11). jsdom does not compute
// Tailwind, so shape is asserted through class tokens. Selector assumptions: surface = first element
// child of the role="dialog" element; tile = the first [aria-hidden="true"] descendant of the alert.
// Tests marked GUARD pass before the restyle and must keep passing.
describe("CancelBookingModal identity", () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    mockCancel.mockReset();
    onSuccess.mockReset();
    onClose.mockReset();
  });

  it("dialog surface has the 2px border class and no shadow", () => {
    render(<CancelBookingModal bookingId="b1" onSuccess={onSuccess} onClose={onClose} />);
    const surface = screen.getByRole("dialog").firstElementChild;
    expect(surface).toHaveClass("border-2", "border-border");
    expect(Array.from(surface?.classList ?? []).filter((c) => /^shadow/.test(c))).toEqual([]);
  });

  it("textarea has the 2px border class, the label is bold and the focus ring is not overridden", () => {
    render(<CancelBookingModal bookingId="b1" onSuccess={onSuccess} onClose={onClose} />);
    const textarea = screen.getByLabelText(/reason/i);
    expect(textarea).toHaveClass("border-2", "border-border");
    expect(textarea.className).not.toMatch(/focus-visible:outline-none/);
    expect(screen.getByText("Reason (optional)")).toHaveClass("font-bold");
  });

  it("a failed submit renders exactly one alert with the same text and a tile", async () => {
    mockCancel.mockRejectedValue(
      new ApiError(422, { error: "BOOKING_NOT_CANCELLABLE", message: "Past the window." }),
    );
    render(<CancelBookingModal bookingId="b1" onSuccess={onSuccess} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /yes, cancel/i }));
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent("Past the window.");
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger");
    expect(alert.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("GUARD: sends the trimmed reason and keeps Close wired to onClose", async () => {
    mockCancel.mockResolvedValue({});
    render(<CancelBookingModal bookingId="b1" onSuccess={onSuccess} onClose={onClose} />);
    await userEvent.type(screen.getByLabelText(/reason/i), "  plans changed  ");
    await userEvent.click(screen.getByRole("button", { name: /yes, cancel/i }));
    await waitFor(() => expect(mockCancel).toHaveBeenCalledWith("b1", "plans changed"));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("GUARD: no ESC handling and no backdrop-click close (follow-up recorded, not fixed)", async () => {
    render(<CancelBookingModal bookingId="b1" onSuccess={onSuccess} onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
