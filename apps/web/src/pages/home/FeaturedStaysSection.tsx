import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Arrow } from "@nomadhome/ui";
import { WRAP, FIELD, FEATURED_CARDS } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";

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
            <article key={card.title} className="border-2 border-border">
              <Link
                to="/search"
                className="group block h-full bg-surface text-fg no-underline transition-colors hover:bg-signal"
              >
                <div className="relative">
                  <img
                    src={card.img}
                    alt={card.title}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                  <p className="absolute left-0 top-0 m-0 border-b-2 border-r-2 border-border bg-signal px-4 py-2 text-sm font-black text-fg">
                    {card.city}
                  </p>
                </div>
                <div className="border-t-2 border-border p-5">
                  <p className="m-0 font-display text-3xl font-black leading-solid group-hover:underline group-hover:underline-offset-4">
                    {card.title}
                  </p>
                  <p className="mt-3 text-sm font-medium">{card.meta}</p>
                  <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-xl font-black">{card.price}</span>
                    <span className="border-2 border-current px-2 py-0.5 text-sm font-bold">
                      {"tag" in card && card.tag ? `${card.tag} · ${card.left}` : card.left}
                    </span>
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
