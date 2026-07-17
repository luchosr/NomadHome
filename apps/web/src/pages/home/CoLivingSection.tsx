import { WRAP, GRADIENTS } from "./constants.js";

const FEATURES = [
  "Private, furnished bedrooms — yours alone.",
  "Weekly cleaning, fresh linens, and utilities included.",
  "One transparent price per month — no deposits, no surprises.",
] as const;

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CoLivingSection() {
  return (
    <section className="py-20">
      <div className={`${WRAP} grid grid-cols-1 items-center gap-14 lg:grid-cols-2`}>
        <div>
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-ink-500">
            Co-living
          </p>
          <h2 className="m-0 font-serif text-4xl font-normal leading-tight tracking-tight text-ink-900 md:text-5xl">
            A private room in a home that&apos;s actually been{" "}
            <em className="not-italic text-terracotta-500">designed</em>.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-700">
            Not a hostel, not a sublet. Real bedrooms, stocked kitchens, communal tables built for
            long dinners — and housekeeping so you never argue about the dishes.
          </p>
          <ul className="mt-6 flex flex-col gap-3.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-3 text-base text-ink-700">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                  <CheckIcon />
                </span>
                {f}
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
              All included
            </p>
            <p className="mt-1 font-serif text-2xl leading-tight text-ink-900">
              MX$ 18,500<span className="ml-1 font-sans text-sm text-ink-500">/ mo</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
