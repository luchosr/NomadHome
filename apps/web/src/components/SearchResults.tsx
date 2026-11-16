import { t } from "@nomadhome/shared";
import { Button, Pictogram, Skeleton } from "@nomadhome/ui";
import { ListingCard } from "./ListingCard.js";
import type { searchApi } from "../api/search.js";

type SearchData = Awaited<ReturnType<typeof searchApi.search>>;

interface Props {
  isLoading: boolean;
  isError: boolean;
  data: SearchData | undefined;
  onReset: () => void;
  panelOpen: boolean;
}

const GRID = "grid grid-cols-1 gap-6";
// With the side panel open the results column is narrower, so columns arrive later.
const GRID_WIDE = `${GRID} md:grid-cols-2 xl:grid-cols-3`;
const GRID_NARROW = `${GRID} lg:grid-cols-2 xl:grid-cols-3`;

/** Skeleton mirrors the card anatomy so the grid does not jump when results land. */
function ResultSkeleton() {
  return (
    <div className="flex h-full flex-col border-2 border-border bg-surface">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-6 h-8 w-1/2" />
      </div>
    </div>
  );
}

export function SearchResults({ isLoading, isError, data, onReset, panelOpen }: Props) {
  const grid = panelOpen ? GRID_NARROW : GRID_WIDE;

  if (isLoading) {
    return (
      <div role="status" aria-busy="true" aria-label={t("search.loading_label")} className={grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <ResultSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="flex flex-col gap-3 border-2 border-danger bg-danger-bg p-6">
        <h2 className="m-0 font-display text-2xl font-black leading-solid text-danger">
          {t("search.error_title")}
        </h2>
        <p className="m-0 font-bold text-fg">{t("error.generic.unexpected")}</p>
        <p className="m-0 text-fg-muted">{t("search.error_hint")}</p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 border-2 border-border bg-surface-inset p-6 md:p-8">
        <Pictogram name="bed" className="size-12 text-fg" />
        {data && (
          <h2 className="m-0 font-display text-3xl font-black leading-solid">
            {t("search.no_results_title")}
          </h2>
        )}
        <p className="m-0 font-bold text-fg">{t("search.no_results")}</p>
        {data && <p className="m-0 text-fg-muted">{t("search.no_results_hint")}</p>}
        {data && (
          <Button type="button" variant="secondary" onClick={onReset}>
            {t("search.no_results_action")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <ul className={`${grid} m-0 list-none p-0`}>
      {data.data.map((listing) => (
        <li key={listing.id}>
          <ListingCard listing={listing} />
        </li>
      ))}
    </ul>
  );
}
