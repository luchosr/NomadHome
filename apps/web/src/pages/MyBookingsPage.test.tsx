import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MyBookingsPage } from "./MyBookingsPage.js";
import { ApiError } from "../api/client.js";
import type { BookingsPage, BookingWithListing } from "../api/bookings.js";

// NH-124 identity tests (booking-payment-identity, tasks 1.8 and 1.9). jsdom does not compute
// Tailwind, so shape is asserted through class tokens. Selector assumptions:
//  - card = nearest ".rounded-card" ancestor of the listing title (the e2e locator is kept);
//  - status tag = the single element whose own text is exactly the status label (the label text is
//    its own text node, design D5); shape classes sit on that element: pending "border-dashed",
//    confirmed/completed "border-border" (ink, solid), cancelled "border-border-muted" + "line-through";
//  - completed marker = an [aria-hidden="true"] descendant of the tag (a sibling span);
//  - error panel = the single role="alert" element; tile = its [aria-hidden="true"] descendant.
// Tests marked GUARD pass before the restyle and must keep passing.

const mockListMine = vi.fn();
const mockCheckout = vi.fn();
vi.mock("../api/bookings.js", () => ({
  bookingsApi: {
    listMine: (...args: unknown[]) => mockListMine(...args),
    checkout: (...args: unknown[]) => mockCheckout(...args),
    cancel: vi.fn(),
    review: vi.fn(),
  },
}));

vi.mock("../components/CancelBookingModal.js", () => ({
  CancelBookingModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="cancel-modal">
      <button onClick={onClose}>close-cancel</button>
    </div>
  ),
}));

vi.mock("../components/ReviewModal.js", () => ({
  ReviewModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="review-modal">
      <button onClick={onClose}>close-review</button>
    </div>
  ),
}));

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "guest@test.com", roles: ["guest"] },
    isLoading: false,
  }),
}));

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);
const futureDateStr = futureDate.toISOString().split("T")[0] as string;
const pastDate = "2024-01-10";

const mockBookings: BookingsPage = {
  data: [
    {
      id: "b1",
      listingId: "l1",
      guestId: "u1",
      hostId: "h1",
      checkIn: futureDateStr,
      checkOut: futureDateStr,
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
      checkIn: pastDate,
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

describe("MyBookingsPage", () => {
  beforeEach(() => {
    mockListMine.mockReset();
  });

  it("shows 'My Bookings' heading and listing titles from mock data", async () => {
    mockListMine.mockResolvedValue(mockBookings);
    renderPage();
    expect(await screen.findByRole("heading", { name: /my bookings/i })).toBeInTheDocument();
    expect(await screen.findByText("Confirmed Listing")).toBeInTheDocument();
    expect(screen.getByText("Completed Listing")).toBeInTheDocument();
  });

  it("shows 'Cancel' button for CONFIRMED booking with future checkIn", async () => {
    mockListMine.mockResolvedValue(mockBookings);
    renderPage();
    expect(await screen.findByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows 'Leave a review' button for COMPLETED booking", async () => {
    mockListMine.mockResolvedValue(mockBookings);
    renderPage();
    expect(await screen.findByRole("button", { name: /leave a review/i })).toBeInTheDocument();
  });

  it("shows empty state when no bookings", async () => {
    mockListMine.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    renderPage();
    expect(await screen.findByText(/you have no bookings yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse listings/i })).toHaveAttribute(
      "href",
      "/search",
    );
  });
});

function booking(
  id: string,
  status: BookingWithListing["status"],
  title: string,
): BookingWithListing {
  return {
    id,
    listingId: `l-${id}`,
    guestId: "u1",
    hostId: "h1",
    checkIn: status === "COMPLETED" ? pastDate : futureDateStr,
    checkOut: status === "COMPLETED" ? "2024-01-15" : futureDateStr,
    nightlyRateCents: 10000,
    totalCents: 10000,
    status,
    cancellationReason: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    listing: { title },
  };
}

const ALL_STATUSES: BookingsPage = {
  data: [
    booking("p1", "PENDING_PAYMENT", "Pending Listing"),
    booking("c1", "CONFIRMED", "Confirmed Listing"),
    booking("x1", "CANCELLED", "Cancelled Listing"),
    booking("d1", "COMPLETED", "Completed Listing"),
  ],
  total: 4,
  page: 1,
  limit: 20,
};

function required<T extends Element>(el: T | null, what: string): T {
  if (!el) throw new Error(`missing structure: ${what}`);
  return el;
}

function cardOf(title: string): HTMLElement {
  return required(
    screen.getByText(title).closest<HTMLElement>(".rounded-card"),
    `card for ${title}`,
  );
}

function tag(label: string): HTMLElement {
  return screen.getByText(label, { exact: true });
}

function hasShadow(el: Element): boolean {
  return Array.from(el.classList).some((c) => /^shadow/.test(c));
}

describe("MyBookingsPage identity: cards", () => {
  beforeEach(() => {
    mockListMine.mockReset();
    mockListMine.mockResolvedValue(ALL_STATUSES);
  });

  it("each card keeps rounded-card and has the 2px border class and no shadow", async () => {
    renderPage();
    await screen.findByText("Pending Listing");
    for (const title of [
      "Pending Listing",
      "Confirmed Listing",
      "Cancelled Listing",
      "Completed Listing",
    ]) {
      const card = cardOf(title);
      expect(card).toHaveClass("rounded-card", "border-2", "border-border");
      expect(hasShadow(card)).toBe(false);
    }
  });
});

describe("MyBookingsPage identity: status tags", () => {
  beforeEach(() => {
    mockListMine.mockReset();
    mockListMine.mockResolvedValue(ALL_STATUSES);
  });

  it("pending is dashed", async () => {
    renderPage();
    await screen.findByText("Pending Listing");
    expect(tag("Pending Payment")).toHaveClass("border-2", "border-dashed", "border-border");
  });

  it("confirmed is solid ink", async () => {
    renderPage();
    await screen.findByText("Pending Listing");
    const el = tag("Confirmed");
    expect(el).toHaveClass("border-2", "border-border");
    expect(el).not.toHaveClass("border-dashed");
    expect(el).not.toHaveClass("line-through");
  });

  it("cancelled is struck through with the muted solid edge and the exact label", async () => {
    renderPage();
    await screen.findByText("Pending Listing");
    const el = tag("Cancelled");
    expect(el).toHaveClass("border-2", "border-border-muted", "line-through");
    expect(el).not.toHaveClass("border-dashed");
  });

  it("completed is solid ink with an aria-hidden marker", async () => {
    renderPage();
    await screen.findByText("Pending Listing");
    const el = tag("Completed");
    expect(el).toHaveClass("border-2", "border-border");
    expect(el).not.toHaveClass("border-dashed");
    required(el.querySelector('[aria-hidden="true"]'), "aria-hidden completed marker");
  });

  it("no tag is a pill", async () => {
    renderPage();
    await screen.findByText("Pending Listing");
    for (const label of ["Pending Payment", "Confirmed", "Cancelled", "Completed"]) {
      expect(tag(label)).not.toHaveClass("rounded-pill");
    }
  });
});

describe("MyBookingsPage identity: actions", () => {
  beforeEach(() => {
    mockListMine.mockReset();
    mockListMine.mockResolvedValue(ALL_STATUSES);
    mockCheckout.mockReset();
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
  });

  it("GUARD: a cancellable booking exposes exactly one button named /cancel/", async () => {
    renderPage();
    await screen.findByText("Pending Listing");
    expect(screen.getAllByRole("button", { name: /cancel/i })).toHaveLength(1);
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
  });

  it("GUARD: Cancel opens the cancel dialog and Leave a review opens the review dialog", async () => {
    renderPage();
    await screen.findByText("Pending Listing");
    await userEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.getByTestId("cancel-modal")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "close-cancel" }));
    await userEvent.click(screen.getByRole("button", { name: /leave a review/i }));
    expect(screen.getByTestId("review-modal")).toBeInTheDocument();
  });

  it("GUARD: Complete payment keeps its role, name and handler (checkout then redirect)", async () => {
    mockCheckout.mockResolvedValue({ url: "https://checkout.stripe.com/pay", sessionId: "s" });
    renderPage();
    await screen.findByText("Pending Listing");
    await userEvent.click(screen.getByRole("button", { name: "Complete payment" }));
    await waitFor(() => expect(mockCheckout).toHaveBeenCalledWith("p1"));
    await waitFor(() => expect(window.location.href).toBe("https://checkout.stripe.com/pay"));
  });
});

describe("MyBookingsPage identity: states", () => {
  beforeEach(() => {
    mockListMine.mockReset();
  });

  it("loading is aria-busy and has no rounded-pill or rounded-md block", () => {
    mockListMine.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    const busy = required(container.querySelector('[aria-busy="true"]'), "aria-busy container");
    const classes = [busy, ...Array.from(busy.querySelectorAll("*"))].flatMap((el) =>
      Array.from(el.classList),
    );
    expect(
      classes.filter((c) => /^(rounded-pill|rounded-md|rounded-xl|shadow.*)$/.test(c)),
    ).toEqual([]);
  });

  it("error is one alert with the generic text, solid danger edge, tint fill and a filled tile", async () => {
    mockListMine.mockRejectedValue(new Error("boom"));
    renderPage();
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent("Something went wrong. Please try again.");
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
    const tile = required(alert.querySelector<HTMLElement>('[aria-hidden="true"]'), "danger tile");
    expect(tile).toHaveClass("bg-danger");
  });

  it("GUARD: empty still renders the EmptyState message and its link", async () => {
    mockListMine.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    renderPage();
    expect(await screen.findByText("You have no bookings yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse listings" })).toHaveAttribute(
      "href",
      "/search",
    );
  });
});

// NH-146 (booking-admin-error-states): Complete payment failures are visible and retryable.

describe("MyBookingsPage: Complete payment errors (NH-146)", () => {
  beforeEach(() => {
    mockListMine.mockReset();
    mockListMine.mockResolvedValue(ALL_STATUSES);
    mockCheckout.mockReset();
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
  });

  async function clickComplete() {
    await userEvent.click(screen.getByRole("button", { name: "Complete payment" }));
  }

  it("failed checkout shows the getDisplayMessage text in an alert and does not redirect", async () => {
    mockCheckout.mockRejectedValue(new ApiError(409, { message: "Booking is no longer payable." }));
    renderPage();
    await screen.findByText("Pending Listing");
    await clickComplete();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Booking is no longer payable.");
    expect(window.location.href).toBe("");
  });

  it("failed checkout without a server message shows the generic text", async () => {
    mockCheckout.mockRejectedValue(new Error("boom"));
    renderPage();
    await screen.findByText("Pending Listing");
    await clickComplete();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
  });

  it("the button is enabled again after the failure", async () => {
    mockCheckout.mockRejectedValue(new ApiError(500, { message: "Checkout is down." }));
    renderPage();
    await screen.findByText("Pending Listing");
    await clickComplete();
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Complete payment" })).toBeEnabled();
  });

  it("the previous error is cleared when the next attempt starts, before it resolves", async () => {
    mockCheckout.mockRejectedValueOnce(new ApiError(500, { message: "Checkout is down." }));
    mockCheckout.mockReturnValueOnce(new Promise(() => {}));
    renderPage();
    await screen.findByText("Pending Listing");
    await clickComplete();
    await screen.findByRole("alert");
    await clickComplete();
    await waitFor(() => expect(mockCheckout).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("a successful retry redirects and shows no error", async () => {
    mockCheckout.mockRejectedValueOnce(new ApiError(500, { message: "Checkout is down." }));
    mockCheckout.mockResolvedValueOnce({ url: "https://checkout.stripe.com/ok", sessionId: "s" });
    renderPage();
    await screen.findByText("Pending Listing");
    await clickComplete();
    await screen.findByRole("alert");
    await clickComplete();
    await waitFor(() => expect(window.location.href).toBe("https://checkout.stripe.com/ok"));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
