import { t } from "@nomadhome/shared";
import { WRAP, HOW_IT_WORKS_STEPS } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";

export function HowItWorksSection() {
  return (
    <section className="border-y border-sand-300 bg-sand-50 py-20">
      <div className={WRAP}>
        <div className="mb-10">
          <SectionHeading
            eyebrow={t("home.how_it_works.eyebrow")}
            pre={t("home.how_it_works.headline_pre")}
            em={t("home.how_it_works.headline_em")}
          />
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
