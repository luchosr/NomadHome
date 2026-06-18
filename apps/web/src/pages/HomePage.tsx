import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { useAuth } from "../contexts/auth.js";

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <h1 className="text-4xl font-bold text-slate-900">{t("common.app.name")}</h1>
      <p className="mt-3 text-lg text-slate-500">{t("common.app.tagline")}</p>
      {!user && (
        <div className="mt-8 flex gap-3">
          <Link
            to="/register"
            className="rounded-md bg-forest-700 px-5 py-3 text-sm font-medium text-sand-50 hover:bg-forest-900"
          >
            {t("nav.register")}
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-forest-700 px-5 py-3 text-sm font-medium text-forest-700 hover:bg-sand-200"
          >
            {t("nav.login")}
          </Link>
        </div>
      )}
    </div>
  );
}
