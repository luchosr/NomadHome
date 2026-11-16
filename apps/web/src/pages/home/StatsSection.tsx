import { t } from "@nomadhome/shared";
import { WRAP, STAT_ITEMS } from "./constants.js";

export function StatsSection() {
  return (
    <section className="py-20">
      <div className={`${WRAP} grid grid-cols-2 gap-8 sm:grid-cols-4`}>
        {STAT_ITEMS.map((s) => (
          <div key={s.lKey}>
            <p
              className="font-display leading-none tracking-tight text-fg"
              style={{ fontSize: "clamp(48px, 6vw, 72px)" }}
            >
              {s.v.includes("%") || s.v.startsWith("+") ? (
                <>
                  {s.v.replace("%", "").replace("+", "")}
                  <span className="text-fg">{s.v.includes("%") ? "%" : "+"}</span>
                </>
              ) : (
                s.v
              )}
            </p>
            <p className="mt-2 text-base text-fg-subtle">{t(s.lKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
