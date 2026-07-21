import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { searchApi, type SearchParams } from "../api/search.js";

const today = new Date().toISOString().slice(0, 10);

const SearchFormSchema = z
  .object({
    city: z.string().optional(),
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

// z.input gives the pre-transform type that react-hook-form registers use
export type SearchFormValues = z.input<typeof SearchFormSchema>;

export { today };

function urlParamsToSearchParams(sp: URLSearchParams): SearchParams | null {
  // Return null only when no params at all (page hasn't been searched yet)
  if (sp.toString() === "") return null;
  const params: SearchParams = {};
  const city = sp.get("city");
  if (city) params.city = city;
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
  if (minPrice) params.minPrice = Math.round(Number(minPrice) * 100);
  if (maxPrice) params.maxPrice = Math.round(Number(maxPrice) * 100);
  if (capacity) params.capacity = Number(capacity);
  return params;
}

export function useSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSearch, setActiveSearch] = useState<SearchParams | null>(() =>
    urlParamsToSearchParams(searchParams),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const form = useForm<SearchFormValues>({
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

  const submit = form.handleSubmit((values) => {
    const params: SearchParams = {};
    const sp: Record<string, string> = {};

    if (values.city) {
      params.city = values.city;
      sp.city = values.city;
    }

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
    if (values.amenities?.length) {
      params.amenities = values.amenities;
      sp.amenities = values.amenities.join(",");
    }
    if (values.minPrice) {
      params.minPrice = Math.round(Number(values.minPrice) * 100);
      sp.minPrice = values.minPrice;
    }
    if (values.maxPrice) {
      params.maxPrice = Math.round(Number(values.maxPrice) * 100);
      sp.maxPrice = values.maxPrice;
    }
    if (values.capacity) {
      params.capacity = Number(values.capacity);
      sp.capacity = values.capacity;
    }

    setSearchParams(sp);
    setActiveSearch(params);
  });

  const reset = () => {
    form.reset({
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

  return { form, submit, reset, filtersOpen, setFiltersOpen, data, isLoading, isError };
}
