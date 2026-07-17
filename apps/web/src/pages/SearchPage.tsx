import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { PageWrapper } from "../components/PageWrapper.js";
import { SearchFilterPanel } from "../components/SearchFilterPanel.js";
import { SearchResults } from "../components/SearchResults.js";
import { useSearchPage, today } from "../hooks/useSearchPage.js";

export function SearchPage() {
  const { form, submit, reset, filtersOpen, setFiltersOpen, data, isLoading, isError } =
    useSearchPage();
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <PageWrapper>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{t("search.page_title")}</h1>

      <form onSubmit={(e) => void submit(e)} className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="city" className="mb-1 block text-sm font-medium text-slate-700">
              {t("search.city_label")}
            </label>
            <Input
              id="city"
              type="text"
              placeholder={t("search.city_placeholder")}
              aria-invalid={!!errors.city}
              {...register("city")}
            />
            {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
          </div>
          <div>
            <label htmlFor="checkIn" className="mb-1 block text-sm font-medium text-slate-700">
              {t("search.checkin_label")}
            </label>
            <Input
              id="checkIn"
              type="date"
              min={today}
              aria-invalid={!!errors.checkIn}
              {...register("checkIn")}
            />
          </div>
          <div>
            <label htmlFor="checkOut" className="mb-1 block text-sm font-medium text-slate-700">
              {t("search.checkout_label")}
            </label>
            <Input
              id="checkOut"
              type="date"
              min={today}
              aria-invalid={!!errors.checkOut}
              {...register("checkOut")}
            />
          </div>
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-[22px] py-[14px] text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z"
                  clipRule="evenodd"
                />
              </svg>
              {t("search.filter_title")}
            </button>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {t("search.submit")}
          </Button>
        </div>

        {filtersOpen && <SearchFilterPanel register={register} errors={errors} onReset={reset} />}
      </form>

      <SearchResults isLoading={isLoading} isError={isError} data={data} />
    </PageWrapper>
  );
}
