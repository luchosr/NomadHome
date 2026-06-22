import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute.js";

vi.mock("../contexts/auth.js", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../contexts/auth.js";
const mockUseAuth = vi.mocked(useAuth);

function renderProtected(userValue: { user: unknown; isLoading: boolean }) {
  mockUseAuth.mockReturnValue({
    ...userValue,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    becomeHost: vi.fn(),
  } as ReturnType<typeof useAuth>);

  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("renders children when user is authenticated", () => {
    renderProtected({ user: { id: "1", email: "a@b.com", roles: ["guest"] }, isLoading: false });
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects to /login when user is null", () => {
    renderProtected({ user: null, isLoading: false });
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders nothing while loading", () => {
    renderProtected({ user: null, isLoading: true });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});
