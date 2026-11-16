import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Arrow } from "@nomadhome/ui";
import { useAuth } from "../../contexts/auth.js";
import { WRAP, FIELD } from "./constants.js";

export function CtaBandSection() {
  const { user } = useAuth();

  return (
    <section className={`${FIELD} bg-ember`}>
      <div className={WRAP}>
        <h2 className="m-0 max-w-[16ch] text-5xl font-black leading-solid">
          {t("home.cta.headline_pre")} {t("home.cta.headline_em")}.
        </h2>
        <p className="mt-6 max-w-[52ch] text-lg font-medium leading-relaxed">
          {t("home.cta.body")}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/search"
            className="inline-flex items-center gap-4 border-2 border-border bg-action px-8 py-5 text-2xl font-black text-action-fg no-underline transition-colors hover:bg-action-hover"
          >
            {t("search.submit")}
            <Arrow className="size-7" />
          </Link>
          {!user && (
            <Link
              to="/register"
              className="inline-flex items-center border-2 border-border bg-surface px-8 py-5 text-2xl font-black text-fg no-underline transition-colors hover:bg-action hover:text-action-fg"
            >
              {t("nav.register")}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
