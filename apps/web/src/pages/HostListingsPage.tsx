import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Pictogram, Skeleton } from "@nomadhome/ui";
import { hostApi } from "../api/host.js";
import { ListingStatusTag } from "../components/ListingStatusTag.js";
import { PageWrapper } from "../components/PageWrapper.js";

// Links styled as the primary and secondary Button variants, so a CTA is one interactive element
// instead of a Button nested in a Link. Issue #138 tracks a shared solution in the Button primitive.
const CTA_BASE =
  "inline-flex min-h-11 items-center justify-center rounded-sm border-2 px-[22px] py-[14px] text-sm font-bold no-underline transition-colors duration-med ease-out active:translate-y-px";
const PRIMARY_CTA = `${CTA_BASE} border-border bg-action text-action-fg hover:bg-action-hover`;
const SECONDARY_CTA = `${CTA_BASE} border-border bg-transparent text-fg hover:bg-surface-inset`;

function StatePanel({ children }: { children: string }) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-w-0 max-w-[36rem] items-start gap-4 rounded-card border-2 border-solid border-danger bg-danger-bg p-6"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-danger bg-danger text-fg-inverse"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="square"
          strokeLinejoin="miter"
          focusable={false}
        >
          <path d="M12 5v9M12 18v1" />
        </svg>
      </span>
      <h1 className="m-0 min-w-0 break-words text-2xl font-bold leading-tight text-danger">
        {children}
      </h1>
    </div>
  );
}

export function HostListingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["host", "listings"],
    queryFn: () => hostApi.listMine(),
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <div aria-busy="true">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-2 border-border bg-surface-raised p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 items-center gap-4">
                    <Skeleton className="h-16 w-16 shrink-0 rounded-none" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-11 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !data) {
    return (
      <PageWrapper>
        <StatePanel>{t("error.generic.unexpected")}</StatePanel>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="m-0 text-3xl font-black leading-solid text-fg md:text-4xl">
          {t("host.listings.title")}
        </h1>
        <Link to="/host/listings/new" className={`${PRIMARY_CTA} w-full sm:w-auto`}>
          {t("host.listings.new_listing")}
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="rounded-card border-2 border-dashed border-border bg-surface-raised px-6 py-12">
          <p className="m-0 text-fg-muted">{t("host.listings.no_listings")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((listing) => (
            <div
              key={listing.id}
              className="rounded-card border-2 border-border bg-surface-raised p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-none border-2 border-border bg-surface-inset">
                    {listing.primaryPhotoUrl ? (
                      <img
                        src={listing.primaryPhotoUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Pictogram
                        name={listing.type === "PROPERTY" ? "bed" : "desk"}
                        className="h-8 w-8 text-fg"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="m-0 break-words font-bold text-fg">{listing.title}</p>
                    <p className="m-0 mt-1 break-words text-sm text-fg-muted">
                      {listing.type === "PROPERTY"
                        ? t("host.listings.type_property")
                        : t("host.listings.type_workspace")}
                      {" · "}
                      {listing.city}, {listing.country}
                    </p>
                    {(listing._count?.bookings ?? 0) > 0 && (
                      <p className="m-0 mt-1 text-sm font-bold text-success">
                        {listing._count?.bookings}{" "}
                        {listing._count?.bookings === 1
                          ? t("host.listings.confirmed_booking_singular")
                          : t("host.listings.confirmed_booking_plural")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <ListingStatusTag status={listing.status} />
                  <Link to={`/host/listings/${listing.id}/edit`} className={SECONDARY_CTA}>
                    {t("host.listings.edit")}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
