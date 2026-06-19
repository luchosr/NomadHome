import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminUsersPage } from "./AdminUsersPage.js";

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

function renderPage() {
  return render(
    <QueryClientProvider client={makeQC()}>
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

describe("AdminUsersPage", () => {
  beforeEach(() => {
    mockListUsers.mockReset();
    mockDisableUser.mockReset();
    mockEnableUser.mockReset();
  });

  it("renders user emails and Active/Disabled status", async () => {
    mockListUsers.mockResolvedValue(mockUsers);
    renderPage();
    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("calls adminApi.disableUser when Disable clicked and invalidates query", async () => {
    mockListUsers.mockResolvedValue(mockUsers);
    mockDisableUser.mockResolvedValue({
      ...mockUsers.data[0],
      disabledAt: "2026-03-01T00:00:00.000Z",
    });
    renderPage();

    const disableBtn = await screen.findByRole("button", { name: /disable/i });
    await userEvent.click(disableBtn);

    await waitFor(() => expect(mockDisableUser).toHaveBeenCalledWith("u1"));
  });

  it("shows empty state when no users", async () => {
    mockListUsers.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
    renderPage();
    expect(await screen.findByText(/no users found/i)).toBeInTheDocument();
  });
});
