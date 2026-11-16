import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { t } from "@nomadhome/shared";
import { ErrorPage } from "./ErrorPage.js";

function Boom({ error }: { error: unknown }): never {
  throw error;
}

function renderWith(error: unknown) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <div>home</div> },
      { path: "/boom", element: <Boom error={error} />, errorElement: <ErrorPage /> },
    ],
    { initialEntries: ["/", "/boom"], initialIndex: 1 },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  sessionStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ErrorPage", () => {
  it("shows the error message", () => {
    renderWith(new Error("kaput"));
    expect(screen.getByRole("heading", { name: t("error.title") })).toBeInTheDocument();
    expect(screen.getByText("kaput")).toBeInTheDocument();
  });

  it("falls back to the generic message for non-Error values", () => {
    renderWith("nope");
    expect(screen.getByText(t("error.unexpected"))).toBeInTheDocument();
  });

  it("navigates home and back", async () => {
    const router = renderWith(new Error("x"));
    await userEvent.click(screen.getByRole("button", { name: t("error.go_back") }));
    expect(router.state.location.pathname).toBe("/");
  });

  it("navigates home with the home button", async () => {
    const router = renderWith(new Error("x"));
    await userEvent.click(screen.getByRole("button", { name: t("error.go_home") }));
    expect(router.state.location.pathname).toBe("/");
  });

  it("reloads on a stale chunk error", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    renderWith(new TypeError("Failed to fetch dynamically imported module: /x.js"));
    expect(reload).toHaveBeenCalled();
  });
});
