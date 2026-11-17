import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { en } from "@nomadhome/shared";
import { LoginPage } from "./LoginPage.js";
import { RegisterPage } from "./RegisterPage.js";
import { VerifyEmailPage } from "./VerifyEmailPage.js";

vi.mock("../contexts/auth.js", () => ({
  useAuth: () => ({
    login: vi.fn(),
    register: vi.fn(),
    user: null,
    isLoading: false,
    logout: vi.fn(),
  }),
}));
vi.mock("../api/auth.js", () => ({ authApi: { verifyEmail: vi.fn(() => new Promise(() => {})) } }));

const FORBIDDEN_CONTENT =
  /show password|hide password|forgot|reset password|recover|google|apple|facebook|github|continue with|remember me/i;

const PAGES = [
  { name: "LoginPage", url: "/login", element: <LoginPage /> },
  { name: "RegisterPage", url: "/register", element: <RegisterPage /> },
  { name: "VerifyEmailPage", url: "/verify-email?token=abc", element: <VerifyEmailPage /> },
];

describe("auth screens carry no deferred or invented content", () => {
  it.each(PAGES)("$name renders no toggle, recovery link or alternative provider", (page) => {
    const { container } = render(
      <MemoryRouter initialEntries={[page.url]}>{page.element}</MemoryRouter>,
    );
    expect(container.textContent ?? "").not.toMatch(FORBIDDEN_CONTENT);
    expect(screen.queryByRole("button", { name: /show|hide|toggle/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: FORBIDDEN_CONTENT })).not.toBeInTheDocument();
  });
});

describe("auth dictionary is unchanged from the NH-125 baseline", () => {
  it("keeps the auth group keys and values", () => {
    expect(en.auth).toEqual({
      login: {
        title: "Welcome back",
        subtitle: "Sign in to your NomadHome account",
        email_label: "Email",
        password_label: "Password",
        submit: "Log in",
        no_account: "Don't have an account?",
        sign_up_link: "Sign up",
        error: "Invalid email or password.",
      },
      register: {
        title: "Create your account",
        subtitle: "Start finding co-living spaces and workspaces",
        email_label: "Email",
        password_label: "Password",
        confirm_password_label: "Confirm password",
        passwords_mismatch: "Passwords do not match.",
        submit: "Create account",
        have_account: "Already have an account?",
        login_link: "Log in",
        error: "Registration failed. Please try again.",
      },
      forbidden: {
        title: "Access denied",
        message: "You don't have permission to view this page.",
      },
    });
  });

  it("keeps the identity.verify_email group keys and values", () => {
    expect(en.identity.verify_email).toEqual({
      pending: "Verifying your email…",
      success_title: "Email verified!",
      success_body: "Your account is confirmed. You can now log in.",
      success_cta: "Log in",
      error_title: "Link invalid or expired",
      error_body:
        "This verification link has already been used or has expired. Please register again.",
      error_cta: "Register",
    });
  });
});
