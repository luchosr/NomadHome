import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewModal } from "./ReviewModal.js";

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
});
