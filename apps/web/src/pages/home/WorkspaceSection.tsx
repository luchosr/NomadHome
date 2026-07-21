import { t } from "@nomadhome/shared";
import { WRAP, GRADIENTS, WORKSPACE_FEATURES } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";
import { FeatureList } from "./FeatureList.js";

export function WorkspaceSection() {
  return (
    <section className="py-0 pb-20">
      <div className={`${WRAP} grid grid-cols-1 items-center gap-14 lg:grid-cols-2`}>
        <div
          className={`relative aspect-[5/4] overflow-hidden rounded-3xl shadow-lg lg:order-first ${GRADIENTS.sand}`}
        >
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&fit=crop"
            alt="Co-working workspace"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.15)" }} />
          <div className="absolute right-5 top-5 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-forest-900">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {t("home.workspace.status_open")}
            </span>
            <p className="mt-2 text-sm text-ink-500">{t("home.workspace.status_desks")}</p>
          </div>
        </div>
        <div>
          <SectionHeading
            eyebrow={t("home.workspace.eyebrow")}
            pre={t("home.workspace.headline_pre")}
            em={t("home.workspace.headline_em")}
            post={t("home.workspace.headline_post")}
          />
          <p className="mt-5 text-lg leading-relaxed text-ink-700">{t("home.workspace.body")}</p>
          <FeatureList features={WORKSPACE_FEATURES} />
        </div>
      </div>
    </section>
  );
}
