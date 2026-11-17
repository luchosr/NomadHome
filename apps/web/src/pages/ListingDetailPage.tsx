import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Button, Skeleton } from "@nomadhome/ui";
import { listingsApi } from "../api/listings.js";
import { DateRangePicker } from "../components/DateRangePicker.js";
import { useAuth } from "../contexts/auth.js";
import { ApiError } from "../api/client.js";
import { AMENITIES } from "../lib/listingData.js";

function formatRate(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

const GLYPH_PROPS = {
  viewBox: "0 0 24 24",
  "aria-hidden": true,
  focusable: false,
} as const;

/** Decorative star on a 24 grid: filled ink, mitred joins. The rating text carries the value. */
function StarGlyph() {
  return (
    <svg {...GLYPH_PROPS} className="h-5 w-5 shrink-0 text-fg" fill="currentColor">
      <path
        d="M12 2 15 9 22 9.5 16.5 14.5 18 22 12 18 6 22 7.5 14.5 2 9.5 9 9Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function TypeTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex border-2 border-border bg-surface-raised px-2 py-1 text-xs font-bold uppercase tracking-wide text-fg">
      {children}
    </span>
  );
}

function AmenityTag({ children }: { children: ReactNode }) {
  return (
    <li className="m-0 min-w-0 break-words rounded-sm border-2 border-border bg-surface-raised px-3 py-1 text-sm font-bold text-fg">
      {children}
    </li>
  );
}

const TILE_CLASS = "flex h-12 w-12 shrink-0 items-center justify-center border-2";
const TILE_GLYPH = {
  ...GLYPH_PROPS,
  className: "h-8 w-8",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "square",
  strokeLinejoin: "miter",
} as const;

/** Sign panel for the not-found (paper, ink tile) and error (danger tint, filled tile) states. */
function StatePanel({ variant, message }: { variant: "not-found" | "error"; message: string }) {
  const isError = variant === "error";
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div
        role={isError ? "alert" : undefined}
        className={`mx-auto flex min-w-0 max-w-[36rem] items-start gap-4 rounded-card border-2 border-solid p-6 ${
          isError ? "border-danger bg-danger-bg" : "border-border bg-surface-raised"
        }`}
      >
        <span
          aria-hidden="true"
          className={`${TILE_CLASS} ${
            isError
              ? "border-danger bg-danger text-fg-inverse"
              : "border-border bg-fg text-fg-inverse"
          }`}
        >
          <svg {...TILE_GLYPH}>
            {isError ? <path d="M12 5v9M12 18v1" /> : <path d="M5 5H19V19H5Z" />}
          </svg>
        </span>
        <h1
          className={`m-0 min-w-0 break-words text-2xl leading-tight ${
            isError ? "font-bold text-danger" : "font-black text-fg"
          }`}
        >
          {message}
        </h1>
      </div>
    </div>
  );
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") ?? "");

  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingsApi.getDetail(id!),
    enabled: !!id,
    retry: (failCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failCount < 2;
    },
  });

  const { data: blockedRanges = [] } = useQuery({
    queryKey: ["listing", id, "blocked-dates"],
    queryFn: () => listingsApi.getBlockedDates(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div
        className="mx-auto max-w-6xl px-4 py-8"
        data-testid="listing-detail-skeleton"
        aria-busy="true"
      >
        <Skeleton className="mb-4 h-64 w-full rounded-none sm:h-[480px]" />
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="min-w-0 flex-1 space-y-4">
            <Skeleton className="h-3 w-24 rounded-none" />
            <Skeleton className="h-8 w-2/3 rounded-none" />
            <Skeleton className="h-4 w-40 rounded-none" />
            <Skeleton className="h-20 w-full rounded-none" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-none" />
              <Skeleton className="h-6 w-20 rounded-none" />
              <Skeleton className="h-6 w-16 rounded-none" />
            </div>
          </div>
          <div className="md:w-96 md:shrink-0">
            <div className="rounded-card border-2 border-border p-6">
              <Skeleton className="h-8 w-32 rounded-none" />
              <Skeleton className="mt-4 h-10 w-full rounded-none" />
              <Skeleton className="mt-3 h-10 w-full rounded-none" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return <StatePanel variant="not-found" message={t("listings.detail.not_found")} />;
  }

  if (error || !listing) {
    return <StatePanel variant="error" message={t("error.generic.unexpected")} />;
  }

  const sortedPhotos = [...listing.photos].sort((a, b) => a.position - b.position);
  const primaryPhoto = sortedPhotos[0];
  const thumbnails = sortedPhotos.slice(1);

  const isGuest = user?.roles.includes("guest");
  const datesValid = checkIn.length > 0 && checkOut.length > 0 && checkOut > checkIn;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Photo gallery */}
      {primaryPhoto ? (
        <div className="mb-6">
          <img
            src={primaryPhoto.url}
            alt={listing.title}
            className="w-full rounded-none border-2 border-border object-cover"
            style={{ maxHeight: "480px" }}
          />
          {thumbnails.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {thumbnails.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={listing.title}
                  className="h-16 w-24 shrink-0 rounded-none border-2 border-border object-cover sm:h-20 sm:w-32"
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 h-64 w-full rounded-none border-2 border-dashed border-border bg-stone" />
      )}

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <TypeTag>
            {listing.type === "PROPERTY"
              ? t("host.listings.type_property")
              : t("host.listings.type_workspace")}
          </TypeTag>
          <h1 className="mt-3 text-balance break-words text-3xl font-black leading-[0.95] tracking-[-0.03em] text-fg md:text-5xl">
            {listing.title}
          </h1>
          <div className="mt-4 flex flex-col border-y-2 border-border sm:flex-row">
            <p className="m-0 min-w-0 break-words py-3 text-base font-bold text-fg sm:pr-4">
              {`${listing.city}, ${listing.country}`}
            </p>
            <p className="m-0 min-w-0 break-words border-t-2 border-border py-3 text-sm text-fg-muted sm:border-l-2 sm:border-t-0 sm:pl-4">
              {listing.addressLine}
            </p>
          </div>

          <p className="mt-6 max-w-prose break-words leading-relaxed text-fg-muted">
            {listing.description}
          </p>

          {listing.amenities.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-xl font-black text-fg">{t("listings.detail.amenities")}</h2>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {listing.amenities.map((a) => {
                  const entry = AMENITIES.find((x) => x.code === a.amenityCode);
                  return (
                    <AmenityTag key={a.amenityCode}>
                      {entry ? t(entry.labelKey) : a.amenityCode}
                    </AmenityTag>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <h2 className="mb-2 text-xl font-black text-fg">{t("listings.detail.rating")}</h2>
            {listing.avgRating !== null ? (
              <div className="flex items-center gap-2 text-fg-muted">
                <StarGlyph />
                <p className="m-0 min-w-0">
                  {listing.avgRating.toFixed(1)} / 5 ({listing._count.reviews}{" "}
                  {t("listings.detail.reviews").toLowerCase()})
                </p>
              </div>
            ) : (
              <p className="m-0 text-fg-subtle">{t("listings.detail.no_reviews")}</p>
            )}
          </div>

          <div className="mt-6">
            <p className="text-sm text-fg-subtle">
              {t("listings.detail.capacity")}: {listing.capacity} {t("listings.detail.guests")}
            </p>
          </div>
        </div>

        {/* Booking sidebar */}
        <div className="min-w-0 md:w-96 md:shrink-0">
          <div className="rounded-card border-2 border-border bg-surface-raised md:sticky md:top-24">
            <div className="rounded-t-[2px] border-b-2 border-border bg-ember px-5 py-4 text-fg">
              <span className="text-3xl font-black tabular-nums">
                {formatRate(listing.nightlyRateCents, listing.currency)}
              </span>
              <span className="text-base font-bold"> {t("search.per_night")}</span>
            </div>

            <div className="p-5">
              {isGuest && (
                <div className="space-y-3">
                  <DateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    blockedRanges={blockedRanges}
                    onChange={(newIn, newOut) => {
                      setCheckIn(newIn);
                      setCheckOut(newOut);
                      setSearchParams(
                        (prev) => {
                          const next = new URLSearchParams(prev);
                          if (newIn) next.set("checkIn", newIn);
                          else next.delete("checkIn");
                          if (newOut) next.set("checkOut", newOut);
                          else next.delete("checkOut");
                          return next;
                        },
                        { replace: true },
                      );
                    }}
                  />

                  {datesValid ? (
                    <Link
                      to={`/listings/${listing.id}/book?checkIn=${checkIn}&checkOut=${checkOut}`}
                    >
                      <Button className="w-full">{t("listings.detail.book_now")}</Button>
                    </Link>
                  ) : (
                    <Button className="w-full" disabled>
                      {t("listings.detail.book_now")}
                    </Button>
                  )}
                </div>
              )}

              {!authLoading && !user && (
                <Link to="/login">
                  <Button variant="secondary" className="w-full border-2 ![box-shadow:none]">
                    {t("listings.detail.login_to_book")}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
