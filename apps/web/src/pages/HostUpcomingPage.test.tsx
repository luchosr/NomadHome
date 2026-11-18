import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatDate } from "../lib/dates.js";
import { HostUpcomingPage } from "./HostUpcomingPage.js";

const mockHostAll = vi.fn();
vi.mock("../api/bookings.js", () => ({
  bookingsApi: { hostAll: (...args: unknown[]) => mockHostAll(...args) },
}));
vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    user: { id: "h1", email: "host@test.com", roles: ["host"] },
    isLoading: false,
  }),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <MemoryRouter>
        <HostUpcomingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockBookings = [
  {
    id: "b1",
    checkIn: "2027-01-10",
    checkOut: "2027-01-15",
    status: "CONFIRMED" as const,
    totalCents: 30000,
    currency: "USD",
    listing: { title: "Beach House" },
    guest: { email: "guest@example.com" },
  },
];

describe("HostUpcomingPage", () => {
  beforeEach(() => {
    mockHostAll.mockReset();
  });

  it("renders listing title and guest email", async () => {
    mockHostAll.mockResolvedValue(mockBookings);
    renderPage();
    // Both layouts (table from sm up, cards below) are in the DOM; jsdom ignores media queries.
    expect(await screen.findAllByText("Beach House")).toHaveLength(2);
    expect(screen.getAllByText("guest@example.com")).toHaveLength(2);
  });

  it("shows empty state when no bookings", async () => {
    mockHostAll.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText(/no bookings yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view my listings/i })).toHaveAttribute(
      "href",
      "/host/listings",
    );
  });
});

// NH-122 identity tests (host-identity, task 1.4). Selector assumptions (jsdom does not compute
// Tailwind, so shape is asserted through class tokens):
//  - head row = the single "thead tr"; table wrapper = the table's parent;
//  - booking tag = the single element whose own text is exactly the status label (the label is its
//    own text node); shape classes sit on that element, the completed marker is an
//    [aria-hidden="true"] descendant;
//  - error panel = the single role="alert" element; tile = its [aria-hidden="true"] descendant.
// Tests marked GUARD pass before the restyle and must keep passing.

function required<T extends Element>(el: T | null, what: string): T {
  if (!el) throw new Error(`missing structure: ${what}`);
  return el;
}

function booking(
  id: string,
  status: (typeof mockBookings)[number]["status"] | string,
  title: string,
) {
  return { ...(mockBookings[0] as object), id, status, listing: { title } };
}

const ALL_STATUSES = [
  booking("b-p", "PENDING_PAYMENT", "Pending Loft"),
  booking("b-c", "CONFIRMED", "Confirmed Loft"),
  booking("b-x", "CANCELLED", "Cancelled Loft"),
  booking("b-d", "COMPLETED", "Completed Loft"),
];

// Each layout is in the DOM at once (jsdom does not evaluate media queries), so queries are scoped.
const loaded = () => screen.findAllByText("Pending Loft");
const tableScope = () => within(screen.getByRole("table"));
const cardsScope = () => within(screen.getByRole("list"));

function tag(label: string): HTMLElement {
  return tableScope().getByText(label, { exact: true });
}

function cardTag(label: string): HTMLElement {
  return cardsScope().getByText(label, { exact: true });
}

describe("HostUpcomingPage identity: heading and table", () => {
  beforeEach(() => {
    mockHostAll.mockReset();
    mockHostAll.mockResolvedValue(ALL_STATUSES);
  });

  it("has exactly one black h1", async () => {
    renderPage();
    await loaded();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("All Bookings");
    expect(h1s[0]).toHaveClass("font-black", "text-fg");
  });

  it("the head row has a 2px ink bottom rule and bold ink headings", async () => {
    const { container } = renderPage();
    await loaded();
    const row = required(container.querySelector("thead tr"), "head row");
    expect(row).toHaveClass("border-b-2", "border-border");
    const headings = screen.getAllByRole("columnheader");
    expect(headings).toHaveLength(6);
    for (const th of headings) expect(th).toHaveClass("font-bold", "text-fg");
  });

  it("the table container is hidden below sm and shown from sm up", async () => {
    renderPage();
    await loaded();
    const container = required(screen.getByRole("table").parentElement, "table container");
    expect(container).toHaveClass("hidden", "sm:block");
  });

  it("amount cells use tabular figures", async () => {
    renderPage();
    await loaded();
    const amounts = tableScope().getAllByText("$300");
    expect(amounts.length).toBe(4);
    for (const cell of amounts) expect(cell).toHaveClass("tabular-nums");
  });

  it("GUARD: date and amount formatting is unchanged", async () => {
    mockHostAll.mockResolvedValue([booking("b1", "CONFIRMED", "Beach House")]);
    renderPage();
    await screen.findAllByText("Beach House");
    expect(tableScope().getByText("$300")).toBeInTheDocument();
    expect(tableScope().getByText(formatDate("2027-01-10"))).toBeInTheDocument();
    expect(screen.getAllByRole("cell")).toHaveLength(6);
  });
});

describe("HostUpcomingPage identity: cards below sm", () => {
  beforeEach(() => {
    mockHostAll.mockReset();
    mockHostAll.mockResolvedValue(ALL_STATUSES);
  });

  it("the card list is shown below sm only and is one list item per booking", async () => {
    renderPage();
    await loaded();
    const list = screen.getByRole("list");
    expect(list).toHaveClass("sm:hidden");
    expect(list).not.toHaveClass("sm:block");
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
  });

  it("each card is a flat 2px ink-edged rounded-card with no shadow or ring", async () => {
    renderPage();
    await loaded();
    for (const card of within(screen.getByRole("list")).getAllByRole("listitem")) {
      expect(card).toHaveClass("rounded-card", "border-2", "border-border", "min-w-0");
      expect(Array.from(card.classList).filter((c) => /^(shadow|ring)/.test(c))).toEqual([]);
    }
  });

  it("a card shows title, status tag, both dates, guest email and amount", async () => {
    mockHostAll.mockResolvedValue([booking("b1", "CONFIRMED", "Beach House")]);
    renderPage();
    await screen.findAllByText("Beach House");
    const card = within(within(screen.getByRole("list")).getByRole("listitem"));
    expect(card.getByText("Beach House")).toHaveClass("break-words");
    expect(card.getByText("Confirmed", { exact: true })).toBeInTheDocument();
    expect(card.getByText(formatDate("2027-01-10"))).toBeInTheDocument();
    expect(card.getByText(formatDate("2027-01-15"))).toBeInTheDocument();
    expect(card.getByText("guest@example.com")).toHaveClass("break-all");
    expect(card.getByText("$300")).toHaveClass("tabular-nums");
  });

  it("card tags carry the status by shape, like the table tags", async () => {
    renderPage();
    await loaded();
    expect(cardTag("Pending Payment")).toHaveClass("border-2", "border-dashed");
    expect(cardTag("Confirmed")).toHaveClass("border-2", "border-border");
    expect(cardTag("Cancelled")).toHaveClass("border-border-muted", "line-through");
    required(cardTag("Completed").querySelector('[aria-hidden="true"]'), "completed marker");
    for (const label of ["Pending Payment", "Confirmed", "Cancelled", "Completed"]) {
      expect(cardTag(label)).not.toHaveClass("rounded-pill");
    }
  });

  it("only one layout is exposed: each status label appears once per layout", async () => {
    renderPage();
    await loaded();
    for (const label of ["Pending Payment", "Confirmed", "Cancelled", "Completed"]) {
      expect(tableScope().getAllByText(label, { exact: true })).toHaveLength(1);
      expect(cardsScope().getAllByText(label, { exact: true })).toHaveLength(1);
    }
  });
});

describe("HostUpcomingPage identity: booking status tags", () => {
  beforeEach(() => {
    mockHostAll.mockReset();
    mockHostAll.mockResolvedValue(ALL_STATUSES);
  });

  it("GUARD: every status label matches exactly one element", async () => {
    renderPage();
    await loaded();
    for (const label of ["Pending Payment", "Confirmed", "Cancelled", "Completed"]) {
      expect(screen.getAllByText(label, { exact: true })).toHaveLength(2);
    }
  });

  it("pending is dashed", async () => {
    renderPage();
    await loaded();
    expect(tag("Pending Payment")).toHaveClass("border-2", "border-dashed", "border-border");
  });

  it("confirmed is solid ink", async () => {
    renderPage();
    await loaded();
    const el = tag("Confirmed");
    expect(el).toHaveClass("border-2", "border-border");
    expect(el).not.toHaveClass("border-dashed");
    expect(el).not.toHaveClass("line-through");
  });

  it("cancelled is struck through with the muted solid edge", async () => {
    renderPage();
    await loaded();
    const el = tag("Cancelled");
    expect(el).toHaveClass("border-2", "border-border-muted", "line-through");
    expect(el).not.toHaveClass("border-dashed");
  });

  it("completed is solid ink with an aria-hidden marker", async () => {
    renderPage();
    await loaded();
    const el = tag("Completed");
    expect(el).toHaveClass("border-2", "border-border");
    expect(el).not.toHaveClass("border-dashed");
    required(el.querySelector('[aria-hidden="true"]'), "completed marker");
  });

  it("no tag is a pill", async () => {
    renderPage();
    await loaded();
    for (const label of ["Pending Payment", "Confirmed", "Cancelled", "Completed"]) {
      expect(tag(label)).not.toHaveClass("rounded-pill");
    }
  });
});

describe("HostUpcomingPage identity: states", () => {
  beforeEach(() => {
    mockHostAll.mockReset();
  });

  it("GUARD: empty still renders EmptyState with the same message and link", async () => {
    mockHostAll.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText("No bookings yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View my listings" })).toHaveAttribute(
      "href",
      "/host/listings",
    );
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("error: one alert holding one h1 with the generic text, solid danger edge, tint and a filled tile", async () => {
    mockHostAll.mockRejectedValue(new Error("boom"));
    const { container } = renderPage();
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    const h1 = within(alert).getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent("Something went wrong. Please try again.");
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
    const tile = required(alert.querySelector<HTMLElement>('[aria-hidden="true"]'), "danger tile");
    expect(tile).toHaveClass("bg-danger");
    expect(container.querySelector(".max-w-5xl")?.contains(alert)).toBe(true);
  });

  it("loading: aria-busy, no h1 and no pill, rounded or shadow block", () => {
    mockHostAll.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    const busy = required(container.querySelector('[aria-busy="true"]'), "aria-busy container");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    const classes = [busy, ...Array.from(busy.querySelectorAll("*"))].flatMap((el) =>
      Array.from(el.classList),
    );
    expect(classes.filter((c) => /^(rounded-(pill|md|lg|xl|full)|shadow.*)$/.test(c))).toEqual([]);
  });
});
