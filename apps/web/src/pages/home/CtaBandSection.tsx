import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { useAuth } from "../../contexts/auth.js";
import { WRAP } from "./constants.js";

export function CtaBandSection() {
  const { user } = useAuth();

  return (
    <section className="pb-20">
      <div className={WRAP}>
        <div className="relative overflow-hidden rounded-3xl bg-forest-700 px-8 py-16 text-center md:px-16 md:py-[72px]">
          <div
            className="pointer-events-none absolute -bottom-52 -left-40 h-[560px] w-[560px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(217,119,87,0.28) 0%, transparent 62%)",
            }}
          />
          <p className="eyebrow relative mb-4 text-xs font-medium uppercase tracking-widest text-terracotta-200">
            {t("home.cta.eyebrow")}
          </p>
          <h2
            className="relative m-0 font-serif font-normal leading-tight tracking-tight text-sand-50"
            style={{ fontSize: "clamp(38px, 5.5vw, 68px)" }}
          >
            {t("home.cta.headline_pre")}{" "}
            <em className="not-italic text-terracotta-200">{t("home.cta.headline_em")}</em>.
          </h2>
          <p className="relative mx-auto mt-5 max-w-[52ch] text-lg text-forest-200">
            {t("home.cta.body")}
          </p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3.5">
            <Link
              to="/search"
              className="rounded-xl bg-sand-50 px-7 py-4 text-base font-medium text-forest-700 transition-colors hover:bg-white"
            >
              {t("search.submit")}
            </Link>
            {!user && (
              <Link
                to="/register"
                className="rounded-xl border px-7 py-4 text-base font-medium text-sand-50 transition-colors hover:bg-white/10"
                style={{ borderColor: "rgba(245,240,232,0.4)" }}
              >
                {t("nav.register")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
