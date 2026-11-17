import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@nomadhome/shared";
import { RegisterPage } from "./RegisterPage.js";

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    register: mockRegister,
    login: vi.fn(),
    user: null,
    isLoading: false,
    logout: vi.fn(),
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return { ...mod, useNavigate: () => mockNavigate };
});

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
  });

  it("renders email, password fields and submit button", () => {
    renderRegister();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows password validation error for short password", async () => {
    renderRegister();
    await userEvent.type(screen.getByLabelText(/email/i), "user@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "short");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/at least 10/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("calls register and navigates on valid input", async () => {
    mockRegister.mockResolvedValue(undefined);
    renderRegister();

    await userEvent.type(screen.getByLabelText(/email/i), "newuser@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "validpass123");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "validpass123");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith("newuser@test.com", "validpass123"),
    );
    expect(mockNavigate).toHaveBeenCalled();
  });
});

describe("RegisterPage identity structure", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
  });

  it("renders the title as an h1 that names the form", () => {
    renderRegister();
    expect(
      screen.getByRole("heading", { level: 1, name: t("auth.register.title") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("form", { name: t("auth.register.title") })).toBeInTheDocument();
  });

  it("keeps the autocomplete values", () => {
    renderRegister();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });

  it("links the mismatch message to the confirm password input", async () => {
    renderRegister();
    await userEvent.type(screen.getByLabelText(/email/i), "user@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "validpass123");
    const confirm = screen.getByLabelText(/confirm password/i);
    await userEvent.type(confirm, "different123");
    await userEvent.tab();

    await screen.findByText(t("auth.register.passwords_mismatch"));
    expect(confirm).toHaveAttribute("aria-invalid", "true");
    const describedBy = confirm.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")).toHaveTextContent(
      t("auth.register.passwords_mismatch"),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the submit disabled until the form is valid", async () => {
    renderRegister();
    const submit = screen.getByRole("button", { name: /create account/i });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/email/i), "user@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "validpass123");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "validpass123");

    await waitFor(() => expect(submit).toBeEnabled());
  });

  it("keeps the route link to /login, underlined", () => {
    renderRegister();
    const link = screen.getByRole("link", { name: t("auth.register.login_link") });
    expect(link).toHaveAttribute("href", "/login");
    expect(link).toHaveClass("underline");
  });

  it("sends the unchanged payload: email and password only", async () => {
    mockRegister.mockResolvedValue(undefined);
    renderRegister();
    await userEvent.type(screen.getByLabelText(/email/i), "newuser@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "validpass123");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "validpass123");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister.mock.calls[0]).toEqual(["newuser@test.com", "validpass123"]);
  });
});
