import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@nomadhome/shared";
import { BecomeHostPage } from "./BecomeHostPage.js";
import { errorIdFor } from "../components/FormField.js";
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

// NH-122 identity tests (host-identity, task 1.9). jsdom does not compute Tailwind, so shape is
// asserted through class tokens. Selector assumptions:
//  - terms row = the checkbox's parent element; glyph = an [aria-hidden="true"] svg in that row;
//  - terms error = the element holding the existing terms-required text (no role is added);
//  - server error = the single role="alert" element (ServerErrorAlert, unchanged).
// Tests marked GUARD pass before the restyle and must keep passing.

const TERMS_ERROR = "You must accept the host terms to continue.";

function required<T extends Element>(el: T | null, what: string): T {
  if (!el) throw new Error(`missing structure: ${what}`);
  return el;
}

describe("BecomeHostPage identity", () => {
  beforeEach(() => {
    mockBecomeHost.mockReset();
    mockNavigate.mockReset();
  });

  it("has exactly one black left-aligned h1 and no ember surface", () => {
    const { container } = renderPage();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Become a host");
    expect(h1s[0]).toHaveClass("font-black", "text-fg");
    expect(h1s[0]?.parentElement).not.toHaveClass("text-center");
    expect(container.innerHTML).not.toMatch(/ember/);
  });

  it("GUARD: the terms control is a checkbox named by its label", () => {
    renderPage();
    expect(
      screen.getByRole("checkbox", { name: "I accept the host terms and conditions" }),
    ).not.toBeChecked();
  });

  it("the terms checkbox is the square 2px ink box with an aria-hidden glyph", () => {
    renderPage();
    const box = screen.getByRole("checkbox");
    expect(box).toHaveClass("h-5", "w-5", "border-2", "border-border", "rounded-none");
    expect(box).toHaveClass("appearance-none", "checked:bg-ink");
    const row = required(box.parentElement, "terms row");
    required(row.querySelector('svg[aria-hidden="true"]'), "check glyph");
  });

  it("the terms row is a 44px target", () => {
    renderPage();
    const row = required(screen.getByRole("checkbox").parentElement, "terms row");
    expect(row).toHaveClass("min-h-11");
  });

  it("submitting without accepting shows the terms error with the danger bar, no role and no request", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/display name/i), "Lucia");
    await userEvent.type(screen.getByLabelText(/payout email/i), "pay@example.com");
    await userEvent.click(screen.getByRole("button", { name: /become a host/i }));

    const error = await screen.findByText(TERMS_ERROR);
    expect(error).toHaveClass("border-l-4", "border-danger", "font-bold", "text-danger");
    expect(error).not.toHaveAttribute("role");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(mockBecomeHost).not.toHaveBeenCalled();
  });

  it("GUARD: the submit button stays full width and unchanged", () => {
    renderPage();
    const submit = screen.getByRole("button", { name: /become a host/i });
    expect(submit).toHaveClass("w-full");
    expect(submit).toBeEnabled();
  });

  it("a server error still renders exactly one shared alert", async () => {
    mockBecomeHost.mockRejectedValue(new ApiError(500, {}));
    renderPage();
    await fillAndSubmit();
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveClass("border-2", "border-danger", "bg-danger-bg");
  });
});

// NH-146 (platform: Become host field errors are linked to their controls).

describe("BecomeHostPage field error links", () => {
  beforeEach(() => {
    mockBecomeHost.mockReset();
    mockNavigate.mockReset();
  });

  const displayName = () => screen.getByLabelText(/display name/i);
  const payoutEmail = () => screen.getByLabelText(/payout email/i);
  const terms = () => screen.getByRole("checkbox");
  const submit = () => userEvent.click(screen.getByRole("button", { name: /become a host/i }));

  function expectLinked(control: HTMLElement, field: string, error: HTMLElement) {
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(error).toHaveAttribute("id", errorIdFor(field));
    expect(control).toHaveAttribute("aria-describedby", error.id);
    expect(error).not.toHaveAttribute("role");
  }

  function expectUnlinked(control: HTMLElement) {
    expect(control).not.toHaveAttribute("aria-describedby");
    expect(control).not.toHaveAttribute("aria-invalid", "true");
  }

  it("links the display name error to its input", async () => {
    renderPage();
    await submit();
    const error = await screen.findByText(t("validation.required.field"));
    expectLinked(displayName(), "displayName", error);
    expect(mockBecomeHost).not.toHaveBeenCalled();
  });

  // The email stays empty: a malformed value is stopped by native type="email" validation.
  it("links the payout email error to its input", async () => {
    renderPage();
    await submit();
    const error = await screen.findByText(t("validation.email.invalid"));
    expectLinked(payoutEmail(), "payoutEmail", error);
    expect(mockBecomeHost).not.toHaveBeenCalled();
  });

  it("links the terms error to the checkbox", async () => {
    renderPage();
    await userEvent.type(displayName(), "Lucia");
    await userEvent.type(payoutEmail(), "pay@example.com");
    await submit();
    const error = await screen.findByText(TERMS_ERROR);
    expectLinked(terms(), "acceptedTerms", error);
    expect(mockBecomeHost).not.toHaveBeenCalled();
  });

  it("GUARD: no control is linked or invalid before submit", () => {
    renderPage();
    for (const control of [displayName(), payoutEmail(), terms()]) expectUnlinked(control);
  });

  it("removes each link when its error clears", async () => {
    renderPage();
    await submit();
    await screen.findByText(TERMS_ERROR);
    for (const control of [displayName(), payoutEmail(), terms()]) {
      expect(control).toHaveAttribute("aria-describedby");
    }

    await userEvent.type(displayName(), "Lucia");
    await waitFor(() => expectUnlinked(displayName()));
    await userEvent.type(payoutEmail(), "pay@example.com");
    await waitFor(() => expectUnlinked(payoutEmail()));
    await userEvent.click(terms());
    await waitFor(() => expectUnlinked(terms()));
  });
});
