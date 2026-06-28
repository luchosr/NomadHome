import { Link, Outlet, useNavigate } from "react-router-dom";
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-sand-100">
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
            <div className="flex items-center gap-6">
              {user ? (
                <>
                  <span className="hidden text-sm font-medium text-forest-700 sm:block">
                    {user.email}
                  </span>
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
                    <Link to="/admin/users" className={navLink}>
                      {t("nav.admin")}
                    </Link>
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
          )}
        </div>
      </header>

      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}
