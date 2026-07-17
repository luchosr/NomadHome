import { t } from "@nomadhome/shared";
import { ListingCard } from "./ListingCard.js";
import type { searchApi } from "../api/search.js";

type SearchData = Awaited<ReturnType<typeof searchApi.search>>;

interface Props {
  isLoading: boolean;
  isError: boolean;
  data: SearchData | undefined;
}

export function SearchResults({ isLoading, isError, data }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-red-600">
        {t("error.generic.unexpected")}
      </p>
    );
  }

  if (!data || data.data.length === 0) {
    return <p className="text-slate-500">{t("search.no_results")}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {data.data.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
