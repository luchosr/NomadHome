import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Arrow, Badge } from "@nomadhome/ui";
import { WRAP, FIELD, FEATURED_CARDS } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";

// SYNTHETIC (NH-118, design.md D8): cards come from FEATURED_CARDS (invented demo records)
// and their state tags are placeholders. Replace before public launch (task 11.1).
export function FeaturedStaysSection() {
  return (
    <section className={`${FIELD} bg-surface`}>
      <div className={WRAP}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            pre={t("home.featured.headline_pre")}
            em={t("home.featured.headline_em")}
            post={t("home.featured.headline_post")}
          />
          <Link
            to="/search"
            className="inline-flex shrink-0 items-center gap-3 self-start border-2 border-border px-5 py-3 text-base font-bold text-fg no-underline transition-colors hover:bg-action hover:text-fg-inverse md:self-auto"
          >
            {t("home.featured.see_all")}
            <Arrow className="size-5" />
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {FEATURED_CARDS.map((card) => (
            <article key={card.titleKey} className="border-2 border-border">
              <Link
                to="/search"
                className="group block h-full bg-surface text-fg no-underline transition-colors hover:bg-signal"
              >
                <div className="relative">
                  <img
                    src={card.img}
                    alt={t(card.titleKey)}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                  <p className="absolute left-0 top-0 m-0 border-b-2 border-r-2 border-border bg-signal px-4 py-2 text-sm font-black text-fg">
                    {t(card.cityKey)}
                  </p>
                </div>
                <div className="border-t-2 border-border p-5">
                  <p className="m-0 font-display text-3xl font-black leading-solid group-hover:underline group-hover:underline-offset-4">
                    {t(card.titleKey)}
                  </p>
                  <p className="mt-3 text-sm font-medium">{t(card.metaKey)}</p>
                  <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-xl font-black">{t(card.priceKey)}</span>
                    <Badge tone={card.tagTone}>{t(card.tagKey)}</Badge>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
