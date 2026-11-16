import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Arrow } from "@nomadhome/ui";
import { WRAP, FIELD, LOCATION_CARDS } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";

// SYNTHETIC (NH-118, design.md D8): the city rows come from LOCATION_CARDS (demo data).
// Replace before public launch (task 11.1).
export function LocationsSection() {
  return (
    <section className={`${FIELD} bg-ember`}>
      <div className={WRAP}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            pre={t("home.locations.headline_pre")}
            em={t("home.locations.headline_em")}
          />
          <Link
            to="/search"
            className="inline-flex shrink-0 items-center gap-3 self-start border-2 border-border bg-surface px-5 py-3 text-base font-bold text-fg no-underline transition-colors hover:bg-action hover:text-action-fg md:self-auto"
          >
            {t("home.locations.explore_all")}
            <Arrow className="size-5" />
          </Link>
        </div>
        {/* Destination index: city names are the largest type on the page. Each row links to the
            search page with that city preselected (the page reads the `city` query param). */}
        <ul className="m-0 mt-12 list-none border-t-2 border-border p-0">
          {LOCATION_CARDS.map((loc) => (
            <li key={loc.cityKey} className="border-b-2 border-border">
              <Link
                to={`/search?city=${encodeURIComponent(t(loc.cityKey))}`}
                className="group flex items-center gap-x-6 py-5 text-fg no-underline transition-colors duration-med ease-out hover:bg-action hover:text-action-fg focus-visible:bg-action focus-visible:text-action-fg focus-visible:[--focus:var(--paper)] focus-visible:[--focus-gap:var(--ink)] focus-visible:-outline-offset-[5px] px-4 md:py-6"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-baseline md:gap-x-8">
                  <span className="break-words font-display text-5xl font-black leading-solid md:text-7xl lg:text-8xl">
                    {t(loc.cityKey)}
                  </span>
                  <span className="text-base font-bold">{t(loc.detailKey)}</span>
                </span>
                <Arrow className="size-10 shrink-0 md:size-16" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
