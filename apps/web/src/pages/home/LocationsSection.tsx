import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Arrow } from "@nomadhome/ui";
import { WRAP, FIELD, LOCATION_CARDS } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";

// SYNTHETIC (NH-118, design.md D8): the city tiles come from LOCATION_CARDS (demo data).
// Replace before public launch (task 11.1).
export function LocationsSection() {
  return (
    <section className={`${FIELD} bg-signal`}>
      <div className={WRAP}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            pre={t("home.locations.headline_pre")}
            em={t("home.locations.headline_em")}
          />
          <Link
            to="/search"
            className="inline-flex shrink-0 items-center gap-3 self-start border-2 border-border px-5 py-3 text-base font-bold text-fg no-underline transition-colors hover:bg-action hover:text-signal md:self-auto"
          >
            {t("home.locations.explore_all")}
            <Arrow className="size-5" />
          </Link>
        </div>
        <ul className="m-0 mt-12 grid list-none grid-cols-2 gap-4 p-0 lg:grid-cols-4">
          {LOCATION_CARDS.map((loc) => (
            <li key={loc.cityKey} className="border-2 border-border bg-surface-inverse">
              <img
                src={loc.img}
                alt={t(loc.cityKey)}
                className="aspect-[4/3] w-full border-b-2 border-border object-cover"
                loading="lazy"
              />
              <div className="p-4 text-fg-inverse">
                <p className="m-0 break-words font-display text-2xl font-black leading-solid text-signal lg:text-3xl">
                  {t(loc.cityKey)}
                </p>
                <p className="m-0 mt-2 text-sm font-medium">{t(loc.detailKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
