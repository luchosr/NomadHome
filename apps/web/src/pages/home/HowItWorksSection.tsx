import { Fragment } from "react";
import { t } from "@nomadhome/shared";
import { Arrow } from "@nomadhome/ui";
import { WRAP, FIELD, HOW_IT_WORKS_STEPS } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";

/** Route of three stops: the sequence carries information, so the stops are numbered and joined by arrows. */
export function HowItWorksSection() {
  return (
    <section className={`${FIELD} bg-surface-inverse text-fg-inverse`}>
      <div className={WRAP}>
        <SectionHeading
          pre={t("home.how_it_works.headline_pre")}
          em={t("home.how_it_works.headline_em")}
          className="text-ember"
        />
        <ol className="m-0 mt-12 flex list-none flex-col gap-4 p-0 lg:flex-row lg:items-stretch">
          {HOW_IT_WORKS_STEPS.map((s, i) => (
            <Fragment key={s.n}>
              {i > 0 && (
                <li aria-hidden="true" className="flex items-center justify-center text-ember">
                  <Arrow className="size-10 shrink-0 rotate-90 lg:rotate-0" />
                </li>
              )}
              <li className="flex flex-1 flex-col gap-4 border-2 border-fg-inverse p-6">
                <p className="m-0 flex h-16 w-16 items-center justify-center bg-ember font-display text-3xl font-black leading-none text-fg">
                  {s.n}
                </p>
                <h3 className="m-0 text-2xl font-black leading-tight">{t(s.hKey)}</h3>
                <p className="m-0 text-base leading-relaxed">{t(s.pKey)}</p>
              </li>
            </Fragment>
          ))}
        </ol>
      </div>
    </section>
  );
}
