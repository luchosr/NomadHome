import { t } from "@nomadhome/shared";
import { WRAP, FIELD, STAT_ITEMS } from "./constants.js";

// SYNTHETIC placeholder (NH-118, design.md D8): these figures are invented and have no
// real source. Replace with real data or remove before public launch (change task 11.1).
// Presenting them as real metrics is a trust and legal risk.
export function StatsSection() {
  return (
    <section className={`${FIELD} bg-surface`}>
      <div className={`${WRAP} grid grid-cols-2 gap-4 md:grid-cols-4`}>
        {STAT_ITEMS.map((s) => (
          <div
            key={s.lKey}
            className="flex flex-col justify-between gap-6 border-2 border-border bg-surface-inverse p-5 text-fg-inverse"
          >
            <p
              className="m-0 font-display font-black leading-solid tabular-nums text-signal"
              style={{ fontSize: "clamp(3rem, 2rem + 4vw, 5.5rem)" }}
            >
              {s.v}
            </p>
            <p className="m-0 text-base font-bold">{t(s.lKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
