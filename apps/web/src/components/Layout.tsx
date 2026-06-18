import { Link, Outlet, useNavigate } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button } from "@nomadhome/ui";
import { useAuth } from "../contexts/auth.js";

export function Layout() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-slate-900">
            {t("common.app.name")}
          </Link>

          {!isLoading && (
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-slate-600">{user.email}</span>
                  {user.roles.includes("host") && (
                    <Link to="/host" className="text-sm text-slate-700 hover:text-slate-900">
                      {t("nav.host_dashboard")}
                    </Link>
                  )}
                  {user.roles.includes("admin") && (
                    <Link to="/admin" className="text-sm text-slate-700 hover:text-slate-900">
                      {t("nav.admin")}
                    </Link>
                  )}
                  <Link to="/bookings" className="text-sm text-slate-700 hover:text-slate-900">
                    {t("nav.my_bookings")}
                  </Link>
                  <Button variant="secondary" onClick={() => void handleLogout()}>
                    {t("nav.logout")}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-slate-700 hover:text-slate-900">
                    {t("nav.login")}
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-forest-900"
                  >
                    {t("nav.register")}
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
