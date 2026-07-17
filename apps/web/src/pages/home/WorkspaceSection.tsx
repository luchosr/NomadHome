import { WRAP, GRADIENTS } from "./constants.js";

const FEATURES = [
  "300 Mbps Wi-Fi, monitors, and ergonomic chairs.",
  "Reserve desks & meeting rooms from the member app.",
  "Access carries across the whole network as you travel.",
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

export function WorkspaceSection() {
  return (
    <section className="py-0 pb-20">
      <div className={`${WRAP} grid grid-cols-1 items-center gap-14 lg:grid-cols-2`}>
        <div
          className={`relative aspect-[5/4] overflow-hidden rounded-3xl shadow-lg lg:order-first ${GRADIENTS.sand}`}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.18), transparent 55%)",
            }}
          />
          <div className="absolute right-5 top-5 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-forest-900">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Open now
            </span>
            <p className="mt-2 text-sm text-ink-500">11 desks · 2 booths free</p>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-ink-500">
            Workspace
          </p>
          <h2 className="m-0 font-serif text-4xl font-normal leading-tight tracking-tight text-ink-900 md:text-5xl">
            A desk waiting for you in <em className="not-italic text-terracotta-500">every</em>{" "}
            city.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-700">
            Your stay includes a seat at the local coworking space — fast Wi-Fi, quiet rooms, phone
            booths and an espresso bar. Book a desk for the day or a meeting room by the hour.
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
      </div>
    </section>
  );
}
