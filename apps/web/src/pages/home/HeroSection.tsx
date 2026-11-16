import type { FormEvent } from "react";
import { t } from "@nomadhome/shared";
import { Arrow, Button, Input, Pictogram } from "@nomadhome/ui";
import { WRAP } from "./constants.js";
import { useHomeSearch } from "./useHomeSearch.js";

/** Step the destination type down as the name grows so it never clips inside the input. */
function destinationSize(length: number): string {
  if (length <= 8) return "text-sign-xl";
  if (length <= 13) return "text-5xl";
  if (length <= 18) return "text-3xl";
  return "text-2xl";
}

const dateLabel = "text-sm font-bold text-fg";

export function HeroSection() {
  const { city, setCity, checkIn, setCheckIn, checkOut, setCheckOut, nights, submit } =
    useHomeSearch();

  return (
    <section aria-labelledby="hero-title" className="border-b-2 border-border bg-signal">
      <div className={`${WRAP} py-10 md:py-16`}>
        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex min-w-0 flex-col justify-between gap-8">
            <h1 id="hero-title" className="m-0 max-w-[24ch] text-2xl font-black text-fg">
              {t("home.hero.headline")}
            </h1>
            <div className="flex flex-col gap-2">
              <label htmlFor="city-search" className="text-lg font-bold text-fg">
                {t("home.hero.search_label")}
              </label>
              <Input
                id="city-search"
                autoComplete="off"
                className={`rounded-none border-0 border-b-4 bg-transparent px-0 py-1 font-display font-black leading-solid tracking-tight placeholder:text-fg-muted focus-visible:bg-transparent ${destinationSize(city.length)}`}
                placeholder={t("home.hero.search_placeholder")}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-5 border-2 border-border bg-surface p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex flex-col gap-1">
                <label htmlFor="hero-check-in" className={dateLabel}>
                  {t("home.hero.checkin_label")}
                </label>
                <Input
                  id="hero-check-in"
                  type="date"
                  value={checkIn}
                  max={checkOut || undefined}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="hero-check-out" className={dateLabel}>
                  {t("home.hero.checkout_label")}
                </label>
                <Input
                  id="hero-check-out"
                  type="date"
                  value={checkOut}
                  min={checkIn || undefined}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>
            <p className="m-0 flex items-baseline gap-3" aria-live="polite">
              <span
                data-testid="stay-length"
                className="font-display text-sign-numeral font-black leading-solid tabular-nums text-fg"
              >
                {nights ?? t("home.hero.stay_empty")}
              </span>
              <span className="text-lg font-bold text-fg">
                {nights === 1 ? t("home.hero.stay_unit_one") : t("home.hero.stay_unit_other")}
              </span>
            </p>
          </div>

          <div className="flex items-stretch gap-3 sm:gap-5 lg:col-span-2">
            <ul className="m-0 flex list-none flex-col justify-center gap-3 border-2 border-border bg-sign-green px-4 py-3 text-fg-inverse">
              <li className="flex items-center gap-3 text-lg font-black">
                <Pictogram name="bed" className="size-9 shrink-0 sm:size-10" />
                {t("home.hero.live_label")}
              </li>
              <li className="flex items-center gap-3 text-lg font-black">
                <Pictogram name="desk" className="size-9 shrink-0 sm:size-10" />
                {t("home.hero.work_label")}
              </li>
            </ul>
            <Arrow className="size-10 shrink-0 self-center text-fg sm:size-16" />
            <Button
              type="submit"
              className="min-h-20 flex-1 px-3 text-2xl font-black sm:px-6 sm:text-4xl"
            >
              {t("home.hero.search_aria")}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
