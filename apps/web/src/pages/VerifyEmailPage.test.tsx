import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@nomadhome/shared";
import { VerifyEmailPage } from "./VerifyEmailPage.js";

vi.mock("../api/auth.js", () => ({ authApi: { verifyEmail: vi.fn() } }));
import { authApi } from "../api/auth.js";
const verifyEmail = vi.mocked(authApi.verifyEmail);

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <VerifyEmailPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  verifyEmail.mockReset();
});

describe("VerifyEmailPage", () => {
  it("shows pending while verifying", () => {
    verifyEmail.mockReturnValue(new Promise(() => {}));
    renderAt("/verify-email?token=abc");
    expect(screen.getByText(t("identity.verify_email.pending"))).toBeInTheDocument();
    expect(verifyEmail).toHaveBeenCalledWith("abc");
  });

  it("shows success with a login link", async () => {
    verifyEmail.mockResolvedValue(undefined as never);
    renderAt("/verify-email?token=abc");
    expect(
      await screen.findByRole("heading", { name: t("identity.verify_email.success_title") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: t("identity.verify_email.success_cta") }),
    ).toHaveAttribute("href", "/login");
  });

  it("shows the error state with a register link when the API rejects", async () => {
    verifyEmail.mockRejectedValue(new Error("bad"));
    renderAt("/verify-email?token=abc");
    expect(
      await screen.findByRole("heading", { name: t("identity.verify_email.error_title") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: t("identity.verify_email.error_cta") }),
    ).toHaveAttribute("href", "/register");
  });

  it("errors without calling the API when the token is missing", async () => {
    renderAt("/verify-email");
    expect(
      await screen.findByRole("heading", { name: t("identity.verify_email.error_title") }),
    ).toBeInTheDocument();
    expect(verifyEmail).not.toHaveBeenCalled();
  });
});

function panel(container: HTMLElement, state: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(`[data-state="${state}"]`);
  if (!el) throw new Error(`no panel with data-state="${state}"`);
  return el;
}

function tileOf(el: HTMLElement): HTMLElement {
  const tile = el.querySelector<HTMLElement>('[aria-hidden="true"]');
  if (!tile) throw new Error("no decorative tile in panel");
  return tile;
}

function renderWithContainer(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <VerifyEmailPage />
    </MemoryRouter>,
  );
}

describe("VerifyEmailPage identity states", () => {
  it("pending: one h1 with the pending text, busy status, dashed panel and tile", () => {
    verifyEmail.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithContainer("/verify-email?token=abc");

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: t("identity.verify_email.pending") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");

    const el = panel(container, "pending");
    expect(el).toHaveClass("border-2", "border-dashed", "border-border", "bg-surface-inset");
    expect(tileOf(el)).toHaveClass("border-dashed");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("success: one h1, ember solid panel, filled tile, ink primary link to /login", async () => {
    verifyEmail.mockResolvedValue(undefined as never);
    const { container } = renderWithContainer("/verify-email?token=abc");

    await screen.findByRole("heading", {
      level: 1,
      name: t("identity.verify_email.success_title"),
    });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText(t("identity.verify_email.success_body"))).toBeVisible();

    const el = panel(container, "success");
    expect(el).toHaveClass("border-2", "border-solid", "border-border", "bg-ember");
    expect(tileOf(el)).not.toHaveClass("border-dashed");
    expect(tileOf(el)).toHaveClass("bg-fg");

    const link = screen.getByRole("link", { name: t("identity.verify_email.success_cta") });
    expect(link).toHaveAttribute("href", "/login");
    expect(link).toHaveClass("border-2", "border-border", "bg-action", "text-action-fg");
    expect(container.querySelector('[role="status"], [aria-live="polite"]')).not.toBeNull();
  });

  it("error: one h1, alert paper panel, outlined danger tile, ink primary link to /register", async () => {
    verifyEmail.mockRejectedValue(new Error("bad"));
    const { container } = renderWithContainer("/verify-email?token=abc");

    await screen.findByRole("heading", { level: 1, name: t("identity.verify_email.error_title") });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText(t("identity.verify_email.error_body"))).toBeVisible();

    const el = panel(container, "error");
    expect(el).toHaveAttribute("role", "alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(el).toHaveClass("border-2", "border-solid", "border-border", "bg-surface-raised");
    expect(el).not.toHaveClass("bg-ember");
    expect(tileOf(el)).toHaveClass(
      "border-2",
      "border-solid",
      "border-danger",
      "bg-surface-raised",
    );

    const link = screen.getByRole("link", { name: t("identity.verify_email.error_cta") });
    expect(link).toHaveAttribute("href", "/register");
    expect(link).toHaveClass("border-2", "border-border", "bg-action", "text-action-fg");
  });

  it("missing token: shows the error state with one h1 and never calls the API", async () => {
    const { container } = renderWithContainer("/verify-email");

    await screen.findByRole("heading", { level: 1, name: t("identity.verify_email.error_title") });
    expect(panel(container, "error")).toHaveAttribute("role", "alert");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  it("requests the verification once per token", async () => {
    verifyEmail.mockResolvedValue(undefined as never);
    const { rerender } = renderWithContainer("/verify-email?token=abc");
    await screen.findByRole("heading", {
      level: 1,
      name: t("identity.verify_email.success_title"),
    });
    rerender(
      <MemoryRouter initialEntries={["/verify-email?token=abc"]}>
        <VerifyEmailPage />
      </MemoryRouter>,
    );
    expect(verifyEmail).toHaveBeenCalledTimes(1);
    expect(verifyEmail).toHaveBeenCalledWith("abc");
  });
});
