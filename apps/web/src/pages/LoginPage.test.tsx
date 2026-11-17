import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@nomadhome/shared";
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

describe("LoginPage identity structure", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
    mockUser = null;
  });

  it("renders the title as an h1 that names the form", () => {
    renderLogin();
    expect(
      screen.getByRole("heading", { level: 1, name: t("auth.login.title") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("form", { name: t("auth.login.title") })).toBeInTheDocument();
  });

  it("links the field error to the email input and does not make it an alert", async () => {
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    const email = screen.getByLabelText(/email/i);
    await screen.findByText(/valid email/i);
    expect(email).toHaveAttribute("aria-invalid", "true");
    const describedBy = email.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const message = document.getElementById(describedBy ?? "");
    expect(message).toHaveTextContent(/valid email/i);
    expect(message).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("drops the description link once the email error clears", async () => {
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    const email = screen.getByLabelText(/email/i);
    await screen.findByText(/valid email/i);

    await userEvent.type(email, "user@test.com");

    await waitFor(() => expect(email).not.toHaveAttribute("aria-describedby"));
    expect(email).not.toHaveAttribute("aria-invalid", "true");
  });

  it("has no description link before any error", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).not.toHaveAttribute("aria-describedby");
    expect(screen.getByLabelText(/password/i)).not.toHaveAttribute("aria-describedby");
  });

  it("keeps the route link to /register, underlined", () => {
    renderLogin();
    const link = screen.getByRole("link", { name: t("auth.login.sign_up_link") });
    expect(link).toHaveAttribute("href", "/register");
    expect(link).toHaveClass("underline");
  });

  it("keeps the autocomplete values", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("autocomplete", "current-password");
  });

  it("shows a rejected login as exactly one alert with the same text", async () => {
    const { ApiError } = await import("../api/client.js");
    mockLogin.mockRejectedValue(new ApiError(401, { message: "Invalid email or password." }));
    renderLogin();

    await submitLoginForm();

    await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password.");
  });
});
