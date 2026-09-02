import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BecomeHostPage } from "./BecomeHostPage.js";
import { ApiError } from "../api/client.js";

// --- mocks ---

const mockBecomeHost = vi.fn();
vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({ becomeHost: (...args: unknown[]) => mockBecomeHost(...args) }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// --- helpers ---

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/become-host"]}>
      <Routes>
        <Route path="/become-host" element={<BecomeHostPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText(/display name/i), "Lucia");
  await userEvent.type(screen.getByLabelText(/payout email/i), "pay@example.com");
  await userEvent.click(screen.getByRole("checkbox"));
  await userEvent.click(screen.getByRole("button", { name: /become a host/i }));
}

// --- tests ---

describe("BecomeHostPage", () => {
  beforeEach(() => {
    mockBecomeHost.mockReset();
    mockNavigate.mockReset();
  });

  it("shows verification message when becomeHost throws ApiError 403 EMAIL_NOT_VERIFIED", async () => {
    mockBecomeHost.mockRejectedValue(
      new ApiError(403, {
        error: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before becoming a host.",
      }),
    );

    renderPage();
    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(/verify your email/i);
  });

  it("shows the server-provided message when already a host, instead of a canned string", async () => {
    mockBecomeHost.mockRejectedValue(
      new ApiError(409, {
        error: "ALREADY_HOST",
        message: "This account already has an active host profile.",
      }),
    );

    renderPage();
    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This account already has an active host profile.",
    );
  });

  it("shows the generic fallback message when the server sends no message field", async () => {
    mockBecomeHost.mockRejectedValue(new ApiError(500, {}));

    renderPage();
    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
  });
});
