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
    mockBecomeHost.mockRejectedValue(new ApiError(403, { error: "EMAIL_NOT_VERIFIED" }));

    renderPage();
    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(/verify your email/i);
  });
});
