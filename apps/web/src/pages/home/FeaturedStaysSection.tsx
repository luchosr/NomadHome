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

        {/* Departure board: one full-width black row per stay. Rows are real links and invert to
            signal on hover and focus. The focus ring flips to black because the row turns signal. */}
        <ul className="m-0 mt-12 list-none border-2 border-border bg-surface-inverse p-0 text-fg-inverse">
          {FEATURED_CARDS.map((card, i) => (
            <li key={card.titleKey} className={i > 0 ? "border-t-2 border-fg-inverse" : undefined}>
              <Link
                to="/search"
                className="group grid items-center gap-x-4 gap-y-3 p-4 text-fg-inverse no-underline transition-colors duration-med ease-out [grid-template-areas:'code_city_arrow''thumb_info_info''price_price_price'] [grid-template-columns:6rem_minmax(0,1fr)_auto] hover:bg-signal hover:text-fg focus-visible:bg-signal focus-visible:text-fg focus-visible:[--focus:var(--black)] focus-visible:-outline-offset-[5px] lg:gap-x-6 lg:gap-y-0 lg:p-5 lg:[grid-template-areas:'code_thumb_city_price_arrow''code_thumb_info_price_arrow'] lg:[grid-template-columns:4.5rem_9rem_minmax(0,1fr)_auto_2.75rem]"
              >
                <span
                  aria-hidden="true"
                  className="flex size-16 items-center justify-center bg-signal font-display text-2xl font-black leading-none text-fg transition-colors group-hover:bg-surface-inverse group-hover:text-signal group-focus-visible:bg-surface-inverse group-focus-visible:text-signal [grid-area:code] lg:size-[4.5rem]"
                >
                  {t(card.codeKey)}
                </span>
                <img
                  src={card.img}
                  alt=""
                  className="aspect-[4/3] w-24 border-2 border-fg-inverse object-cover transition-colors group-hover:border-border group-focus-visible:border-border [grid-area:thumb] lg:w-full"
                  loading="lazy"
                />
                <p className="m-0 text-base font-bold [grid-area:city] lg:pb-1">
                  {t(card.cityKey)}
                </p>
                <div className="min-w-0 [grid-area:info]">
                  <p className="m-0 font-display text-2xl font-black leading-solid group-hover:underline group-hover:underline-offset-4 lg:text-4xl">
                    {t(card.titleKey)}
                  </p>
                  <p className="m-0 mt-2 text-sm font-medium">{t(card.metaKey)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 [grid-area:price] lg:flex-col lg:items-end">
                  <span className="whitespace-nowrap font-display text-3xl font-black leading-none text-signal transition-colors group-hover:text-fg group-focus-visible:text-fg lg:text-4xl">
                    {t(card.priceKey)}
                  </span>
                  <Badge tone={card.tagTone}>{t(card.tagKey)}</Badge>
                </div>
                <span
                  aria-hidden="true"
                  className="flex size-11 items-center justify-center border-2 border-fg-inverse transition-colors group-hover:border-border group-hover:bg-surface-inverse group-hover:text-signal group-focus-visible:border-border group-focus-visible:bg-surface-inverse group-focus-visible:text-signal [grid-area:arrow] lg:size-11"
                >
                  <Arrow className="size-6" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
