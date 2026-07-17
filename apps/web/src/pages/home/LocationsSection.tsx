import { Link } from "react-router-dom";
import { WRAP, GRADIENTS } from "./constants.js";

const LOCATIONS = [
  { grad: "twilight", city: "Oaxaca", ct: "México · 2 houses" },
  { grad: "forest", city: "Lisboa", ct: "Portugal · 1 house" },
  { grad: "night", city: "Medellín", ct: "Colombia · 1 house" },
  { grad: "terracotta", city: "CDMX", ct: "México · 1 house" },
] as const;

export function LocationsSection() {
  return (
    <section className="border-y border-sand-300 bg-sand-50 py-20">
      <div className={WRAP}>
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-ink-500">
              The network · 9 cities · 4 countries
            </p>
            <h2 className="m-0 font-serif text-4xl font-normal leading-tight tracking-tight text-ink-900 md:text-5xl">
              Stay in one. Belong to <em className="not-italic text-terracotta-500">all of them</em>
              .
            </h2>
          </div>
          <Link
            to="/search"
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-900"
          >
            Explore all
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
          {LOCATIONS.map((loc) => (
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
