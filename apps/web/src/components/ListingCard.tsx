import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import type { SearchResultItem } from "@nomadhome/shared";

function formatRate(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export function ListingCard({ listing }: { listing: SearchResultItem }) {
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
    >
      <div className="aspect-video bg-slate-100">
        {listing.primaryPhotoUrl && (
          <img
            src={listing.primaryPhotoUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {listing.type === "PROPERTY" ? "Property" : "Workspace"}
        </span>
        <h3 className="mt-1 font-semibold text-slate-900 group-hover:text-slate-700 truncate">
          {listing.title}
        </h3>
        <p className="text-sm text-slate-500">
          {listing.city}, {listing.country}
        </p>
        <p className="mt-2 font-semibold text-slate-900">
          {formatRate(listing.nightlyRateCents, listing.currency)}
          <span className="font-normal text-slate-500 text-sm"> {t("search.nightly_rate")}</span>
        </p>
      </div>
    </Link>
  );
}
