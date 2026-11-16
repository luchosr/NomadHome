import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@nomadhome/shared";
import { Layout } from "./Layout.js";

vi.mock("../contexts/auth.js", () => ({ useAuth: vi.fn() }));
import { useAuth } from "../contexts/auth.js";
const mockUseAuth = vi.mocked(useAuth);

const logout = vi.fn().mockResolvedValue(undefined);

function renderLayout(user: { email: string; roles: string[] } | null, isLoading = false) {
  mockUseAuth.mockReturnValue({ user, isLoading, logout } as unknown as ReturnType<typeof useAuth>);
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <div>home outlet</div> },
          { path: "bookings", element: <div>bookings outlet</div> },
        ],
      },
    ],
    { initialEntries: ["/bookings"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const href = (name: string) => screen.getAllByRole("link", { name })[0]!.getAttribute("href");

beforeEach(() => logout.mockClear());

describe("Layout", () => {
  it("renders the routed outlet and a home logo link", () => {
    renderLayout(null);
    expect(screen.getByText("bookings outlet")).toBeInTheDocument();
    expect(href(t("common.app.name"))).toBe("/");
  });

  it("shows login and register for guests, no account links", () => {
    renderLayout(null);
    expect(href(t("nav.login"))).toBe("/login");
    expect(href(t("nav.register"))).toBe("/register");
    expect(screen.queryByRole("link", { name: t("nav.my_bookings") })).toBeNull();
    expect(screen.queryByRole("button", { name: t("nav.logout") })).toBeNull();
  });

  it("renders no nav while auth is loading", () => {
    renderLayout(null, true);
    expect(screen.queryByRole("link", { name: t("nav.login") })).toBeNull();
  });

  it("shows become-host and bookings for a plain guest user", () => {
    renderLayout({ email: "g@x.com", roles: ["guest"] });
    expect(screen.getAllByText("g@x.com").length).toBeGreaterThan(0);
    expect(href(t("nav.become_host"))).toBe("/become-host");
    expect(href(t("nav.my_bookings"))).toBe("/bookings");
    expect(screen.queryByRole("link", { name: t("nav.host_dashboard") })).toBeNull();
  });

  it("shows the host dashboard instead of become-host for hosts", () => {
    renderLayout({ email: "h@x.com", roles: ["guest", "host"] });
    expect(href(t("nav.host_dashboard"))).toBe("/host/listings");
    expect(screen.queryByRole("link", { name: t("nav.become_host") })).toBeNull();
  });

  it("shows admin links and no become-host for admins", () => {
    renderLayout({ email: "a@x.com", roles: ["admin"] });
    expect(href(t("nav.admin_users"))).toBe("/admin/users");
    expect(href(t("nav.admin_listings"))).toBe("/admin/listings");
    expect(screen.queryByRole("link", { name: t("nav.become_host") })).toBeNull();
  });

  it("logs out and returns home from the desktop button", async () => {
    const router = renderLayout({ email: "g@x.com", roles: ["guest"] });
    await userEvent.click(screen.getAllByRole("button", { name: t("nav.logout") })[0]!);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(router.state.location.pathname).toBe("/");
  });

  it("toggles the mobile menu and closes it on link click", async () => {
    renderLayout({ email: "h@x.com", roles: ["admin"] });
    const toggle = screen.getByRole("button", { name: t("nav.menu_toggle") });
    const before = screen.getAllByRole("link", { name: t("nav.my_bookings") }).length;
    await userEvent.click(toggle);
    const links = screen.getAllByRole("link", { name: t("nav.my_bookings") });
    expect(links.length).toBe(before + 1);
    await userEvent.click(links[links.length - 1]!);
    expect(screen.getAllByRole("link", { name: t("nav.my_bookings") }).length).toBe(before);
  });

  it("shows host mobile link and logs out from the mobile menu", async () => {
    const router = renderLayout({ email: "h@x.com", roles: ["host"] });
    await userEvent.click(screen.getByRole("button", { name: t("nav.menu_toggle") }));
    expect(screen.getAllByRole("link", { name: t("nav.host_dashboard") })).toHaveLength(2);
    const buttons = screen.getAllByRole("button", { name: t("nav.logout") });
    await userEvent.click(buttons[buttons.length - 1]!);
    expect(logout).toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/");
    expect(screen.getAllByRole("link", { name: t("nav.host_dashboard") })).toHaveLength(1);
  });

  it("shows become-host in the mobile menu for guests and admin links for admins", async () => {
    renderLayout({ email: "g@x.com", roles: ["guest"] });
    await userEvent.click(screen.getByRole("button", { name: t("nav.menu_toggle") }));
    expect(screen.getAllByRole("link", { name: t("nav.become_host") })).toHaveLength(2);
  });
});
