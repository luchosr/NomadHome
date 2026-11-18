import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminUsersPage } from "./AdminUsersPage.js";
import adminUsersSource from "./AdminUsersPage.tsx?raw";

const mockListUsers = vi.fn();
const mockDisableUser = vi.fn();
const mockEnableUser = vi.fn();

vi.mock("../api/admin.js", () => ({
  adminApi: {
    listUsers: (...args: unknown[]) => mockListUsers(...args),
    disableUser: (...args: unknown[]) => mockDisableUser(...args),
    enableUser: (...args: unknown[]) => mockEnableUser(...args),
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
        <AdminUsersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockUsers = {
  data: [
    {
      id: "u1",
      email: "alice@example.com",
      roles: ["guest"],
      disabledAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "u2",
      email: "bob@example.com",
      roles: ["host"],
      disabledAt: "2026-02-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  total: 2,
  page: 1,
  limit: 50,
};

// jsdom ignores media queries, so the table and the card list are both in the DOM. Every
// single-match query below is scoped to one layout (NH-123 duplicate-DOM rule): `table` is the
// table element, `list` is the card list.
async function loaded(container: HTMLElement) {
  await screen.findByRole("table", { hidden: true });
  return container;
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    mockListUsers.mockReset();
    mockDisableUser.mockReset();
    mockEnableUser.mockReset();
  });

  it("renders user emails and Active/Disabled status", async () => {
    mockListUsers.mockResolvedValue(mockUsers);
    renderPage();
    const table = await screen.findByRole("table");
    expect(await within(table).findByText("alice@example.com")).toBeInTheDocument();
    expect(within(table).getByText("bob@example.com")).toBeInTheDocument();
    expect(within(table).getByText("Active")).toBeInTheDocument();
    expect(within(table).getByText("Disabled")).toBeInTheDocument();
  });

  it("calls adminApi.disableUser when Disable clicked and invalidates query", async () => {
    mockListUsers.mockResolvedValue(mockUsers);
    mockDisableUser.mockResolvedValue({
      ...mockUsers.data[0],
      disabledAt: "2026-03-01T00:00:00.000Z",
    });
    const qc = makeQC();
    const invalidate = vi.spyOn(qc, "invalidateQueries");
    renderPage(qc);

    const table = await screen.findByRole("table");
    const disableBtn = await within(table).findByRole("button", { name: /disable/i });
    await userEvent.click(disableBtn);

    await waitFor(() => expect(mockDisableUser).toHaveBeenCalledWith("u1"));
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "users"] }));
  });

  it("shows empty state when no users", async () => {
    mockListUsers.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
    renderPage();
    expect(await screen.findByText(/no users found/i)).toBeInTheDocument();
  });
});

// NH-123 identity tests (admin-identity, tasks 1.1, 1.3, 1.5, 1.7). jsdom does not compute Tailwind,
// so shape is asserted through class tokens. Selector assumptions:
//  - table = the only <table>; table container = its parent; head row = "thead tr";
//  - card list = the only <ul>; card = each of its <li>;
//  - account tag = the single element whose own text is exactly the label inside one layout;
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

function cardOf(container: HTMLElement, email: string): HTMLElement {
  const card = cardsOf(container).find((li) => within(li).queryByText(email));
  return required(card, `card ${email}`);
}

const MIXED = {
  data: [
    {
      id: "u1",
      email: "alice@example.com",
      roles: ["guest", "host"],
      disabledAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "u2",
      email: "bob@example.com",
      roles: ["host"],
      disabledAt: "2026-02-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  total: 2,
  page: 1,
  limit: 50,
};

describe("AdminUsersPage identity: frame, tags and roles", () => {
  beforeEach(() => {
    mockListUsers.mockReset();
    mockDisableUser.mockReset();
    mockEnableUser.mockReset();
    mockListUsers.mockResolvedValue(MIXED);
  });

  it("has exactly one black heavy h1 and no ember surface", async () => {
    const { container } = renderPage();
    await loaded(container);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Users");
    expect(h1s[0]).toHaveClass("font-black", "text-fg");
    expect(container.innerHTML).not.toMatch(/ember/);
  });

  it("renders no pill and no Badge, in the DOM or the source", async () => {
    const { container } = renderPage();
    await loaded(container);
    expect(container.querySelector(".rounded-pill")).toBeNull();
    expect(adminUsersSource).not.toMatch(/\bBadge\b/);
    expect(adminUsersSource).not.toMatch(/userStatusTone/);
  });

  it("Active carries a solid ink edge and an empty aria-hidden marker, in both layouts", async () => {
    const { container } = renderPage();
    await loaded(container);
    for (const scope of [tableOf(container), listOf(container)]) {
      const active = within(scope).getByText("Active", { exact: true });
      expect(active.textContent).toBe("Active");
      expect(active).toHaveClass("border-2", "border-solid", "border-border", "rounded-sm");
      expect(active).not.toHaveClass("line-through");
      expect(active).not.toHaveClass("rounded-pill");
      const marker = required(active.querySelector('[aria-hidden="true"]'), "active marker");
      expect(marker.textContent).toBe("");
    }
  });

  it("Disabled is struck through with the solid muted edge and no marker, in both layouts", async () => {
    const { container } = renderPage();
    await loaded(container);
    for (const scope of [tableOf(container), listOf(container)]) {
      const disabled = within(scope).getByText("Disabled", { exact: true });
      expect(disabled.textContent).toBe("Disabled");
      expect(disabled).toHaveClass(
        "border-2",
        "border-solid",
        "border-border-muted",
        "line-through",
        "text-fg-muted",
      );
      expect(disabled).not.toHaveClass("rounded-pill");
      expect(disabled.querySelector('[aria-hidden="true"]')).toBeNull();
    }
  });

  it("roles are plain muted text, not a tag or badge", async () => {
    const { container } = renderPage();
    await loaded(container);
    const roles = within(tableOf(container)).getByText("guest, host");
    expect(roles).toHaveClass("text-fg-muted");
    expect(roles.className).not.toMatch(/border|rounded/);
    expect(roles.children).toHaveLength(0);
  });
});

describe("AdminUsersPage identity: layouts", () => {
  beforeEach(() => {
    mockListUsers.mockReset();
    mockDisableUser.mockReset();
    mockEnableUser.mockReset();
    mockListUsers.mockResolvedValue(MIXED);
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
    expect(headings.map((th) => th.textContent)).toEqual(["Email", "Roles", "Status", "Actions"]);
    for (const th of headings) expect(th).toHaveClass("font-bold", "text-fg");
  });

  it("GUARD: the table has one body row per user", async () => {
    const { container } = renderPage();
    await loaded(container);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
  });

  it("each card is a flat rounded-card with a 2px ink edge, no shadow or ring", async () => {
    const { container } = renderPage();
    await loaded(container);
    const cards = cardsOf(container);
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card).toHaveClass("rounded-card", "border-2", "border-border", "min-w-0");
      expect(Array.from(card.classList).some((c) => /^(shadow|ring)/.test(c))).toBe(false);
    }
  });

  it("a card holds the email, the tag, a dl with the Roles label and the action", async () => {
    const { container } = renderPage();
    await loaded(container);
    const alice = cardOf(container, "alice@example.com");
    expect(within(alice).getByText("alice@example.com")).toHaveClass("break-all", "font-bold");
    expect(within(alice).getByText("Active", { exact: true })).toBeInTheDocument();
    const dl = required(alice.querySelector("dl"), "card dl");
    expect(within(dl).getByText("Roles", { exact: true }).tagName).toBe("DT");
    expect(within(dl).getByText("guest, host").tagName).toBe("DD");
    expect(within(alice).getByRole("button", { name: "Disable" })).toBeInTheDocument();

    const bob = cardOf(container, "bob@example.com");
    expect(within(bob).getByText("Disabled", { exact: true })).toBeInTheDocument();
    expect(within(bob).getByRole("button", { name: "Re-enable" })).toBeInTheDocument();
  });

  it("a text query for each label matches exactly one element within one layout", async () => {
    const { container } = renderPage();
    await loaded(container);
    for (const scope of [tableOf(container), listOf(container)]) {
      expect(within(scope).getAllByText("Active")).toHaveLength(1);
      expect(within(scope).getAllByText("Disabled")).toHaveLength(1);
    }
  });
});

describe("AdminUsersPage identity: actions", () => {
  beforeEach(() => {
    mockListUsers.mockReset();
    mockDisableUser.mockReset();
    mockEnableUser.mockReset();
    mockListUsers.mockResolvedValue(MIXED);
  });

  it("Disable and Re-enable are real 44px buttons in both layouts", async () => {
    const { container } = renderPage();
    await loaded(container);
    for (const scope of [tableOf(container), listOf(container)]) {
      for (const name of ["Disable", "Re-enable"]) {
        const btn = within(scope).getByRole("button", { name });
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
      expect(enable).toHaveClass("border-2", "![box-shadow:none]");
      const disable = within(scope).getByRole("button", { name: "Disable" });
      expect(disable).not.toHaveClass("![box-shadow:none]");
    }
  });

  it("card actions are full width", async () => {
    const { container } = renderPage();
    await loaded(container);
    const list = listOf(container);
    for (const name of ["Disable", "Re-enable"]) {
      expect(within(list).getByRole("button", { name })).toHaveClass("w-full", "sm:w-auto");
    }
  });

  it("GUARD: Disable from a card fires disableUser with the id and invalidates the same key", async () => {
    mockDisableUser.mockResolvedValue({});
    const qc = makeQC();
    const invalidate = vi.spyOn(qc, "invalidateQueries");
    const { container } = renderPage(qc);
    await loaded(container);
    await userEvent.click(
      within(cardOf(container, "alice@example.com")).getByRole("button", { name: "Disable" }),
    );
    await waitFor(() => expect(mockDisableUser).toHaveBeenCalledWith("u1"));
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "users"] }));
    expect(mockEnableUser).not.toHaveBeenCalled();
  });

  it("GUARD: Re-enable fires enableUser with the id and invalidates the same key", async () => {
    mockEnableUser.mockResolvedValue({});
    const qc = makeQC();
    const invalidate = vi.spyOn(qc, "invalidateQueries");
    const { container } = renderPage(qc);
    await loaded(container);
    await userEvent.click(within(tableOf(container)).getByRole("button", { name: "Re-enable" }));
    await waitFor(() => expect(mockEnableUser).toHaveBeenCalledWith("u2"));
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "users"] }));
    expect(mockDisableUser).not.toHaveBeenCalled();
  });

  it("GUARD: the data flow is unchanged (one list call, no disabled while pending, same names)", async () => {
    mockDisableUser.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    await loaded(container);
    expect(mockListUsers).toHaveBeenCalledTimes(1);
    expect(mockListUsers).toHaveBeenCalledWith();

    const table = tableOf(container);
    const disable = within(table).getByRole("button", { name: "Disable" });
    await userEvent.click(disable);
    expect(mockDisableUser).toHaveBeenCalledWith("u1");
    expect(disable).not.toBeDisabled();

    const names = screen
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names.every((n) => n === "Disable" || n === "Re-enable")).toBe(true);
    for (const b of screen.getAllByRole("button")) expect(b).not.toHaveAttribute("aria-label");
  });
});

describe("AdminUsersPage identity: states", () => {
  beforeEach(() => {
    mockListUsers.mockReset();
  });

  it("empty: the existing text sits in a dashed 2px panel", async () => {
    mockListUsers.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
    renderPage();
    const text = await screen.findByText("No users found.");
    const panel = required(text.closest<HTMLElement>(".border-dashed"), "dashed empty panel");
    expect(panel).toHaveClass("border-2", "border-border");
  });

  it("error: one alert holding one h1 with the generic text, solid danger edge, tint and a filled tile", async () => {
    mockListUsers.mockRejectedValue(new Error("boom"));
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
    mockListUsers.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    const busy = required(container.querySelector('[aria-busy="true"]'), "aria-busy container");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    const classes = [busy, ...Array.from(busy.querySelectorAll("*"))].flatMap((el) =>
      Array.from(el.classList),
    );
    expect(classes.filter((c) => /^(rounded-(pill|md|lg|xl|full)|shadow.*)$/.test(c))).toEqual([]);
  });
});
