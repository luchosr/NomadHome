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
