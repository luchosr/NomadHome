import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
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
