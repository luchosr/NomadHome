import { t } from "@nomadhome/shared";
import { Pictogram } from "@nomadhome/ui";
import { WRAP, FIELD, COLIVING_FEATURES } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";
import { FeatureList } from "./FeatureList.js";

// SYNTHETIC (NH-118, design.md D8): the example monthly rate in the price panel
// (home.coliving.price_*) is an invented USD figure. Replace with a real listing rate or
// remove before public launch (task 11.1).
export function CoLivingSection() {
  return (
    <section className={`${FIELD} bg-sign-green text-fg-inverse [--focus:var(--signal)]`}>
      <div className={`${WRAP} grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start`}>
        <div>
          <Pictogram name="bed" className="mb-6 size-16" />
          <SectionHeading
            pre={t("home.coliving.headline_pre")}
            em={t("home.coliving.headline_em")}
            className="max-w-[16ch]"
          />
          <p className="mt-6 max-w-[56ch] text-lg leading-relaxed">{t("home.coliving.body")}</p>
          <FeatureList features={COLIVING_FEATURES} />
        </div>
        <div className="border-2 border-border bg-surface text-fg">
          <img
            src="https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1200&q=80&fit=crop"
            alt={t("home.coliving.image_alt")}
            className="aspect-[5/4] w-full object-cover"
            loading="lazy"
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t-2 border-border px-6 py-5">
            <p className="m-0 text-lg font-bold">{t("home.coliving.price_label")}</p>
            <p className="m-0 font-display text-4xl font-black leading-none">
              {t("home.coliving.price_value")}
              <span className="ml-2 font-sans text-base font-bold">
                {t("home.coliving.price_period")}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
