import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-800">{t("error.not_found.title")}</h1>
      <Link to="/" className="text-sm text-slate-500 hover:underline">
        {t("error.not_found.home")}
      </Link>
    </div>
  );
}
