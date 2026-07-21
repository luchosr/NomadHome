import { useState } from "react";
import { Link, Outlet, useNavigate, useNavigation } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { useAuth } from "../contexts/auth.js";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 no-underline">
      <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#2E4A3F" />
        <path
          d="M18 44 V32 a14 14 0 0 1 28 0 V44"
          stroke="#F5F0E8"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <line
          x1="12"
          y1="48"
          x2="52"
          y2="48"
          stroke="#D97757"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-serif text-[26px] leading-none text-ink-900">NomadHome</span>
    </Link>
  );
}

const navLink =
  "text-sm font-medium text-ink-700 transition-colors hover:text-forest-700 no-underline";

export function Layout() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const close = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-sand-100">
      {navigation.state === "loading" && (
        <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-forest-700" />
      )}
      <header
        className="sticky top-0 z-50 border-b border-sand-300"
        style={{
          background: "rgba(245, 240, 232, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div
          className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-0 md:px-12"
          style={{ height: "72px" }}
        >
          <Logo />

          {!isLoading && (
            <>
              {/* Desktop nav */}
              <div className="hidden items-center gap-6 md:flex">
                {user ? (
                  <>
                    <span className="text-sm font-medium text-forest-700">{user.email}</span>
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
                    <button
                      onClick={() => void handleLogout()}
                      className="rounded-xl border border-forest-700 px-4 py-2 text-sm font-medium text-forest-700 transition-colors hover:bg-sand-200"
                    >
                      {t("nav.logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className={navLink}>
                      {t("nav.login")}
                    </Link>
                    <Link
                      to="/register"
                      className="rounded-xl bg-forest-700 px-4 py-2 text-sm font-medium text-sand-50 transition-colors hover:bg-forest-900 no-underline"
                    >
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
                    aria-label="Toggle menu"
                    className="rounded-lg p-2 text-ink-700 hover:bg-sand-200"
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
                    <Link
                      to="/register"
                      className="rounded-xl bg-forest-700 px-4 py-2 text-sm font-medium text-sand-50 transition-colors hover:bg-forest-900 no-underline"
                    >
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
          <div className="border-t border-sand-300 px-6 py-4 md:hidden">
            <p className="mb-3 text-xs font-medium text-forest-700">{user.email}</p>
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
                className="mt-2 w-full rounded-xl border border-forest-700 px-4 py-2 text-sm font-medium text-forest-700 transition-colors hover:bg-sand-200"
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
