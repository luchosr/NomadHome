import type { FormEvent } from "react";
import { t } from "@nomadhome/shared";
import { Arrow, Button, Input, Pictogram } from "@nomadhome/ui";
import { WRAP } from "./constants.js";
import { useHomeSearch } from "./useHomeSearch.js";

const MAX_DESTINATION = "11.5rem";
const MAX_NUMERAL = "14rem";

/** Fit the destination to its container: one em-width estimate per character, capped for short names. */
function destinationSize(length: number): string {
  return `clamp(1.5rem, ${(100 / (Math.max(length, 6) * 0.6)).toFixed(2)}cqw, ${MAX_DESTINATION})`;
}

/** Fit the numeral to its panel, leaving room for the unit label. */
function numeralSize(digits: number): string {
  return `min(${MAX_NUMERAL}, 36vw, calc((100cqw - 5rem) / ${(Math.max(digits, 1) * 0.62).toFixed(2)}))`;
}

const dateInput =
  "appearance-none px-3 py-3 font-sans text-base font-bold tabular-nums [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-date-and-time-value]:text-left";

const dateLabel = "text-sm font-bold text-fg";

export function HeroSection() {
  const { city, setCity, checkIn, setCheckIn, checkOut, setCheckOut, nights, submit } =
    useHomeSearch();

  return (
    <section aria-labelledby="hero-title" className="border-b-2 border-border bg-signal">
      <div className={`${WRAP} py-10 md:py-16`}>
        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex min-w-0 flex-col justify-end gap-4">
            <h1
              id="hero-title"
              className="m-0 max-w-[28ch] text-2xl font-black text-fg md:text-3xl"
            >
              {t("home.hero.headline")}
            </h1>
            <div className="flex flex-col gap-1 [container-type:inline-size]">
              <label htmlFor="city-search" className="text-lg font-bold text-fg">
                {t("home.hero.search_label")}
              </label>
              <Input
                id="city-search"
                autoComplete="off"
                className={`rounded-none border-0 border-b-4 bg-transparent px-0 py-0 font-display font-black leading-[0.85] tracking-tight placeholder:text-fg-subtle focus-visible:border-transparent focus-visible:bg-transparent ${city ? "" : "border-dashed"}`}
                style={{ fontSize: destinationSize(city.length) }}
                placeholder={t("home.hero.search_placeholder")}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-5 border-2 border-border bg-surface p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="hero-check-in" className={dateLabel}>
                  {t("home.hero.checkin_label")}
                </label>
                <Input
                  id="hero-check-in"
                  type="date"
                  className={`${dateInput} ${checkIn ? "" : "text-fg-muted"}`}
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
                  className={`${dateInput} ${checkOut ? "" : "text-fg-muted"}`}
                  value={checkOut}
                  min={checkIn || undefined}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>
            <div className="[container-type:inline-size]">
              <p className="m-0 flex items-baseline gap-3" aria-live="polite">
                <span
                  data-testid="stay-length"
                  className={`font-display font-black leading-solid tabular-nums ${nights === null ? "text-fg-subtle underline decoration-dashed decoration-4 underline-offset-8" : "text-fg"}`}
                  style={{ fontSize: numeralSize(String(nights ?? "").length) }}
                >
                  {nights ?? t("home.hero.stay_empty")}
                </span>
                <span className="text-lg font-bold text-fg">
                  {nights === 1 ? t("home.hero.stay_unit_one") : t("home.hero.stay_unit_other")}
                </span>
              </p>
            </div>
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
