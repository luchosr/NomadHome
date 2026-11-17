import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AuthShell } from "./AuthShell.js";

function renderShell(props: { subtitle?: string; footer?: boolean } = {}) {
  return render(
    <AuthShell
      title="Welcome back"
      titleId="auth-title"
      subtitle={props.subtitle}
      footer={props.footer ? <a href="/register">Sign up</a> : undefined}
    >
      <p>panel body</p>
    </AuthShell>,
  );
}

describe("AuthShell", () => {
  it("renders the title as the single h1 carrying the given id", () => {
    renderShell();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Welcome back");
    expect(headings[0]).toHaveAttribute("id", "auth-title");
  });

  it("renders the subtitle only when one is passed", () => {
    const { unmount } = renderShell({ subtitle: "Sign in to continue" });
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    unmount();
    renderShell();
    expect(screen.queryByText("Sign in to continue")).not.toBeInTheDocument();
  });

  it("puts the title on an ember band with ink text and a 2px ink bottom rule", () => {
    renderShell({ subtitle: "Sign in to continue" });
    const band = screen.getByRole("heading", { level: 1 }).closest(".bg-ember");
    expect(band).not.toBeNull();
    expect(band).toHaveClass("text-fg", "border-b-2", "border-border");
    expect(band).toContainElement(screen.getByText("Sign in to continue"));
  });

  it("wraps the children in a paper panel with a 2px ink edge", () => {
    renderShell();
    const panel = screen.getByText("panel body").closest(".bg-surface-raised");
    expect(panel).not.toBeNull();
    expect(panel).toHaveClass("border-2", "border-border");
  });

  it("renders the footer slot in a stone row with a 2px ink top rule", () => {
    renderShell({ footer: true });
    const row = screen.getByRole("link", { name: "Sign up" }).closest(".bg-surface-inset");
    expect(row).not.toBeNull();
    expect(row).toHaveClass("border-t-2", "border-border");
  });

  it("does not render a main landmark (Layout owns it)", () => {
    renderShell({ footer: true });
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });
});
