import { t } from "@nomadhome/shared";
import { WRAP, GRADIENTS, COLIVING_FEATURES } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";
import { FeatureList } from "./FeatureList.js";

export function CoLivingSection() {
  return (
    <section className="py-20">
      <div className={`${WRAP} grid grid-cols-1 items-center gap-14 lg:grid-cols-2`}>
        <div>
          <SectionHeading
            eyebrow={t("home.coliving.eyebrow")}
            pre={t("home.coliving.headline_pre")}
            em={t("home.coliving.headline_em")}
          />
          <p className="mt-5 text-lg leading-relaxed text-ink-700">{t("home.coliving.body")}</p>
          <FeatureList features={COLIVING_FEATURES} />
        </div>
        <div
          className={`relative aspect-[5/4] overflow-hidden rounded-3xl shadow-lg ${GRADIENTS.night}`}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.18), transparent 55%)",
            }}
          />
          <div className="absolute bottom-5 left-5 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-md">
            <p className="text-[11px] font-medium uppercase tracking-widest text-ink-500">
              {t("home.coliving.price_label")}
            </p>
            <p className="mt-1 font-serif text-2xl leading-tight text-ink-900">
              {t("home.coliving.price_value")}
              <span className="ml-1 font-sans text-sm text-ink-500">
                {t("home.coliving.price_period")}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
