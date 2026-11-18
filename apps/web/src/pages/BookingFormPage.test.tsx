import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingFormPage } from "./BookingFormPage.js";
import { expectButtonLink } from "../test/buttonLink.js";
import { ApiError } from "../api/client.js";
import type { ListingDetail } from "../api/listings.js";

// NH-124 identity tests (booking-payment-identity, tasks 1.1 to 1.4). jsdom does not compute Tailwind,
// so shape is asserted through class tokens. Selector assumptions:
//  - summary panel = nearest ".rounded-card" ancestor of the listing title (design D2 keeps the class);
//  - total band = nearest ancestor-or-self of the "Total" label that has "bg-ember" (the band may be
//    the row itself or its wrapper); label and amount are sibling nodes of one row;
//  - decorative tile = the first [aria-hidden="true"] descendant of a state panel;
//  - photo "no radius" accepts no radius class or "rounded-none" (task says none, design says rounded-none).
// Tests marked GUARD pass before the restyle and must keep passing.

// --- mocks ---

const mockGetDetail = vi.fn();
vi.mock("../api/listings.js", () => ({
  listingsApi: { getDetail: (...args: unknown[]) => mockGetDetail(...args) },
}));

const mockCreate = vi.fn();
const mockCheckout = vi.fn();
const mockQuote = vi.fn();
vi.mock("../api/bookings.js", () => ({
  bookingsApi: {
    create: (...args: unknown[]) => mockCreate(...args),
    checkout: (...args: unknown[]) => mockCheckout(...args),
    quote: (...args: unknown[]) => mockQuote(...args),
  },
}));

const mockUseAuth = vi.fn();
vi.mock("../contexts/auth.js", () => ({
  useAuth: () => mockUseAuth(),
}));

// --- helpers ---

function makeQueryClient() {
  // retryDelay 0: the page sets its own `retry` (two retries on non-404), so a 500 settles fast.
  return new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } });
}

function renderForm(search = "?checkIn=2026-07-10&checkOut=2026-07-12") {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[`/listings/abc/book${search}`]}>
        <Routes>
          <Route path="/listings/:id/book" element={<BookingFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockListing: ListingDetail = {
  id: "abc",
  title: "Ocean View Suite",
  type: "PROPERTY",
  city: "Porto",
  country: "PT",
  addressLine: "Rua da Praia 10",
  description: "A beautiful suite.",
  capacity: 2,
  nightlyRateCents: 10000,
  currency: "EUR",
  amenities: [],
  photos: [],
  _count: { reviews: 0 },
  avgRating: null,
};

// 2 nights x €100.00 = €200.00 subtotal; 15% service fee = €30.00; total €230.00
const mockQuoteResponse = {
  nights: 2,
  nightlyRateCents: 10000,
  subtotalCents: 20000,
  guestServiceFeeBps: 1500,
  guestServiceFeeCents: 3000,
  totalChargedCents: 23000,
  currency: "EUR",
};

// --- tests ---

describe("BookingFormPage", () => {
  beforeEach(() => {
    mockGetDetail.mockReset();
    mockCreate.mockReset();
    mockCheckout.mockReset();
    mockQuote.mockReset();
    mockQuote.mockResolvedValue(mockQuoteResponse);
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "guest@test.com", roles: ["guest"] },
      isLoading: false,
    });
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("shows listing title and nights when listing loads", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    renderForm();

    expect(await screen.findByText("Ocean View Suite")).toBeInTheDocument();
    expect(screen.getByText(/nights/i)).toBeInTheDocument();
    // Fee-inclusive total display is covered by the dedicated "renders
    // itemized subtotal..." test below, sourced from the quote — not
    // duplicated/weakened here.
  });

  it("calls create then checkout then redirects on Pay now click", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockCreate.mockResolvedValue({
      id: "booking-1",
      listingId: "abc",
      checkIn: "2026-07-10",
      checkOut: "2026-07-12",
      status: "PENDING",
    });
    mockCheckout.mockResolvedValue({
      url: "https://checkout.stripe.com/abc",
      sessionId: "sess_1",
    });

    renderForm();
    await screen.findByText("Ocean View Suite");

    await userEvent.click(screen.getByRole("button", { name: /pay now/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        listingId: "abc",
        checkIn: "2026-07-10",
        checkOut: "2026-07-12",
      });
    });
    await waitFor(() => expect(mockCheckout).toHaveBeenCalledWith("booking-1"));
    await waitFor(() => expect(window.location.href).toBe("https://checkout.stripe.com/abc"));
  });

  it("shows overlap error when create throws ApiError 409 OVERLAP_CONFLICT", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockCreate.mockRejectedValue(
      new ApiError(409, {
        error: "OVERLAP_CONFLICT",
        message: "These dates are no longer available.",
      }),
    );

    renderForm();
    await screen.findByText("Ocean View Suite");

    await userEvent.click(screen.getByRole("button", { name: /pay now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no longer available/i);
  });

  it("shows self-booking error when create throws ApiError 422 SELF_BOOKING_NOT_ALLOWED", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockCreate.mockRejectedValue(
      new ApiError(422, {
        error: "SELF_BOOKING_NOT_ALLOWED",
        message: "You cannot book your own listing.",
      }),
    );

    renderForm();
    await screen.findByText("Ocean View Suite");

    await userEvent.click(screen.getByRole("button", { name: /pay now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/cannot book your own listing/i);
  });

  it("shows verification error when create throws ApiError 403 EMAIL_NOT_VERIFIED", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockCreate.mockRejectedValue(
      new ApiError(403, {
        error: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before booking.",
      }),
    );

    renderForm();
    await screen.findByText("Ocean View Suite");

    await userEvent.click(screen.getByRole("button", { name: /pay now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/verify your email/i);
  });

  it("shows the server-provided message when the listing is no longer available, instead of the generic fallback", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockCreate.mockRejectedValue(
      new ApiError(404, {
        error: "LISTING_NOT_AVAILABLE",
        message: "This listing was unpublished while you were booking.",
      }),
    );

    renderForm();
    await screen.findByText("Ocean View Suite");

    await userEvent.click(screen.getByRole("button", { name: /pay now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This listing was unpublished while you were booking.",
    );
  });

  it("shows the generic fallback message when the server sends no message field", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockCreate.mockRejectedValue(new ApiError(500, {}));

    renderForm();
    await screen.findByText("Ocean View Suite");

    await userEvent.click(screen.getByRole("button", { name: /pay now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
  });

  it("shows select_dates message when no checkIn param is provided", () => {
    renderForm("?checkOut=2026-07-12");
    expect(screen.getByText(/select check-in and check-out/i)).toBeInTheDocument();
    expect(mockGetDetail).not.toHaveBeenCalled();
  });

  it("renders itemized subtotal, service fee, and fee-inclusive total from the quote", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockQuote.mockResolvedValue(mockQuoteResponse);

    renderForm();
    await screen.findByText("Ocean View Suite");

    // Subtotal (nightly rate x nights) — €200.00
    expect((await screen.findAllByText(/200\.00/)).length).toBeGreaterThan(0);
    // Service fee line, labeled and showing €30.00
    expect(await screen.findByText(/service fee/i)).toBeInTheDocument();
    expect(screen.getAllByText(/30\.00/).length).toBeGreaterThan(0);
    // Fee-inclusive total = subtotalCents + guestServiceFeeCents = €230.00, not the old €200.00 base-only total
    const totalRow = screen.getByText(/^total$/i).closest("div");
    expect(totalRow).toHaveTextContent("230.00");
  });
});

// --- identity (NH-124) ---

const PHOTO_LISTING: ListingDetail = {
  ...mockListing,
  photos: [{ id: "p1", url: "https://example.com/photo.jpg", position: 0 }],
};
const DATES = "?checkIn=2026-08-01&checkOut=2026-08-04";
const GENERIC_ERROR = "Something went wrong. Please try again.";

function classesOf(el: Element): string[] {
  return Array.from(el.classList);
}

function hasClassMatching(el: Element, pattern: RegExp): boolean {
  return classesOf(el).some((c) => pattern.test(c));
}

function subtreeClasses(root: Element): string[] {
  return [root, ...Array.from(root.querySelectorAll("*"))].flatMap(classesOf);
}

function required<T extends Element>(el: T | null, what: string): T {
  if (!el) throw new Error(`missing structure: ${what}`);
  return el;
}

function summaryPanel(): HTMLElement {
  return required(
    screen.getByText("Ocean View Suite").closest<HTMLElement>(".rounded-card"),
    "summary panel with the rounded-card class",
  );
}

function totalBand(): HTMLElement {
  return required(
    screen.getByText(/^total$/i).closest<HTMLElement>(".bg-ember"),
    "total band with bg-ember",
  );
}

function tileOf(el: Element): HTMLElement {
  return required(el.querySelector<HTMLElement>('[aria-hidden="true"]'), "decorative tile");
}

async function renderLoaded(listing: ListingDetail = mockListing, search = DATES) {
  mockGetDetail.mockResolvedValue(listing);
  const view = renderForm(search);
  await screen.findByText(listing.title);
  return view;
}

describe("BookingFormPage identity: summary panel", () => {
  beforeEach(() => {
    mockGetDetail.mockReset();
    mockQuote.mockReset();
    mockQuote.mockResolvedValue(mockQuoteResponse);
  });

  it("GUARD: has exactly one h1 with the form title", async () => {
    await renderLoaded();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Confirm your booking");
  });

  it("summary panel has the 2px border class, rounded-card and no shadow", async () => {
    await renderLoaded();
    const panel = summaryPanel();
    expect(panel).toHaveClass("border-2", "border-border", "rounded-card");
    expect(hasClassMatching(panel, /^shadow/)).toBe(false);
    expect(panel).not.toHaveClass("rounded-xl");
  });

  it("photo has the 2px border class, no radius class and keeps the listing title as alt", async () => {
    await renderLoaded(PHOTO_LISTING);
    const photo = screen.getByAltText("Ocean View Suite");
    expect(photo).toHaveClass("border-2", "border-border");
    expect(hasClassMatching(photo, /^rounded-(?!none$)/)).toBe(false);
  });

  it("GUARD: dates render as raw ISO strings and the service fee label is present", async () => {
    await renderLoaded(mockListing, DATES);
    expect(screen.getByText("2026-08-01")).toBeInTheDocument();
    expect(screen.getByText("2026-08-04")).toBeInTheDocument();
    expect(await screen.findByText(/service fee/i)).toBeInTheDocument();
  });

  it("GUARD: the total row (closest div of the Total label) contains the total amount", async () => {
    await renderLoaded();
    await screen.findAllByText(/230\.00/);
    expect(screen.getByText(/^total$/i).closest("div")).toHaveTextContent("230.00");
  });
});

describe("BookingFormPage identity: total band", () => {
  beforeEach(() => {
    mockGetDetail.mockReset();
    mockQuote.mockReset();
    mockQuote.mockResolvedValue(mockQuoteResponse);
  });

  it("carries bg-ember and text-fg and no muted, subtle, inverse or danger text class", async () => {
    await renderLoaded();
    await screen.findAllByText(/230\.00/);
    const band = totalBand();
    expect(band).toHaveClass("bg-ember", "text-fg");
    const forbidden = /^text-(fg-muted|fg-subtle|fg-inverse|danger)$/;
    expect(subtreeClasses(band).filter((c) => forbidden.test(c))).toEqual([]);
    expect(band).toHaveTextContent("230.00");
  });

  it("label and amount are sibling nodes of one row", async () => {
    await renderLoaded();
    await screen.findAllByText(/230\.00/);
    const label = screen.getByText(/^total$/i);
    const amount = within(totalBand()).getByText(/230\.00/);
    expect(label).not.toBe(amount);
    expect(label.parentElement).not.toBeNull();
    expect(amount.parentElement).toBe(label.parentElement);
  });

  it("keeps Pay now outside the band", async () => {
    await renderLoaded();
    await screen.findAllByText(/230\.00/);
    expect(totalBand()).not.toContainElement(screen.getByRole("button", { name: /pay now/i }));
  });
});

describe("BookingFormPage identity: interactive elements", () => {
  beforeEach(() => {
    mockGetDetail.mockReset();
    mockCreate.mockReset();
    mockCheckout.mockReset();
    mockQuote.mockReset();
    mockQuote.mockResolvedValue(mockQuoteResponse);
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
  });

  it("GUARD: Pay now is a button and is not a descendant of a link", async () => {
    await renderLoaded();
    const pay = screen.getByRole("button", { name: /pay now/i });
    expect(pay.tagName).toBe("BUTTON");
    expect(pay.closest("a")).toBeNull();
  });

  it("GUARD: Pay now is disabled while the quote is loading", async () => {
    mockQuote.mockReturnValue(new Promise(() => {}));
    await renderLoaded();
    expect(screen.getByRole("button", { name: /pay now/i })).toBeDisabled();
  });

  it("GUARD: Pay now is disabled while submitting and still redirects to the checkout url", async () => {
    mockCreate.mockResolvedValue({ id: "booking-9" });
    let release: (v: { url: string; sessionId: string }) => void = () => {};
    mockCheckout.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    await renderLoaded();
    await screen.findAllByText(/230\.00/);
    await userEvent.click(screen.getByRole("button", { name: /pay now/i }));
    await waitFor(() => expect(mockCheckout).toHaveBeenCalledWith("booking-9"));
    expect(screen.getByRole("button", { name: "…" })).toBeDisabled();
    release({ url: "https://checkout.stripe.com/x", sessionId: "s" });
    await waitFor(() => expect(window.location.href).toBe("https://checkout.stripe.com/x"));
    expect(mockCreate).toHaveBeenCalledWith({
      listingId: "abc",
      checkIn: "2026-08-01",
      checkOut: "2026-08-04",
    });
  });

  it("back action is one link to the listing and contains no button", async () => {
    await renderLoaded();
    const back = screen.getByRole("link", { name: /back to listing/i });
    expect(back).toHaveAttribute("href", "/listings/abc");
    expect(back.querySelector("button")).toBeNull();
    expect(within(back).queryByRole("button")).toBeNull();
  });
});

describe("BookingFormPage button-link variants (NH-138)", () => {
  it("back link carries the tertiary classes plus px-2 underline hover:no-underline", async () => {
    const { container } = await renderLoaded();
    const back = screen.getByRole("link", { name: /back to listing/i });
    expectButtonLink(back, "tertiary", ["px-2", "underline", "hover:no-underline"]);
    expect(container.querySelector("a button")).toBeNull();
    expect(container.querySelector("button a")).toBeNull();
  });
});

describe("BookingFormPage identity: states", () => {
  beforeEach(() => {
    mockGetDetail.mockReset();
    mockCreate.mockReset();
    mockCheckout.mockReset();
    mockQuote.mockReset();
    mockQuote.mockResolvedValue(mockQuoteResponse);
  });

  it("no dates: one h1 with the select-dates text in a paper panel, one back link, no alert", () => {
    const { container } = renderForm("");
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Select check-in and check-out dates to book.");
    const panel = required(h1s[0]!.closest<HTMLElement>(".border-2"), "2px panel around the h1");
    expect(panel).toHaveClass("border-border", "bg-surface-raised");
    expect(panel).not.toHaveClass("border-dashed");
    expect(screen.queryByRole("alert")).toBeNull();
    const links = screen.getAllByRole("link", { name: /back to listing/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/listings/abc");
    expect(container.querySelector("a button")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("loading: aria-busy, no h1 and no rounded-xl, pill or shadow class", () => {
    mockGetDetail.mockReturnValue(new Promise(() => {}));
    const { container } = renderForm(DATES);
    const busy = required(container.querySelector('[aria-busy="true"]'), "aria-busy container");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    const offenders = subtreeClasses(busy).filter((c) =>
      /^(rounded-(xl|lg|md|full|pill)|shadow.*)$/.test(c),
    );
    expect(offenders).toEqual([]);
  });

  it("listing 404: one alert panel holding one h1, solid danger edge, tint fill and an aria-hidden tile", async () => {
    mockGetDetail.mockRejectedValue(new ApiError(404, { error: "NOT_FOUND" }));
    renderForm(DATES);
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(within(alert).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(alert).getByRole("heading", { level: 1 })).toHaveTextContent(
      "Listing not found.",
    );
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
    expect(tileOf(alert)).toHaveClass("bg-danger");
  });

  it("quote error: one alert panel holding one h1 with the generic text and a tile", async () => {
    mockGetDetail.mockResolvedValue(mockListing);
    mockQuote.mockRejectedValue(new ApiError(500, {}));
    renderForm(DATES);
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(within(alert).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(alert).getByRole("heading", { level: 1 })).toHaveTextContent(GENERIC_ERROR);
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
    expect(tileOf(alert)).toHaveClass("bg-danger");
  });

  it("server error renders through the shared alert: one alert, same text, tile, danger edge", async () => {
    mockCreate.mockRejectedValue(
      new ApiError(409, {
        error: "OVERLAP_CONFLICT",
        message: "These dates are no longer available.",
      }),
    );
    await renderLoaded();
    await screen.findAllByText(/230\.00/);
    await userEvent.click(screen.getByRole("button", { name: /pay now/i }));
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent("These dates are no longer available.");
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
    expect(tileOf(alert)).toHaveClass("bg-danger");
  });
});
