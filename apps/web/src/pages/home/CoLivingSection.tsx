import { t } from "@nomadhome/shared";
import { Pictogram } from "@nomadhome/ui";
import { WRAP, COLIVING_FEATURES } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";
import { FeatureList } from "./FeatureList.js";

// SYNTHETIC (NH-118, design.md D8): the example monthly rate in the price panel
// (home.coliving.price_*) is an invented USD figure. Replace with a real listing rate or
// remove before public launch (task 11.1).
/**
 * Full-bleed sign green field: heading and body on the field, a white sign panel carrying the
 * bed pictogram board, the example rate and the checklist, and a photo band that runs edge to edge.
 */
export function CoLivingSection() {
  return (
    <section className="border-b-2 border-border bg-sign-green text-fg-inverse [--focus:var(--signal)]">
      <div className={`${WRAP} py-16 md:py-24`}>
        <SectionHeading
          pre={t("home.coliving.headline_pre")}
          em={t("home.coliving.headline_em")}
          className="max-w-[16ch] md:text-5xl"
        />
        <p className="mt-6 max-w-[56ch] text-lg leading-relaxed">{t("home.coliving.body")}</p>

        <div className="mt-12 grid grid-cols-1 border-2 border-border bg-surface text-fg lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col justify-between gap-8 border-b-2 border-border bg-surface-inverse p-6 text-fg-inverse lg:border-b-0 lg:border-r-2 lg:p-8">
            <Pictogram name="bed" className="size-24 text-signal md:size-32" />
            <div>
              <p className="m-0 text-lg font-bold">{t("home.coliving.price_label")}</p>
              <p className="m-0 mt-2 font-display text-5xl font-black leading-none text-signal">
                {t("home.coliving.price_value")}
                <span className="ml-2 font-sans text-base font-bold text-fg-inverse">
                  {t("home.coliving.price_period")}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center p-6 lg:p-8">
            <FeatureList features={COLIVING_FEATURES} className="mt-0 w-full" />
          </div>
        </div>
      </div>
      <img
        src="https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1600&q=80&fit=crop"
        alt={t("home.coliving.image_alt")}
        className="h-64 w-full border-t-2 border-border object-cover md:h-[26rem]"
        loading="lazy"
      />
    </section>
  );
}
