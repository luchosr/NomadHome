import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import type { SearchResultItem } from "@nomadhome/shared";
import { Badge, Pictogram } from "@nomadhome/ui";
import { AMENITY_OPTIONS } from "../lib/searchData.js";

const MAX_AMENITIES = 3;

function formatRate(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

/** Amenity codes to labels through t(); unknown codes are skipped, never rendered raw. */
function amenityLabels(codes: readonly string[] | undefined): string[] {
  if (!codes) return [];
  return codes
    .flatMap((code) => {
      const option = AMENITY_OPTIONS.find((o) => o.code === code);
      return option ? [t(option.labelKey)] : [];
    })
    .slice(0, MAX_AMENITIES);
}

/**
 * Sign-panel result card. Fixed anatomy so cards compare at a glance:
 * photo, type, title, city, nightly price, amenities.
 */
export function ListingCard({ listing }: { listing: SearchResultItem }) {
  const labels = amenityLabels(listing.amenities);
  const isProperty = listing.type === "PROPERTY";

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex h-full flex-col border-2 border-border bg-surface text-fg no-underline transition-colors duration-med ease-out hover:bg-signal focus-visible:bg-signal"
    >
      <div className="relative aspect-[4/3] border-b-2 border-border bg-surface-inset">
        {listing.primaryPhotoUrl ? (
          <img
            src={listing.primaryPhotoUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-fg-subtle">
            <Pictogram name={isProperty ? "bed" : "desk"} className="size-16" />
          </div>
        )}
        <Badge
          tone="accent"
          className="absolute left-0 top-0 rounded-none border-0 border-b-2 border-r-2"
        >
          {isProperty ? t("host.listings.type_property") : t("host.listings.type_workspace")}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="m-0 line-clamp-2 font-display text-lg font-black leading-snug group-hover:underline group-hover:underline-offset-4">
            {listing.title}
          </h3>
          <p className="m-0 mt-1 text-sm font-medium text-fg-muted">
            {listing.city}, {listing.country}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <p className="m-0 flex min-w-0 flex-wrap items-baseline gap-x-2">
            <span className="text-3xl font-black leading-none tabular-nums">
              {formatRate(listing.nightlyRateCents, listing.currency)}
            </span>
            <span className="text-sm font-bold text-fg-muted">{t("search.nightly_rate")}</span>
          </p>
          {labels.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 border-t-2 border-border p-0 pt-3 text-sm font-bold">
              {labels.map((label) => (
                <li key={label} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2 bg-fg" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Link>
  );
}
