import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MyBookingsPage } from "./MyBookingsPage.js";
import type { BookingsPage } from "../api/bookings.js";

// NH-146 task 1.6 (modal-a11y): the page keeps working when a modal closes through the new paths
// (Escape / backdrop call the parent onClose) and handleModalSuccess stays idempotent when a modal
// reports success more than once (for example a retried or doubled callback). Kept in its own file so
// the NH-124 identity test file keeps its simple modal mocks.

const mockListMine = vi.fn();
vi.mock("../api/bookings.js", () => ({
  bookingsApi: {
    listMine: (...args: unknown[]) => mockListMine(...args),
    checkout: vi.fn(),
    cancel: vi.fn(),
    review: vi.fn(),
  },
}));

// The mocks expose onClose (what Escape and the backdrop call) and onSuccess.
vi.mock("../components/CancelBookingModal.js", () => ({
  CancelBookingModal: ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => (
    <div data-testid="cancel-modal">
      <button onClick={onClose}>escape-cancel</button>
      <button
        onClick={() => {
          onSuccess();
          onSuccess();
        }}
      >
        succeed-twice-cancel
      </button>
    </div>
  ),
}));

vi.mock("../components/ReviewModal.js", () => ({
  ReviewModal: ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => (
    <div data-testid="review-modal">
      <button onClick={onClose}>escape-review</button>
      <button
        onClick={() => {
          onSuccess();
          onSuccess();
        }}
      >
        succeed-twice-review
      </button>
    </div>
  ),
}));

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "guest@test.com", roles: ["guest"] },
    isLoading: false,
  }),
}));

const future = new Date();
future.setFullYear(future.getFullYear() + 1);
const futureStr = future.toISOString().split("T")[0] as string;

const bookings: BookingsPage = {
  data: [
    {
      id: "b1",
      listingId: "l1",
      guestId: "u1",
      hostId: "h1",
      checkIn: futureStr,
      checkOut: futureStr,
      nightlyRateCents: 10000,
      totalCents: 10000,
      status: "CONFIRMED",
      cancellationReason: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      listing: { title: "Confirmed Listing" },
    },
    {
      id: "b2",
      listingId: "l2",
      guestId: "u1",
      hostId: "h2",
      checkIn: "2024-01-10",
      checkOut: "2024-01-15",
      nightlyRateCents: 8000,
      totalCents: 40000,
      status: "COMPLETED",
      cancellationReason: null,
      createdAt: "2024-01-01T00:00:00.000Z",
      listing: { title: "Completed Listing" },
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
};

function renderPage() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const MODALS = [
  {
    name: "cancel",
    opener: /^cancel$/i,
    testId: "cancel-modal",
    close: "escape-cancel",
    succeed: "succeed-twice-cancel",
  },
  {
    name: "review",
    opener: /leave a review/i,
    testId: "review-modal",
    close: "escape-review",
    succeed: "succeed-twice-review",
  },
] as const;

describe("MyBookingsPage modals (NH-146)", () => {
  beforeEach(() => {
    mockListMine.mockReset();
    mockListMine.mockResolvedValue(bookings);
  });

  for (const m of MODALS) {
    describe(`${m.name} modal`, () => {
      it("closing through onClose leaves the page usable and unchanged", async () => {
        renderPage();
        await screen.findByText("Confirmed Listing");
        await userEvent.click(screen.getByRole("button", { name: m.opener }));
        expect(screen.getByTestId(m.testId)).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: m.close }));
        expect(screen.queryByTestId(m.testId)).not.toBeInTheDocument();
        expect(screen.getByText("Confirmed Listing")).toBeInTheDocument();
        expect(screen.getByText("Completed Listing")).toBeInTheDocument();
        expect(mockListMine).toHaveBeenCalledTimes(1);

        // The opener still works afterwards.
        await userEvent.click(screen.getByRole("button", { name: m.opener }));
        expect(screen.getByTestId(m.testId)).toBeInTheDocument();
      });

      it("handleModalSuccess is idempotent: called twice it closes the modal and refetches without error", async () => {
        renderPage();
        await screen.findByText("Confirmed Listing");
        await userEvent.click(screen.getByRole("button", { name: m.opener }));

        await userEvent.click(within(screen.getByTestId(m.testId)).getByText(m.succeed));

        expect(screen.queryByTestId(m.testId)).not.toBeInTheDocument();
        // Each invalidation refetches; two calls mean the list is fetched again, never an error.
        await waitFor(() => expect(mockListMine.mock.calls.length).toBeGreaterThanOrEqual(2));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.getByText("Confirmed Listing")).toBeInTheDocument();
      });
    });
  }
});
