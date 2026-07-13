import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { searchApi, type SearchParams } from "../api/search.js";
import { ListingCard } from "../components/ListingCard.js";
import { PageWrapper } from "../components/PageWrapper.js";

const AMENITY_OPTIONS = [
  { code: "wifi", label: "WiFi" },
  { code: "parking", label: "Parking" },
  { code: "pool", label: "Pool" },
  { code: "gym", label: "Gym" },
  { code: "kitchen", label: "Kitchen" },
  { code: "ac", label: "A/C" },
];

const SearchFormSchema = z
  .object({
    city: z.string().min(1, t("validation.required.field")),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    type: z.enum(["PROPERTY", "WORKSPACE", ""]).optional(),
    amenities: z.array(z.string()).default([]),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    capacity: z.string().optional(),
  })
  .refine((d) => !d.checkIn || !d.checkOut || d.checkOut > d.checkIn, {
    message: t("search.error.end_before_start"),
    path: ["checkOut"],
  });

const today = new Date().toISOString().slice(0, 10);

function urlParamsToActiveSearch(sp: URLSearchParams): SearchParams | null {
  const city = sp.get("city");
  if (!city) return null;
  const params: SearchParams = { city };
  const checkIn = sp.get("checkIn");
  const checkOut = sp.get("checkOut");
  const type = sp.get("type");
  const amenities = sp.get("amenities");
  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");
  const capacity = sp.get("capacity");
  if (checkIn) params.checkIn = checkIn;
  if (checkOut) params.checkOut = checkOut;
  if (type === "PROPERTY" || type === "WORKSPACE") params.type = type;
  if (amenities) params.amenities = amenities.split(",").filter(Boolean);
  // URL stores display dollars; convert to cents for the API
  if (minPrice) params.minPrice = Math.round(Number(minPrice) * 100);
  if (maxPrice) params.maxPrice = Math.round(Number(maxPrice) * 100);
  if (capacity) params.capacity = Number(capacity);
  return params;
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSearch, setActiveSearch] = useState<SearchParams | null>(() =>
    urlParamsToActiveSearch(searchParams),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(SearchFormSchema),
    defaultValues: {
      city: searchParams.get("city") ?? "",
      checkIn: searchParams.get("checkIn") ?? "",
      checkOut: searchParams.get("checkOut") ?? "",
      type: (searchParams.get("type") as "PROPERTY" | "WORKSPACE" | "") ?? "",
      amenities:
        searchParams
          .get("amenities")
          ?.split(",")
          .filter((s): s is string => s.length > 0) ?? [],
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      capacity: searchParams.get("capacity") ?? "",
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", activeSearch],
    queryFn: () => searchApi.search(activeSearch!),
    enabled: activeSearch !== null,
  });

  const submitHandler = handleSubmit((values) => {
    const params: SearchParams = { city: values.city };
    const sp: Record<string, string> = { city: values.city };

    if (values.checkIn) {
      params.checkIn = values.checkIn;
      sp.checkIn = values.checkIn;
    }
    if (values.checkOut) {
      params.checkOut = values.checkOut;
      sp.checkOut = values.checkOut;
    }
    if (values.type) {
      params.type = values.type as "PROPERTY" | "WORKSPACE";
      sp.type = values.type;
    }
    if (values.amenities.length) {
      params.amenities = values.amenities;
      sp.amenities = values.amenities.join(",");
    }
    if (values.minPrice !== "" && values.minPrice !== undefined) {
      params.minPrice = Math.round(Number(values.minPrice) * 100);
      sp.minPrice = String(values.minPrice);
    }
    if (values.maxPrice !== "" && values.maxPrice !== undefined) {
      params.maxPrice = Math.round(Number(values.maxPrice) * 100);
      sp.maxPrice = String(values.maxPrice);
    }
    if (values.capacity !== "" && values.capacity !== undefined) {
      params.capacity = Number(values.capacity);
      sp.capacity = String(values.capacity);
    }

    setSearchParams(sp);
    setActiveSearch(params);
  });

  const handleReset = () => {
    reset({
      city: "",
      checkIn: "",
      checkOut: "",
      type: "",
      amenities: [],
      minPrice: "",
      maxPrice: "",
      capacity: "",
    });
    setSearchParams({});
    setActiveSearch(null);
  };

  return (
    <PageWrapper>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{t("search.page_title")}</h1>

      <form onSubmit={(e) => void submitHandler(e)} className="mb-8 space-y-4">
        {/* Main search row */}
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
            {errors.checkIn && (
              <p className="mt-1 text-xs text-red-600">{errors.checkIn.message}</p>
            )}
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
            {errors.checkOut && (
              <p className="mt-1 text-xs text-red-600">{errors.checkOut.message}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 self-end"
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

          <Button type="submit" disabled={isSubmitting}>
            {t("search.submit")}
          </Button>
        </div>

        {/* Filter panel — toggled by Filters button */}
        {filtersOpen && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">{t("search.filter_title")}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="type" className="mb-1 block text-sm font-medium text-slate-700">
                  {t("search.filter_type_label")}
                </label>
                <select
                  id="type"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                  {...register("type")}
                >
                  <option value="">{t("search.filter_type_all")}</option>
                  <option value="PROPERTY">{t("search.filter_type_property")}</option>
                  <option value="WORKSPACE">{t("search.filter_type_workspace")}</option>
                </select>
              </div>

              <div>
                <label htmlFor="minPrice" className="mb-1 block text-sm font-medium text-slate-700">
                  {t("search.filter_min_price_label")}
                </label>
                <Input
                  id="minPrice"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("minPrice")}
                />
              </div>

              <div>
                <label htmlFor="maxPrice" className="mb-1 block text-sm font-medium text-slate-700">
                  {t("search.filter_max_price_label")}
                </label>
                <Input
                  id="maxPrice"
                  type="number"
                  min="0"
                  placeholder="Any"
                  {...register("maxPrice")}
                />
              </div>

              <div>
                <label htmlFor="capacity" className="mb-1 block text-sm font-medium text-slate-700">
                  {t("search.filter_capacity_label")}
                </label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="Any"
                  {...register("capacity")}
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                {t("search.filter_amenities_label")}
              </p>
              <div className="flex flex-wrap gap-3">
                {AMENITY_OPTIONS.map(({ code, label }) => (
                  <label
                    key={code}
                    className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-600"
                  >
                    <input
                      type="checkbox"
                      value={code}
                      {...register("amenities")}
                      className="accent-forest-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="mt-3 text-xs text-slate-500 underline hover:text-slate-700"
            >
              {t("search.filter_reset")}
            </button>
          </div>
        )}
      </form>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-200 bg-slate-100 h-64"
            />
          ))}
        </div>
      )}

      {isError && (
        <p role="alert" className="text-red-600">
          {t("error.generic.unexpected")}
        </p>
      )}

      {data && data.data.length === 0 && <p className="text-slate-500">{t("search.no_results")}</p>}

      {data && data.data.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {data.data.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
