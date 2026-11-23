import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BookingSuccessPage } from "./BookingSuccessPage.js";
import { expectButtonLink } from "../test/buttonLink.js";

// NH-124 identity tests (booking-payment-identity, tasks 1.5 and 1.6). jsdom does not compute
// Tailwind, so shape is asserted through class tokens. Selector assumptions:
//  - success panel = nearest ".bg-ember" ancestor of the h1;
//  - waiting panel = the single role="status" element;
//  - decorative tile = the first [aria-hidden="true"] descendant of the panel; ink fill is "bg-fg"
//    or "bg-ink" (VerifyEmailPage uses bg-fg, design D3 says bg-ink);
//  - "text classes on the ember panel": every element in the panel that is not inside an
//    aria-hidden tile, so the paper foot CTA may use its own action classes.
// Tests marked GUARD pass before the restyle and must keep passing.

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({ isLoading: false, user: null }),
}));

const mockGetById = vi.fn();
const mockSyncPayment = vi.fn();
vi.mock("../api/bookings.js", () => ({
  bookingsApi: {
    getById: (...args: unknown[]) => mockGetById(...args),
    syncPayment: (...args: unknown[]) => mockSyncPayment(...args),
  },
}));

function renderSuccess(search = "?bookingId=abc123") {
  return render(
    <MemoryRouter initialEntries={[`/booking/success${search}`]}>
      <BookingSuccessPage />
    </MemoryRouter>,
  );
}

function required<T extends Element>(el: T | null, what: string): T {
  if (!el) throw new Error(`missing structure: ${what}`);
  return el;
}

function successPanel(): HTMLElement {
  const h1 = screen.getByRole("heading", { level: 1 });
  return required(h1.closest<HTMLElement>(".bg-ember"), "ember success panel around the h1");
}

function tileOf(el: Element): HTMLElement {
  return required(el.querySelector<HTMLElement>('[aria-hidden="true"]'), "decorative tile");
}

function expectEmberSuccessPanel(): HTMLElement {
  const panel = successPanel();
  expect(panel).toHaveClass("border-2", "border-border", "bg-ember");
  expect(Array.from(panel.classList).some((c) => /^shadow/.test(c))).toBe(false);
  expect(tileOf(panel).className).toMatch(/\bbg-(fg|ink)\b/);
  return panel;
}

function textClassesOutsideTiles(panel: HTMLElement): string[] {
  return Array.from(panel.querySelectorAll<HTMLElement>("*"))
    .filter((el) => el.closest('[aria-hidden="true"]') === null)
    .flatMap((el) => Array.from(el.classList))
    .filter((c) => /^text-(fg-muted|fg-subtle|fg-inverse|danger)$/.test(c));
}

describe("BookingSuccessPage button-link variants (NH-138)", () => {
  beforeEach(() => {
    mockGetById.mockReset();
    mockGetById.mockResolvedValue({ status: "CONFIRMED" });
    mockSyncPayment.mockReset();
    mockSyncPayment.mockResolvedValue({});
  });

  it("View my bookings is one primary anchor with no nested button", async () => {
    const { container } = renderSuccess();
    const link = await screen.findByRole("link", { name: /view my bookings/i });
    expect(link).toHaveAttribute("href", "/bookings");
    expectButtonLink(link, "primary");
    expect(container.querySelector("a button")).toBeNull();
    expect(container.querySelector("button a")).toBeNull();
  });
});

describe("BookingSuccessPage", () => {
  beforeEach(() => {
    mockGetById.mockReset();
    mockGetById.mockResolvedValue({ status: "CONFIRMED" });
    mockSyncPayment.mockReset();
    mockSyncPayment.mockResolvedValue({});
  });

  it("shows success title and View my bookings link", async () => {
    renderSuccess();
    expect(await screen.findByRole("heading", { name: /booking confirmed/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view my bookings/i })).toHaveAttribute(
      "href",
      "/bookings",
    );
  });

  it("shows the bookingId in the page", async () => {
    renderSuccess("?bookingId=abc123");
    expect(await screen.findByText(/#abc123/)).toBeInTheDocument();
  });
});

describe("BookingSuccessPage identity: confirmed", () => {
  beforeEach(() => {
    mockGetById.mockReset();
    mockGetById.mockResolvedValue({ status: "CONFIRMED" });
    mockSyncPayment.mockReset();
    mockSyncPayment.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has one h1 inside an ember panel with an aria-hidden ink tile", async () => {
    renderSuccess();
    await screen.findByRole("heading", { level: 1, name: /booking confirmed/i });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expectEmberSuccessPanel();
  });

  it("uses text-fg only inside the panel: no muted, subtle, inverse or danger text", async () => {
    renderSuccess();
    await screen.findByRole("heading", { level: 1, name: /booking confirmed/i });
    const panel = successPanel();
    expect(textClassesOutsideTiles(panel)).toEqual([]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("text-fg");
    expect(screen.getByText(/your booking is confirmed/i)).toHaveClass("text-fg");
    expect(screen.getByText("#abc123")).toHaveClass("text-fg");
  });

  it("GUARD: #<bookingId> resolves as one element with exactly that text", async () => {
    renderSuccess();
    expect(await screen.findAllByText("#abc123")).toHaveLength(1);
  });

  it("view-bookings action is one link to /bookings with no button inside", async () => {
    renderSuccess();
    await screen.findByRole("heading", { level: 1 });
    const link = screen.getByRole("link", { name: /view my bookings/i });
    expect(link).toHaveAttribute("href", "/bookings");
    expect(link.querySelector("button")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("BookingSuccessPage identity: waiting", () => {
  beforeEach(() => {
    mockGetById.mockReset();
    mockGetById.mockResolvedValue({ status: "PENDING_PAYMENT" });
    mockSyncPayment.mockReset();
    mockSyncPayment.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a busy status panel with the dashed 2px class and stone fill", () => {
    renderSuccess();
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveClass("border-2", "border-dashed", "border-border", "bg-surface-inset");
    expect(status).toHaveTextContent("Processing your payment…");
  });

  it("has flat skeleton bars (no radius above 2px, no shadow)", () => {
    renderSuccess();
    const bars = Array.from(screen.getByRole("status").querySelectorAll(".animate-pulse"));
    expect(bars.length).toBeGreaterThan(0);
    for (const bar of bars) {
      const offenders = Array.from(bar.classList).filter((c) =>
        /^(rounded-(md|lg|xl|full|pill|card)|shadow.*)$/.test(c),
      );
      expect(offenders).toEqual([]);
    }
  });

  it("GUARD: syncs payment once, then polls the booking and keeps polling every 2s", async () => {
    vi.useFakeTimers();
    renderSuccess();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockSyncPayment).toHaveBeenCalledTimes(1);
    expect(mockSyncPayment).toHaveBeenCalledWith("abc123");
    expect(mockGetById).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(mockGetById).toHaveBeenCalledTimes(2);
    expect(mockSyncPayment).toHaveBeenCalledTimes(1);
  });

  it("GUARD: swaps to the confirmed state once the booking is confirmed", async () => {
    vi.useFakeTimers();
    renderSuccess();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    mockGetById.mockResolvedValue({ status: "CONFIRMED" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByRole("heading", { level: 1, name: /booking confirmed/i })).toBeVisible();
    expect(screen.queryByRole("status")).toBeNull();
  });
});

// NH-146 (booking-admin-error-states): success is only claimed for a confirmed booking.

describe("BookingSuccessPage: still processing (timeout)", () => {
  beforeEach(() => {
    mockGetById.mockReset();
    mockSyncPayment.mockReset();
    mockSyncPayment.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function runToTimeout() {
    vi.useFakeTimers();
    const view = renderSuccess();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(31_000);
    });
    return view;
  }

  function expectStillProcessing(container: HTMLElement) {
    const panel = screen.getByRole("status");
    expect(panel).toHaveTextContent("Still processing");
    expect(panel).toHaveTextContent(/check my bookings shortly/i);
    expect(panel).toHaveClass("border-2", "border-border", "bg-surface-inset");
    expect(panel).not.toHaveAttribute("aria-busy", "true");
    expect(container.querySelector(".bg-ember")).toBeNull();
    expect(panel.querySelector("svg")).toBeNull();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Still processing");
    expect(screen.queryByText(/booking confirmed/i)).toBeNull();
    expect(screen.queryByText(/your booking is confirmed/i)).toBeNull();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/bookings");
  }

  it("a booking that stays PENDING_PAYMENT shows the Still processing panel at timeout", async () => {
    mockGetById.mockResolvedValue({ status: "PENDING_PAYMENT" });
    const { container } = await runToTimeout();
    expectStillProcessing(container);
  });

  it("every poll rejected until timeout shows the same Still processing panel", async () => {
    mockGetById.mockRejectedValue(new Error("network"));
    const { container } = await runToTimeout();
    expectStillProcessing(container);
  });

  it("a COMPLETED booking is still confirmed", async () => {
    mockGetById.mockResolvedValue({ status: "COMPLETED" });
    renderSuccess();
    expect(
      await screen.findByRole("heading", { level: 1, name: /booking confirmed/i }),
    ).toBeVisible();
  });
});

describe("BookingSuccessPage: missing booking id", () => {
  beforeEach(() => {
    mockGetById.mockReset();
    mockSyncPayment.mockReset();
  });

  it("shows the not-found panel with one /bookings link and no confirmation", async () => {
    const { container } = renderSuccess("");
    expect(
      await screen.findByRole("heading", { level: 1, name: /we could not find your booking/i }),
    ).toBeVisible();
    expect(screen.getByText("Open My bookings to see your reservations.")).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.queryByText(/booking confirmed/i)).toBeNull();
    expect(screen.queryByText(/your booking is confirmed/i)).toBeNull();
    expect(container.querySelector(".bg-ember")).toBeNull();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/bookings");
  });

  it("neither polls nor syncs payment", async () => {
    vi.useFakeTimers();
    try {
      renderSuccess("");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_000);
      });
      expect(mockGetById).not.toHaveBeenCalled();
      expect(mockSyncPayment).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
