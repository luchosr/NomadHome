import { useState } from "react";
import { Link, Outlet, useNavigate, useNavigation } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { useAuth } from "../contexts/auth.js";
import { Logo } from "./Logo.js";

function HomeLogo() {
  return (
    <Link to="/" className="flex items-center text-fg-inverse no-underline">
      <Logo />
    </Link>
  );
}

const navLink = "text-sm font-bold text-fg-inverse underline-offset-4 no-underline hover:underline";
const signalButton =
  "rounded-sm border-2 border-signal bg-signal px-4 py-2 text-sm font-bold text-fg no-underline transition-colors hover:bg-fg-inverse hover:border-fg-inverse";
const outlineButton =
  "rounded-sm border-2 border-fg-inverse px-4 py-2 text-sm font-bold text-fg-inverse transition-colors hover:bg-fg-inverse hover:text-fg";

export function Layout() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/");
  };

  const close = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-surface">
      {navigation.state === "loading" && (
        <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-action" />
      )}
      <header className="sticky top-0 z-50 border-b-2 border-border bg-surface-inverse text-fg-inverse [--focus:var(--signal)]">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 md:px-12">
          <HomeLogo />

          {!isLoading && (
            <>
              {/* Desktop nav */}
              <div className="hidden items-center gap-6 md:flex">
                {user ? (
                  <>
                    <span className="text-sm font-bold text-signal">{user.email}</span>
                    {user.roles.includes("host") ? (
                      <Link to="/host/listings" className={navLink}>
                        {t("nav.host_dashboard")}
                      </Link>
                    ) : !user.roles.includes("admin") ? (
                      <Link to="/become-host" className={navLink}>
                        {t("nav.become_host")}
                      </Link>
                    ) : null}
                    {user.roles.includes("admin") && (
                      <>
                        <Link to="/admin/users" className={navLink}>
                          {t("nav.admin_users")}
                        </Link>
                        <Link to="/admin/listings" className={navLink}>
                          {t("nav.admin_listings")}
                        </Link>
                      </>
                    )}
                    <Link to="/bookings" className={navLink}>
                      {t("nav.my_bookings")}
                    </Link>
                    <button onClick={() => void handleLogout()} className={outlineButton}>
                      {t("nav.logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className={navLink}>
                      {t("nav.login")}
                    </Link>
                    <Link to="/register" className={signalButton}>
                      {t("nav.register")}
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile: logged-out links stay inline; logged-in gets hamburger */}
              <div className="flex items-center gap-3 md:hidden">
                {user ? (
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-label={t("nav.menu_toggle")}
                    className="rounded-sm border-2 border-fg-inverse p-2 text-fg-inverse hover:bg-fg-inverse hover:text-fg"
                  >
                    {menuOpen ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ) : (
                  <>
                    <Link to="/login" className={navLink}>
                      {t("nav.login")}
                    </Link>
                    <Link to="/register" className={signalButton}>
                      {t("nav.register")}
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile dropdown menu (logged-in only) */}
        {menuOpen && user && (
          <div className="border-t-2 border-fg-inverse px-4 py-4 md:hidden">
            <p className="mb-3 text-xs font-bold text-signal">{user.email}</p>
            <nav className="flex flex-col gap-1">
              {user.roles.includes("host") ? (
                <Link to="/host/listings" className={`${navLink} py-2`} onClick={close}>
                  {t("nav.host_dashboard")}
                </Link>
              ) : !user.roles.includes("admin") ? (
                <Link to="/become-host" className={`${navLink} py-2`} onClick={close}>
                  {t("nav.become_host")}
                </Link>
              ) : null}
              {user.roles.includes("admin") && (
                <>
                  <Link to="/admin/users" className={`${navLink} py-2`} onClick={close}>
                    {t("nav.admin_users")}
                  </Link>
                  <Link to="/admin/listings" className={`${navLink} py-2`} onClick={close}>
                    {t("nav.admin_listings")}
                  </Link>
                </>
              )}
              <Link to="/bookings" className={`${navLink} py-2`} onClick={close}>
                {t("nav.my_bookings")}
              </Link>
              <button
                onClick={() => void handleLogout()}
                className={`${outlineButton} mt-2 w-full`}
              >
                {t("nav.logout")}
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}
