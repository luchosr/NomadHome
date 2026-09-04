import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import type { SearchResultItem } from "@nomadhome/shared";
import { Card } from "@nomadhome/ui";

function formatRate(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export function ListingCard({ listing }: { listing: SearchResultItem }) {
  return (
    <Link to={`/listings/${listing.id}`} className="block">
      <Card interactive className="overflow-hidden p-0">
        <div className="aspect-video bg-inset">
          {listing.primaryPhotoUrl && (
            <img
              src={listing.primaryPhotoUrl}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-fg-3">
            {listing.type === "PROPERTY"
              ? t("host.listings.type_property")
              : t("host.listings.type_workspace")}
          </span>
          <h3 className="mt-1 line-clamp-2 font-semibold text-fg-1">{listing.title}</h3>
          <p className="text-sm text-fg-3">
            {listing.city}, {listing.country}
          </p>
          <p className="mt-2 font-semibold text-fg-1">
            {formatRate(listing.nightlyRateCents, listing.currency)}
            <span className="text-sm font-normal text-fg-3"> {t("search.nightly_rate")}</span>
          </p>
        </div>
      </Card>
    </Link>
  );
}
