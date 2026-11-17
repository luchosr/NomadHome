import { t } from "@nomadhome/shared";
import { Pictogram } from "@nomadhome/ui";
import { WRAP, COLIVING_FEATURES } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";
import { FeatureList } from "./FeatureList.js";

/**
 * Full-bleed sage field: heading and body on the field, a sign panel pairing the
 * bed pictogram board with the checklist, and a photo band that runs edge to edge.
 */
export function CoLivingSection() {
  return (
    <section className="border-b-2 border-border bg-sage text-fg">
      <div className={`${WRAP} py-16 md:py-24`}>
        <SectionHeading
          pre={t("home.coliving.headline_pre")}
          em={t("home.coliving.headline_em")}
          className="max-w-[16ch] md:text-5xl"
        />
        <p className="mt-6 max-w-[56ch] text-lg leading-relaxed">{t("home.coliving.body")}</p>

        <div className="mt-12 grid grid-cols-1 border-2 border-border bg-surface text-fg lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex items-center justify-center border-b-2 border-border bg-surface-inverse p-8 text-fg-inverse lg:border-b-0 lg:border-r-2 lg:p-10">
            <Pictogram name="bed" className="size-24 text-ember md:size-32" />
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
