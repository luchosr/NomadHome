import { useRef } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { SearchFilterPanel } from "../components/SearchFilterPanel.js";
import { SearchResults } from "../components/SearchResults.js";
import { useSearchPage, today } from "../hooks/useSearchPage.js";

const FILTER_PANEL_ID = "search-filters";
const WRAP = "mx-auto w-full max-w-[1280px] px-4 md:px-12";
const CONTROL_H = "h-[3.25rem]";
const fieldLabel = "mb-1 block text-sm font-bold text-fg";

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDates(checkIn: string | null, checkOut: string | null): string {
  if (checkIn && checkOut) return `${formatDay(checkIn)} - ${formatDay(checkOut)}`;
  if (checkIn) return formatDay(checkIn);
  if (checkOut) return formatDay(checkOut);
  return t("search.summary_dates_any");
}

function Fact({ children }: { children: string }) {
  return (
    <p className="m-0 border-2 border-border px-3 py-1 text-sm font-black text-fg sm:border-0 sm:px-4 sm:py-2 sm:text-base">
      {children}
    </p>
  );
}

export function SearchPage() {
  const { form, submit, reset, filtersOpen, setFiltersOpen, data, isLoading, isError } =
    useSearchPage();
  const [searchParams] = useSearchParams();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const closeFilters = () => {
    setFiltersOpen(false);
    toggleRef.current?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    void submit(e);
    // On a phone the sheet covers the results, so searching dismisses it.
    if (
      filtersOpen &&
      typeof window.matchMedia === "function" &&
      !window.matchMedia("(min-width: 768px)").matches
    ) {
      closeFilters();
    }
  };

  const total = data?.pagination.total;
  const city = searchParams.get("city") ?? t("search.summary_city_any");
  const resultWord =
    total === 1 ? t("search.summary_result_one") : t("search.summary_result_other");

  return (
    <form onSubmit={onSubmit}>
      <section className="border-b-2 border-border bg-signal">
        <div className={`${WRAP} py-5 md:py-10`}>
          <h1 className="m-0 mb-4 text-2xl font-black leading-tight text-fg md:mb-6 md:text-3xl">
            {t("search.page_title")}
          </h1>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-[minmax(0,2fr)_1fr_1fr_auto_auto] lg:items-end">
            <div className="col-span-2 lg:col-span-1">
              <label htmlFor="city" className={fieldLabel}>
                {t("search.city_label")}
              </label>
              <Input
                id="city"
                className={CONTROL_H}
                type="text"
                placeholder={t("search.city_placeholder")}
                aria-invalid={!!errors.city}
                {...register("city")}
              />
              {errors.city && (
                <p className="mt-1 text-sm font-bold text-danger">{errors.city.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="checkIn" className={fieldLabel}>
                {t("search.checkin_label")}
              </label>
              <Input
                id="checkIn"
                className={CONTROL_H}
                type="date"
                min={today}
                aria-invalid={!!errors.checkIn}
                {...register("checkIn")}
              />
            </div>
            <div>
              <label htmlFor="checkOut" className={fieldLabel}>
                {t("search.checkout_label")}
              </label>
              <Input
                id="checkOut"
                className={CONTROL_H}
                type="date"
                min={today}
                aria-invalid={!!errors.checkOut}
                {...register("checkOut")}
              />
            </div>
            <Button
              ref={toggleRef}
              className={`${CONTROL_H} ${filtersOpen ? "" : "bg-surface"}`}
              type="button"
              variant={filtersOpen ? "primary" : "secondary"}
              aria-expanded={filtersOpen}
              aria-controls={FILTER_PANEL_ID}
              onClick={() => setFiltersOpen((o) => !o)}
            >
              {t("search.filter_title")}
            </Button>
            <Button type="submit" className={CONTROL_H} disabled={isSubmitting}>
              {t("search.submit")}
            </Button>
          </div>
          {errors.checkOut && (
            <p
              role="alert"
              className="m-0 mt-3 inline-block border-2 border-danger bg-danger-bg px-3 py-1 text-sm font-bold text-danger"
            >
              {errors.checkOut.message}
            </p>
          )}
        </div>
      </section>

      <div className={`${WRAP} py-5 md:py-10`}>
        {data && (
          <section
            aria-label={t("search.summary_label")}
            className="mb-4 flex flex-wrap gap-2 sm:mb-6 sm:w-fit sm:gap-0 sm:divide-x-2 sm:divide-border sm:border-2 sm:border-border"
          >
            <Fact>{city}</Fact>
            <Fact>{formatDates(searchParams.get("checkIn"), searchParams.get("checkOut"))}</Fact>
            <Fact>{`${data.pagination.total} ${resultWord}`}</Fact>
          </section>
        )}

        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {filtersOpen && (
            <SearchFilterPanel
              id={FILTER_PANEL_ID}
              register={register}
              onReset={reset}
              onClose={closeFilters}
            />
          )}
          <div className="min-w-0 flex-1">
            <SearchResults
              isLoading={isLoading}
              isError={isError}
              data={data}
              onReset={reset}
              panelOpen={filtersOpen}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
