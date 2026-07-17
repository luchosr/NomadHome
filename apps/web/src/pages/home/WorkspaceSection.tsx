import { t } from "@nomadhome/shared";
import { WRAP, GRADIENTS, WORKSPACE_FEATURES } from "./constants.js";
import { CheckIcon } from "./CheckIcon.js";

export function WorkspaceSection() {
  return (
    <section className="py-0 pb-20">
      <div className={`${WRAP} grid grid-cols-1 items-center gap-14 lg:grid-cols-2`}>
        <div
          className={`relative aspect-[5/4] overflow-hidden rounded-3xl shadow-lg lg:order-first ${GRADIENTS.sand}`}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.18), transparent 55%)",
            }}
          />
          <div className="absolute right-5 top-5 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-forest-900">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {t("home.workspace.status_open")}
            </span>
            <p className="mt-2 text-sm text-ink-500">{t("home.workspace.status_desks")}</p>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-ink-500">
            {t("home.workspace.eyebrow")}
          </p>
          <h2 className="m-0 font-serif text-4xl font-normal leading-tight tracking-tight text-ink-900 md:text-5xl">
            {t("home.workspace.headline_pre")}{" "}
            <em className="not-italic text-terracotta-500">{t("home.workspace.headline_em")}</em>{" "}
            {t("home.workspace.headline_post")}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-700">{t("home.workspace.body")}</p>
          <ul className="mt-6 flex flex-col gap-3.5">
            {WORKSPACE_FEATURES.map((key) => (
              <li key={key} className="flex gap-3 text-base text-ink-700">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                  <CheckIcon />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
