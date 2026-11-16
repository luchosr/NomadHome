import { t } from "@nomadhome/shared";
import { Arrow, Pictogram } from "@nomadhome/ui";
import { WRAP, FIELD, WORKSPACE_FEATURES } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";
import { FeatureList } from "./FeatureList.js";

// SYNTHETIC (NH-118, design.md D8): the status strip (home.workspace.status_*) describes an
// invented demo workspace. Replace with a real listing or remove before public launch
// (task 11.1).
/** Panel stack: the listing panel, a route arrow down, then the checklist sign. */
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t-2 border-border bg-surface-inverse px-6 py-5 text-fg-inverse">
              <span aria-hidden="true" className="h-4 w-4 shrink-0 bg-signal" />
              <p className="m-0 text-lg font-black">{t("home.workspace.status_open")}</p>
              <p className="m-0 text-base font-bold sm:ml-auto">
                {t("home.workspace.status_desks")}
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="flex justify-center py-3">
            <Arrow className="size-12 rotate-90" />
          </div>
          <div className="overflow-hidden border-2 border-border bg-signal text-fg">
            <FeatureList features={WORKSPACE_FEATURES} flush />
          </div>
        </div>
      </div>
    </section>
  );
}
