import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
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
