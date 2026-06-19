import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CancelBookingModal } from "./CancelBookingModal.js";

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
});
