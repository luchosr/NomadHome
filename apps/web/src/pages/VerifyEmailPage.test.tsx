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
