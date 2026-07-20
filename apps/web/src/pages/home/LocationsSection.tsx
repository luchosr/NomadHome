import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { WRAP, GRADIENTS, LOCATION_CARDS } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";

export function LocationsSection() {
  return (
    <section className="border-y border-sand-300 bg-sand-50 py-20">
      <div className={WRAP}>
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <SectionHeading
              eyebrow={t("home.locations.eyebrow")}
              pre={t("home.locations.headline_pre")}
              em={t("home.locations.headline_em")}
            />
          </div>
          <Link
            to="/search"
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-900"
          >
            {t("home.locations.explore_all")}
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {LOCATION_CARDS.map((loc) => (
            <div
              key={loc.city}
              className={`group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl ${GRADIENTS[loc.grad]}`}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.16), transparent 55%)",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(28,46,39,0.7) 0%, transparent 55%)",
                }}
              />
              <div className="absolute bottom-4 left-4 right-4 text-sand-50">
                <p className="font-serif text-2xl leading-tight group-hover:underline">
                  {loc.city}
                </p>
                <p className="mt-0.5 text-sm opacity-85">{loc.ct}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
