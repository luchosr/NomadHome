import { t } from "@nomadhome/shared";
import { Pictogram } from "@nomadhome/ui";
import { WRAP, FIELD, WORKSPACE_FEATURES } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";
import { FeatureList } from "./FeatureList.js";

// SYNTHETIC (NH-118, design.md D8): the status strip (home.workspace.status_*) describes an
// invented demo workspace. Replace with a real listing or remove before public launch
// (task 11.1).
export function WorkspaceSection() {
  return (
    <section className={`${FIELD} bg-surface`}>
      <div className={`${WRAP} grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start`}>
        <div className="border-2 border-border bg-surface">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&fit=crop"
            alt={t("home.workspace.image_alt")}
            className="aspect-[5/4] w-full object-cover"
            loading="lazy"
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t-2 border-border bg-surface-inverse px-6 py-5 text-fg-inverse">
            <span aria-hidden="true" className="h-4 w-4 shrink-0 bg-signal" />
            <p className="m-0 whitespace-nowrap text-lg font-black">
              {t("home.workspace.status_open")}
            </p>
            <p className="m-0 ml-auto text-base font-bold whitespace-nowrap">
              {t("home.workspace.status_desks")}
            </p>
          </div>
        </div>
        <div>
          <Pictogram name="desk" className="mb-6 size-16" />
          <SectionHeading
            pre={t("home.workspace.headline_pre")}
            em={t("home.workspace.headline_em")}
            post={t("home.workspace.headline_post")}
            className="max-w-[16ch]"
          />
          <p className="mt-6 max-w-[56ch] text-lg leading-relaxed">{t("home.workspace.body")}</p>
          <FeatureList features={WORKSPACE_FEATURES} />
        </div>
      </div>
    </section>
  );
}
