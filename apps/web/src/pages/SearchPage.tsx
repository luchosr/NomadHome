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

const SearchFormSchema = z.object({
  city: z.string().min(1, t("validation.required.field")),
  checkIn: z.string().date("Invalid date format."),
  checkOut: z.string().date("Invalid date format."),
});

type SearchFormInput = z.infer<typeof SearchFormSchema>;

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSearch, setActiveSearch] = useState<SearchParams | null>(() => {
    const city = searchParams.get("city");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    if (city && checkIn && checkOut) {
      return { city, checkIn, checkOut };
    }
    return null;
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormInput>({
    resolver: zodResolver(SearchFormSchema),
    defaultValues: {
      city: searchParams.get("city") ?? "",
      checkIn: searchParams.get("checkIn") ?? "",
      checkOut: searchParams.get("checkOut") ?? "",
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", activeSearch],
    queryFn: () => searchApi.search(activeSearch!),
    enabled: activeSearch !== null,
  });

  const onSubmit = (values: SearchFormInput) => {
    if (values.checkOut <= values.checkIn) {
      setError("checkOut", { message: t("search.error.end_before_start") });
      return;
    }
    const params: SearchParams = {
      city: values.city,
      checkIn: values.checkIn,
      checkOut: values.checkOut,
    };
    setSearchParams({ city: values.city, checkIn: values.checkIn, checkOut: values.checkOut });
    setActiveSearch(params);
  };

  return (
    <PageWrapper>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{t("search.page_title")}</h1>

      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end"
      >
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
            aria-invalid={!!errors.checkIn}
            {...register("checkIn")}
          />
          {errors.checkIn && <p className="mt-1 text-xs text-red-600">{errors.checkIn.message}</p>}
        </div>

        <div>
          <label htmlFor="checkOut" className="mb-1 block text-sm font-medium text-slate-700">
            {t("search.checkout_label")}
          </label>
          <Input
            id="checkOut"
            type="date"
            aria-invalid={!!errors.checkOut}
            {...register("checkOut")}
          />
          {errors.checkOut && (
            <p className="mt-1 text-xs text-red-600">{errors.checkOut.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {t("search.submit")}
        </Button>
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
