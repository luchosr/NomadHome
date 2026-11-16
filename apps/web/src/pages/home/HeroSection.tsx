import type { FormEvent } from "react";
import { t } from "@nomadhome/shared";
import { WRAP, STAR_RATING } from "./constants.js";
import { useHomeSearch } from "./useHomeSearch.js";

export function HeroSection() {
  const { city, setCity, submit } = useHomeSearch();

  return (
    <section className="relative overflow-hidden bg-surface pb-16 pt-20">
      <div
        className="pointer-events-none absolute -right-60 -top-40 h-[720px] w-[720px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,199,0,0.18) 0%, transparent 62%)" }}
      />
      <div className={WRAP}>
        <p className="eyebrow mb-6 text-xs font-medium uppercase tracking-widest text-fg-subtle">
          {t("home.hero.eyebrow")}
        </p>
        <h1
          className="m-0 max-w-[14ch] font-display font-normal leading-[0.98] tracking-tight text-fg"
          style={{ fontSize: "clamp(52px, 8vw, 100px)" }}
        >
          {t("home.hero.headline_pre")}{" "}
          <em className="not-italic text-fg">{t("home.hero.headline_em")}</em>
          {t("home.hero.headline_post")}
        </h1>
        <p className="mt-7 max-w-[56ch] text-xl leading-relaxed text-fg-muted">
          {t("home.hero.subheadline")}
        </p>

        <svg className="mt-7 w-52" viewBox="0 0 200 12">
          <path
            d="M2 6 Q 25 1, 50 6 T 100 6 T 150 6 T 198 6"
            stroke="#FFC700"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        <form
          className="mt-10 flex max-w-[860px] overflow-hidden rounded-3xl border border-border-muted bg-white shadow-md transition-shadow focus-within:border-border focus-within:shadow-lg"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex flex-1 flex-col gap-1 border-r border-border-muted px-6 py-[18px]">
            <label
              htmlFor="city-search"
              className="text-[11px] font-medium uppercase tracking-widest text-fg-subtle"
            >
              {t("home.hero.search_label")}
            </label>
            <input
              id="city-search"
              className="bg-transparent text-base text-fg outline-none ring-0 focus:outline-none placeholder:text-fg-subtle"
              placeholder={t("home.hero.search_placeholder")}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="flex items-center px-4">
            <button
              type="submit"
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-action text-fg-inverse transition-colors hover:bg-action-hover"
              aria-label={t("home.hero.search_aria")}
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-fg-subtle">
          <span className="flex gap-0.5 text-fg">
            {STAR_RATING.map((i) => (
              <svg key={i} className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
              </svg>
            ))}
          </span>
          <span>{t("home.hero.trust_rating")}</span>
          <span>·</span>
          <span>{t("home.hero.trust_nps")}</span>
        </div>
      </div>
    </section>
  );
}
