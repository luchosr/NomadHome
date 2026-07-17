import { t } from "@nomadhome/shared";
import { WRAP, GRADIENTS, COLIVING_FEATURES } from "./constants.js";
import { CheckIcon } from "./CheckIcon.js";

export function CoLivingSection() {
  return (
    <section className="py-20">
      <div className={`${WRAP} grid grid-cols-1 items-center gap-14 lg:grid-cols-2`}>
        <div>
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-ink-500">
            {t("home.coliving.eyebrow")}
          </p>
          <h2 className="m-0 font-serif text-4xl font-normal leading-tight tracking-tight text-ink-900 md:text-5xl">
            {t("home.coliving.headline_pre")}{" "}
            <em className="not-italic text-terracotta-500">{t("home.coliving.headline_em")}</em>.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-700">{t("home.coliving.body")}</p>
          <ul className="mt-6 flex flex-col gap-3.5">
            {COLIVING_FEATURES.map((key) => (
              <li key={key} className="flex gap-3 text-base text-ink-700">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                  <CheckIcon />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
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
