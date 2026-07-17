import { WRAP } from "./constants.js";

const STATS = [
  { v: "9", l: "cities, and counting" },
  { v: "142", l: "private rooms" },
  { v: "92%", l: "network occupancy" },
  { v: "+62", l: "member NPS" },
] as const;

export function StatsSection() {
  return (
    <section className="py-20">
      <div className={`${WRAP} grid grid-cols-2 gap-8 sm:grid-cols-4`}>
        {STATS.map((s) => (
          <div key={s.l}>
            <p
              className="font-serif leading-none tracking-tight text-ink-900"
              style={{ fontSize: "clamp(48px, 6vw, 72px)" }}
            >
              {s.v.includes("%") || s.v.startsWith("+") ? (
                <>
                  {s.v.replace("%", "").replace("+", "")}
                  <span className="text-terracotta-500">{s.v.includes("%") ? "%" : "+"}</span>
                </>
              ) : (
                s.v
              )}
            </p>
            <p className="mt-2 text-base text-ink-500">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
