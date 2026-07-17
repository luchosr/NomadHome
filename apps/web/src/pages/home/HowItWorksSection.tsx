import { t } from "@nomadhome/shared";
import { WRAP, HOW_IT_WORKS_STEPS } from "./constants.js";

export function HowItWorksSection() {
  return (
    <section className="border-y border-sand-300 bg-sand-50 py-20">
      <div className={WRAP}>
        <div className="mb-10">
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-ink-500">
            {t("home.how_it_works.eyebrow")}
          </p>
          <h2 className="m-0 font-serif text-4xl font-normal leading-tight tracking-tight text-ink-900 md:text-5xl">
            {t("home.how_it_works.headline_pre")}{" "}
            <em className="not-italic text-terracotta-500">{t("home.how_it_works.headline_em")}</em>
            .
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((s) => (
            <div key={s.n}>
              <p className="font-serif text-[56px] leading-none text-terracotta-500">{s.n}</p>
              <h3 className="mt-4 text-xl font-semibold text-ink-900">{t(s.hKey)}</h3>
              <p className="mt-2 text-base leading-relaxed text-ink-700">{t(s.pKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
