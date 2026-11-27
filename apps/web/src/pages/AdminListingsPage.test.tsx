import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminListingsPage } from "./AdminListingsPage.js";
import { ApiError } from "../api/client.js";
import adminListingsSource from "./AdminListingsPage.tsx?raw";

const mockListListings = vi.fn();
const mockDisableListing = vi.fn();
const mockEnableListing = vi.fn();

vi.mock("../api/admin.js", () => ({
  adminApi: {
    listListings: (...args: unknown[]) => mockListListings(...args),
    disableListing: (...args: unknown[]) => mockDisableListing(...args),
    enableListing: (...args: unknown[]) => mockEnableListing(...args),
  },
}));

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    user: { id: "a1", email: "admin@test.com", roles: ["admin"] },
    isLoading: false,
  }),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage(qc: QueryClient = makeQC()) {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminListingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockListings = {
  data: [
    {
      id: "l1",
      title: "Beach Loft",
      type: "PROPERTY" as const,
      city: "Lisbon",
      status: "PUBLISHED" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
      host: { email: "host@example.com" },
    },
    {
      id: "l2",
      title: "City Desk",
      type: "WORKSPACE" as const,
      city: "Porto",
      status: "DISABLED" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
      host: { email: "host2@example.com" },
    },
  ],
  total: 2,
  page: 1,
  limit: 50,
};

// jsdom ignores media queries, so the table and the card list are both in the DOM. Every
// single-match query below is scoped to one layout (NH-123 duplicate-DOM rule).
async function loaded(container: HTMLElement) {
  await screen.findByRole("table", { hidden: true });
  return container;
}

describe("AdminListingsPage", () => {
  beforeEach(() => {
    mockListListings.mockReset();
    mockDisableListing.mockReset();
    mockEnableListing.mockReset();
  });

  it("renders listing title and host email", async () => {
    mockListListings.mockResolvedValue(mockListings);
    renderPage();
    const table = await screen.findByRole("table");
    expect(await within(table).findByText("Beach Loft")).toBeInTheDocument();
    expect(within(table).getByText("host@example.com")).toBeInTheDocument();
  });

  it("calls adminApi.disableListing when Disable clicked", async () => {
    mockListListings.mockResolvedValue(mockListings);
    mockDisableListing.mockResolvedValue({
      ...mockListings.data[0],
      status: "DISABLED",
    });
    const qc = makeQC();
    const invalidate = vi.spyOn(qc, "invalidateQueries");
    renderPage(qc);

    const table = await screen.findByRole("table");
    const disableBtn = await within(table).findByRole("button", { name: /disable/i });
    await userEvent.click(disableBtn);

    await waitFor(() => expect(mockDisableListing).toHaveBeenCalledWith("l1"));
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "listings"] }),
    );
  });

  it("shows empty state when no listings", async () => {
    mockListListings.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
    renderPage();
    expect(await screen.findByText(/no listings found/i)).toBeInTheDocument();
  });
});

// NH-123 identity tests (admin-identity, tasks 1.2, 1.4, 1.5, 1.7). jsdom does not compute Tailwind,
// so shape is asserted through class tokens. Selector assumptions:
//  - table = the only <table>; table container = its parent; head row = "thead tr";
//  - card list = the only <ul>; card = each of its <li>;
//  - status tag = the single element whose own text is exactly the label inside one layout;
//  - error panel = the single role="alert" element; tile = its [aria-hidden="true"] descendant.
// Tests marked GUARD pass before the restyle and must keep passing.

function required<T extends Element>(el: T | null | undefined, what: string): T {
  if (!el) throw new Error(`missing structure: ${what}`);
  return el;
}

function tableOf(container: HTMLElement): HTMLElement {
  return required(container.querySelector<HTMLElement>("table"), "table");
}

function listOf(container: HTMLElement): HTMLElement {
  return required(container.querySelector<HTMLElement>("ul"), "card list (ul)");
}

function cardsOf(container: HTMLElement): HTMLElement[] {
  return Array.from(listOf(container).querySelectorAll<HTMLElement>(":scope > li"));
}

function expectPending(button: HTMLElement) {
  expect(button).toHaveAttribute("aria-disabled", "true");
  expect(button).not.toHaveAttribute("disabled");
}

function expectNotPending(button: HTMLElement) {
  expect(button).not.toHaveAttribute("aria-disabled", "true");
}

function cardOf(container: HTMLElement, title: string): HTMLElement {
  const card = cardsOf(container).find((li) => within(li).queryByText(title));
  return required(card, `card ${title}`);
}

function listing(
  id: string,
  title: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    title,
    type: "PROPERTY",
    city: "Lisbon",
    status: "PUBLISHED",
    createdAt: "2026-01-01T00:00:00.000Z",
    host: { email: `${id}@example.com` },
    ...overrides,
  };
}

const MIXED = {
  data: [
    listing("pub", "Published Cabin", { status: "PUBLISHED" }),
    listing("draft", "Draft Flat", { status: "DRAFT", city: "Madrid" }),
    listing("dis", "Disabled Desk", { status: "DISABLED", type: "WORKSPACE", city: "Porto" }),
  ],
  total: 3,
  page: 1,
  limit: 50,
};

describe("AdminListingsPage identity: frame and tags", () => {
  beforeEach(() => {
    mockListListings.mockReset();
    mockDisableListing.mockReset();
    mockEnableListing.mockReset();
    mockListListings.mockResolvedValue(MIXED);
  });

  it("has exactly one black heavy h1 and no ember surface", async () => {
    const { container } = renderPage();
    await loaded(container);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Listings");
    expect(h1s[0]).toHaveClass("font-black", "text-fg");
    expect(container.innerHTML).not.toMatch(/ember/);
  });

  it("renders no pill and no Badge, and defines no local status label or tone helper", async () => {
    const { container } = renderPage();
    await loaded(container);
    expect(container.querySelector(".rounded-pill")).toBeNull();
    expect(adminListingsSource).not.toMatch(/\bBadge\b/);
    expect(adminListingsSource).not.toMatch(/listingStatusTone|listingStatusLabel|statusLabel/);
    expect(adminListingsSource).toMatch(/listingTypeLabel/);
  });

  it("reuses ListingStatusTag from the shared component", () => {
    expect(adminListingsSource).toMatch(
      /import\s*\{\s*ListingStatusTag\s*\}\s*from\s*"\.\.\/components\/ListingStatusTag\.js"/,
    );
    expect(adminListingsSource).toMatch(/<ListingStatusTag\b/);
  });

  it("status is carried by shape through ListingStatusTag, in both layouts, never a pill", async () => {
    const { container } = renderPage();
    await loaded(container);
    for (const scope of [tableOf(container), listOf(container)]) {
      const draft = within(scope).getByText("Draft", { exact: true });
      expect(draft).toHaveClass("border-2", "border-dashed");
      const published = within(scope).getByText("Published", { exact: true });
      expect(published).toHaveClass("border-2", "border-border");
      expect(published).not.toHaveClass("border-dashed");
      const marker = required(published.querySelector('[aria-hidden="true"]'), "published marker");
      expect(marker.textContent).toBe("");
      const disabled = within(scope).getByText("Disabled", { exact: true });
      expect(disabled).toHaveClass("line-through", "border-border-muted");
      for (const tag of [draft, published, disabled]) {
        expect(tag).not.toHaveClass("rounded-pill");
        expect(tag).toHaveClass("rounded-sm");
      }
    }
  });

  it("a text query for each label matches exactly one element within one layout", async () => {
    const { container } = renderPage();
    await loaded(container);
    for (const scope of [tableOf(container), listOf(container)]) {
      for (const label of ["Draft", "Published", "Disabled"]) {
        expect(within(scope).getAllByText(label)).toHaveLength(1);
      }
    }
  });
});

describe("AdminListingsPage identity: layouts", () => {
  beforeEach(() => {
    mockListListings.mockReset();
    mockDisableListing.mockReset();
    mockEnableListing.mockReset();
    mockListListings.mockResolvedValue(MIXED);
  });

  it("the table container is hidden below sm and the card list is hidden from sm up", async () => {
    const { container } = renderPage();
    await loaded(container);
    const wrap = required(tableOf(container).parentElement, "table container");
    expect(wrap).toHaveClass("hidden", "sm:block");
    expect(listOf(container)).toHaveClass("sm:hidden");
  });

  it("the head row has a 2px bottom rule and bold headings with the existing labels", async () => {
    const { container } = renderPage();
    await loaded(container);
    const headRow = required(container.querySelector("thead tr"), "head row");
    expect(headRow).toHaveClass("border-b-2", "border-border");
    const headings = Array.from(container.querySelectorAll("thead th"));
    expect(headings.map((th) => th.textContent)).toEqual([
      "Title",
      "Type",
      "City",
      "Host",
      "Status",
      "Actions",
    ]);
    for (const th of headings) expect(th).toHaveClass("font-bold", "text-fg");
  });

  it("GUARD: the table has one body row per listing with the type label and city", async () => {
    const { container } = renderPage();
    await loaded(container);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
    const table = tableOf(container);
    expect(within(table).getAllByText("Property")).toHaveLength(2);
    expect(within(table).getAllByText("Workspace")).toHaveLength(1);
    expect(within(table).getByText("Madrid")).toBeInTheDocument();
  });

  it("each card is a flat rounded-card with a 2px ink edge, no shadow or ring", async () => {
    const { container } = renderPage();
    await loaded(container);
    const cards = cardsOf(container);
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card).toHaveClass("rounded-card", "border-2", "border-border", "min-w-0");
      expect(Array.from(card.classList).some((c) => /^(shadow|ring)/.test(c))).toBe(false);
    }
  });

  it("a card holds the title, tag, type and city line, host email and the action", async () => {
    const { container } = renderPage();
    await loaded(container);
    const desk = cardOf(container, "Disabled Desk");
    const title = within(desk).getByText("Disabled Desk");
    expect(title).toHaveClass("break-words", "font-bold");
    expect(required(title.parentElement, "title column")).toHaveClass("min-w-0");
    expect(within(desk).getByText("Disabled", { exact: true })).toBeInTheDocument();
    expect(within(desk).getByText(/Workspace/)).toBeInTheDocument();
    expect(within(desk).getByText(/Porto/)).toBeInTheDocument();
    expect(within(desk).getByText("dis@example.com")).toHaveClass("break-all");
    expect(within(desk).getByRole("button", { name: "Re-enable" })).toBeInTheDocument();

    const cabin = cardOf(container, "Published Cabin");
    expect(within(cabin).getByText("Published", { exact: true })).toBeInTheDocument();
    expect(within(cabin).getByText(/Property/)).toBeInTheDocument();
    expect(within(cabin).getByRole("button", { name: "Disable" })).toBeInTheDocument();
  });
});

describe("AdminListingsPage identity: actions", () => {
  beforeEach(() => {
    mockListListings.mockReset();
    mockDisableListing.mockReset();
    mockEnableListing.mockReset();
    mockListListings.mockResolvedValue(MIXED);
  });

  it("Disable and Re-enable are real 44px buttons in both layouts", async () => {
    const { container } = renderPage();
    await loaded(container);
    for (const scope of [tableOf(container), listOf(container)]) {
      for (const name of ["Disable", "Re-enable"]) {
        const btn = within(scope).getAllByRole("button", { name })[0] as HTMLElement;
        expect(btn.tagName).toBe("BUTTON");
        expect(btn).toHaveClass("min-h-11");
      }
    }
  });

  it("Re-enable carries the flat secondary classes; Disable stays destructive", async () => {
    const { container } = renderPage();
    await loaded(container);
    for (const scope of [tableOf(container), listOf(container)]) {
      const enable = within(scope).getByRole("button", { name: "Re-enable" });
      expect(enable).toHaveClass("border-2", "border-border", "bg-transparent");
      expect(enable).not.toHaveClass("![box-shadow:none]");
      expect(enable).not.toHaveClass("border");
      expect(enable.className).not.toMatch(/(?:^|[\s:])(?:ring|shadow)(?:-|\s|$)/);
      for (const disable of within(scope).getAllByRole("button", { name: "Disable" })) {
        expect(disable).not.toHaveClass("![box-shadow:none]");
      }
    }
  });

  it("card actions are full width", async () => {
    const { container } = renderPage();
    await loaded(container);
    const list = listOf(container);
    for (const btn of within(list).getAllByRole("button")) {
      expect(btn).toHaveClass("w-full", "sm:w-auto");
    }
  });

  it("GUARD: a draft and a published listing both offer Disable, a disabled one Re-enable", async () => {
    const { container } = renderPage();
    await loaded(container);
    const table = tableOf(container);
    expect(within(table).getAllByRole("button", { name: "Disable" })).toHaveLength(2);
    expect(within(table).getAllByRole("button", { name: "Re-enable" })).toHaveLength(1);
  });

  it("GUARD: Disable from a card fires disableListing with the id and invalidates the same key", async () => {
    mockDisableListing.mockResolvedValue({});
    const qc = makeQC();
    const invalidate = vi.spyOn(qc, "invalidateQueries");
    const { container } = renderPage(qc);
    await loaded(container);
    await userEvent.click(
      within(cardOf(container, "Published Cabin")).getByRole("button", { name: "Disable" }),
    );
    await waitFor(() => expect(mockDisableListing).toHaveBeenCalledWith("pub"));
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "listings"] }),
    );
    expect(mockEnableListing).not.toHaveBeenCalled();
  });

  it("GUARD: Re-enable fires enableListing with the id and invalidates the same key", async () => {
    mockEnableListing.mockResolvedValue({});
    const qc = makeQC();
    const invalidate = vi.spyOn(qc, "invalidateQueries");
    const { container } = renderPage(qc);
    await loaded(container);
    await userEvent.click(within(tableOf(container)).getByRole("button", { name: "Re-enable" }));
    await waitFor(() => expect(mockEnableListing).toHaveBeenCalledWith("dis"));
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "listings"] }),
    );
    expect(mockDisableListing).not.toHaveBeenCalled();
  });

  it("GUARD: the data flow is unchanged (one list call, same names; pending is covered by NH-146)", async () => {
    mockDisableListing.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    await loaded(container);
    expect(mockListListings).toHaveBeenCalledTimes(1);
    expect(mockListListings).toHaveBeenCalledWith();

    const table = tableOf(container);
    const disable = within(table).getAllByRole("button", { name: "Disable" })[0] as HTMLElement;
    await userEvent.click(disable);
    expect(mockDisableListing).toHaveBeenCalledWith("pub");

    const buttons = screen.getAllByRole("button");
    expect(buttons.every((b) => b.textContent === "Disable" || b.textContent === "Re-enable")).toBe(
      true,
    );
    for (const b of buttons) expect(b).not.toHaveAttribute("aria-label");
  });
});

describe("AdminListingsPage identity: states", () => {
  beforeEach(() => {
    mockListListings.mockReset();
  });

  it("empty: the existing text sits in a dashed 2px panel", async () => {
    mockListListings.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
    renderPage();
    const text = await screen.findByText("No listings found.");
    const panel = required(text.closest<HTMLElement>(".border-dashed"), "dashed empty panel");
    expect(panel).toHaveClass("border-2", "border-border");
  });

  it("error: one alert holding one h1 with the generic text, solid danger edge, tint and a filled tile", async () => {
    mockListListings.mockRejectedValue(new Error("boom"));
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
    mockListListings.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    const busy = required(container.querySelector('[aria-busy="true"]'), "aria-busy container");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    const classes = [busy, ...Array.from(busy.querySelectorAll("*"))].flatMap((el) =>
      Array.from(el.classList),
    );
    expect(classes.filter((c) => /^(rounded-(pill|md|lg|xl|full)|shadow.*)$/.test(c))).toEqual([]);
  });
});

describe("AdminListingsPage table: long strings", () => {
  beforeEach(() => {
    mockListListings.mockReset();
    mockListListings.mockResolvedValue(MIXED);
  });

  it("wraps title, city and host email in capped overflow-wrap:anywhere boxes and keeps the actions on one line", async () => {
    const { container } = renderPage();
    await loaded(container);
    const row = required(container.querySelector("tbody tr"), "body row");
    const cells = Array.from(row.querySelectorAll("td"));
    const expected: [number, string][] = [
      [0, "max-w-[18rem]"],
      [2, "max-w-[10rem]"],
      [3, "max-w-[14rem]"],
    ];
    for (const [i, cap] of expected) {
      const box = required(cells[i]?.querySelector("div"), `wrapper in cell ${i}`);
      expect(box).toHaveClass(cap, "[overflow-wrap:anywhere]");
    }
    const actions = required(cells[cells.length - 1], "actions cell");
    expect(actions).toHaveClass("whitespace-nowrap", "pr-1");
    const lastTh = required(Array.from(container.querySelectorAll("thead th")).pop(), "last th");
    expect(lastTh).toHaveClass("pr-1");
  });
});

// NH-146 (booking-admin-error-states): pending and error feedback on moderation actions.

describe("AdminListingsPage: pending and error feedback (NH-146)", () => {
  beforeEach(() => {
    mockListListings.mockReset();
    mockDisableListing.mockReset();
    mockEnableListing.mockReset();
    mockListListings.mockResolvedValue(MIXED);
  });

  it("marks the row button aria-disabled while in flight and ignores further activations", async () => {
    mockDisableListing.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    await loaded(container);
    const table = tableOf(container);
    const disable = within(table).getAllByRole("button", { name: "Disable" })[0] as HTMLElement;
    await userEvent.click(disable);
    await waitFor(() => expectPending(disable));
    await userEvent.click(disable);
    disable.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(mockDisableListing).toHaveBeenCalledTimes(1);
    expectNotPending(within(table).getAllByRole("button", { name: "Disable" })[1] as HTMLElement);
    expectNotPending(within(table).getByRole("button", { name: "Re-enable" }));
  });

  it("marks the row button aria-disabled while Re-enable is in flight", async () => {
    mockEnableListing.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    await loaded(container);
    const reenable = within(tableOf(container)).getByRole("button", { name: "Re-enable" });
    await userEvent.click(reenable);
    await waitFor(() => expectPending(reenable));
    await userEvent.click(reenable);
    reenable.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(mockEnableListing).toHaveBeenCalledTimes(1);
  });

  it("a failed disable shows the display message in an alert and the button is no longer pending", async () => {
    mockDisableListing.mockRejectedValue(
      new ApiError(500, { message: "Could not disable listing." }),
    );
    const { container } = renderPage();
    await loaded(container);
    const disable = within(tableOf(container)).getAllByRole("button", {
      name: "Disable",
    })[0] as HTMLElement;
    await userEvent.click(disable);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not disable listing.");
    expectNotPending(disable);
  });

  it("a failed enable shows the generic message when the server sent none", async () => {
    mockEnableListing.mockRejectedValue(new Error("boom"));
    const { container } = renderPage();
    await loaded(container);
    const reenable = within(tableOf(container)).getByRole("button", { name: "Re-enable" });
    await userEvent.click(reenable);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expectNotPending(reenable);
  });

  it("the error is cleared when the next action starts", async () => {
    mockDisableListing.mockRejectedValueOnce(
      new ApiError(500, { message: "Could not disable listing." }),
    );
    mockDisableListing.mockReturnValueOnce(new Promise(() => {}));
    const { container } = renderPage();
    await loaded(container);
    const disable = within(tableOf(container)).getAllByRole("button", {
      name: "Disable",
    })[0] as HTMLElement;
    await userEvent.click(disable);
    await screen.findByRole("alert");
    await userEvent.click(disable);
    await waitFor(() => expect(mockDisableListing).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("a successful action refetches the list and the button is no longer pending", async () => {
    mockDisableListing.mockResolvedValue({});
    const { container } = renderPage();
    await loaded(container);
    const disable = within(tableOf(container)).getAllByRole("button", {
      name: "Disable",
    })[0] as HTMLElement;
    await userEvent.click(disable);
    await waitFor(() => expect(mockListListings).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).toBeNull();
    expectNotPending(
      within(tableOf(container)).getAllByRole("button", { name: "Disable" })[0] as HTMLElement,
    );
  });
});

// NH-146 (admin-moderation-keeps-focus): focus retention and key repeat.

const LAYOUTS = ["table", "card list"] as const;

const ACTIONS = [
  {
    action: "Disable",
    opposite: "Re-enable",
    key: "Published Cabin",
    id: "pub",
    mock: mockDisableListing,
  },
  {
    action: "Re-enable",
    opposite: "Disable",
    key: "Disabled Desk",
    id: "dis",
    mock: mockEnableListing,
  },
];

const CASES = LAYOUTS.flatMap((layout) => ACTIONS.map((a) => ({ layout, ...a })));

function actionButton(container: HTMLElement, layout: (typeof LAYOUTS)[number], key: string) {
  const scope =
    layout === "table"
      ? required(within(tableOf(container)).getByText(key).closest<HTMLElement>("tr"), `row ${key}`)
      : cardOf(container, key);
  return within(scope).getByRole("button");
}

function flipped(id: string) {
  return {
    ...MIXED,
    data: MIXED.data.map((item) => {
      if (item.id !== id) return item;
      return id === "pub" ? { ...item, status: "DISABLED" } : { ...item, status: "PUBLISHED" };
    }),
  };
}

describe("AdminListingsPage: moderation actions keep focus (NH-146)", () => {
  beforeEach(() => {
    mockListListings.mockReset();
    mockDisableListing.mockReset();
    mockEnableListing.mockReset();
    mockListListings.mockResolvedValue(MIXED);
  });

  it.each(CASES)(
    "$layout $action: the same button keeps focus while pending and after success",
    async ({ layout, action, opposite, key, id, mock }) => {
      let resolve: (value: unknown) => void = () => {};
      mock.mockReturnValue(new Promise((res) => (resolve = res)));
      const { container } = renderPage();
      await loaded(container);
      const button = actionButton(container, layout, key);
      expect(button).toHaveTextContent(action);
      button.focus();
      await userEvent.keyboard("{Enter}");

      await waitFor(() => expectPending(button));
      expect(document.activeElement).toBe(button);

      mockListListings.mockResolvedValue(flipped(id));
      resolve({});

      await waitFor(() => expect(actionButton(container, layout, key)).toHaveTextContent(opposite));
      expect(actionButton(container, layout, key)).toBe(button);
      expect(document.activeElement).toBe(button);
      expectNotPending(button);
    },
  );

  it.each(CASES)(
    "$layout $action: the button keeps focus while pending and after failure",
    async ({ layout, action, key, mock }) => {
      let reject: (reason: unknown) => void = () => {};
      mock.mockReturnValue(new Promise((_, rej) => (reject = rej)));
      const { container } = renderPage();
      await loaded(container);
      const button = actionButton(container, layout, key);
      button.focus();
      await userEvent.keyboard(" ");

      await waitFor(() => expectPending(button));
      expect(document.activeElement).toBe(button);

      reject(new Error("boom"));

      await screen.findByRole("alert");
      expect(actionButton(container, layout, key)).toBe(button);
      expect(button).toHaveTextContent(action);
      expect(document.activeElement).toBe(button);
      expectNotPending(button);
    },
  );
});
