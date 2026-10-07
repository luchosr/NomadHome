import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginPage } from "./LoginPage.js";
import type { AuthUser } from "../api/auth.js";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();
let mockUser: AuthUser | null = null;

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    login: mockLogin,
    user: mockUser,
    isLoading: false,
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return { ...mod, useNavigate: () => mockNavigate };
});

function renderLogin(
  initialEntries: Parameters<typeof MemoryRouter>[0]["initialEntries"] = ["/login"],
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function submitLoginForm() {
  await userEvent.type(screen.getByLabelText(/email/i), "user@test.com");
  await userEvent.type(screen.getByLabelText(/password/i), "password123");
  await userEvent.click(screen.getByRole("button", { name: /log in/i }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
    mockUser = null;
  });

  it("renders email and password fields and submit button", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("shows validation errors without submitting when fields are empty", async () => {
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows the generic fallback message when the server sends no message field", async () => {
    const { ApiError } = await import("../api/client.js");
    mockLogin.mockRejectedValue(new ApiError(401, {}));
    renderLogin();

    await submitLoginForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
  });

  it("shows the server-provided message on login failure instead of a canned string", async () => {
    const { ApiError } = await import("../api/client.js");
    mockLogin.mockRejectedValue(
      new ApiError(401, {
        error: "INVALID_CREDENTIALS",
        message: "That email/password combination is not recognized.",
      }),
    );
    renderLogin();

    await submitLoginForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That email/password combination is not recognized.",
    );
  });

  it("redirects an admin with no explicit `from` to the admin landing page", async () => {
    mockLogin.mockImplementation(async () => {
      mockUser = { id: "1", email: "admin@test.com", roles: ["admin"] };
    });
    renderLogin();

    await submitLoginForm();

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/admin/users", {
        replace: true,
      }),
    );
  });

  it("redirects a host-only user with no explicit `from` to the host dashboard", async () => {
    mockLogin.mockImplementation(async () => {
      mockUser = { id: "2", email: "host@test.com", roles: ["host"] };
    });
    renderLogin();

    await submitLoginForm();

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/host/listings", {
        replace: true,
      }),
    );
  });

  it("redirects a guest with no explicit `from` to home", async () => {
    mockLogin.mockImplementation(async () => {
      mockUser = { id: "3", email: "guest@test.com", roles: ["guest"] };
    });
    renderLogin();

    await submitLoginForm();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true }));
  });

  it("honors an explicit `from` redirect target regardless of role", async () => {
    mockLogin.mockImplementation(async () => {
      mockUser = { id: "1", email: "admin@test.com", roles: ["admin"] };
    });
    renderLogin([
      {
        pathname: "/login",
        state: { from: { pathname: "/bookings" } },
      },
    ]);

    await submitLoginForm();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/bookings", { replace: true }));
  });
});
