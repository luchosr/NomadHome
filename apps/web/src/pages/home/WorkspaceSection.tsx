import { t } from "@nomadhome/shared";
import { Arrow, Pictogram } from "@nomadhome/ui";
import { WRAP, FIELD, WORKSPACE_FEATURES } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";
import { FeatureList } from "./FeatureList.js";

/** Panel stack: the photo panel, a route arrow down, then the checklist sign. */
export function WorkspaceSection() {
  return (
    <section className={`${FIELD} bg-surface`}>
      <div
        className={`${WRAP} grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start`}
      >
        <div>
          <Pictogram name="desk" className="mb-6 size-16" />
          <SectionHeading
            pre={t("home.workspace.headline_pre")}
            em={t("home.workspace.headline_em")}
            post={t("home.workspace.headline_post")}
            className="max-w-[16ch]"
          />
          <p className="mt-6 max-w-[56ch] text-lg leading-relaxed">{t("home.workspace.body")}</p>
        </div>
        <div className="flex flex-col items-stretch">
          <div className="border-2 border-border bg-surface">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&fit=crop"
              alt={t("home.workspace.image_alt")}
              className="aspect-[16/9] w-full object-cover"
              loading="lazy"
            />
          </div>
          <div aria-hidden="true" className="flex justify-center py-3">
            <Arrow className="size-12 rotate-90" />
          </div>
          <div className="overflow-hidden border-2 border-border bg-ember text-fg">
            <FeatureList features={WORKSPACE_FEATURES} flush />
          </div>
        </div>
      </div>
    </section>
  );
}
