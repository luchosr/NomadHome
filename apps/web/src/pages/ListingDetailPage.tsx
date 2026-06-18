import { useState, type ChangeEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { listingsApi } from "../api/listings.js";
import { useAuth } from "../contexts/auth.js";
import { ApiError } from "../api/client.js";

function formatRate(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
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

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error instanceof ApiError && error.status === 404) {
    return <p className="text-slate-500">{t("listings.detail.not_found")}</p>;
  }

  if (error || !listing) {
    return (
      <p role="alert" className="text-red-600">
        {t("error.generic.unexpected")}
      </p>
    );
  }

  const sortedPhotos = [...listing.photos].sort((a, b) => a.position - b.position);
  const primaryPhoto = sortedPhotos[0];
  const thumbnails = sortedPhotos.slice(1);

  const isGuest = user?.roles.includes("guest");
  const datesValid = checkIn.length > 0 && checkOut.length > 0 && checkOut > checkIn;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Photo gallery */}
      {primaryPhoto ? (
        <div className="mb-4">
          <img
            src={primaryPhoto.url}
            alt={listing.title}
            className="w-full rounded-xl object-cover"
            style={{ maxHeight: "480px" }}
          />
          {thumbnails.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {thumbnails.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={listing.title}
                  className="h-20 w-32 flex-shrink-0 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 h-64 w-full rounded-xl bg-slate-100" />
      )}

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Main content */}
        <div className="flex-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {listing.type === "PROPERTY" ? "Property" : "Workspace"}
          </span>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{listing.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {listing.city}, {listing.country}
          </p>
          <p className="text-sm text-slate-400">{listing.addressLine}</p>

          <p className="mt-4 leading-relaxed text-slate-700">{listing.description}</p>

          {listing.amenities.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">
                {t("listings.detail.amenities")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((a) => (
                  <span
                    key={a.amenityCode}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                  >
                    {a.amenityCode}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">
              {t("listings.detail.rating")}
            </h2>
            {listing.avgRating !== null ? (
              <p className="text-slate-700">
                ⭐ {listing.avgRating.toFixed(1)} / 5 ({listing._count.reviews}{" "}
                {t("listings.detail.reviews").toLowerCase()})
              </p>
            ) : (
              <p className="text-slate-500">{t("listings.detail.no_reviews")}</p>
            )}
          </div>

          <div className="mt-6">
            <p className="text-sm text-slate-500">
              {t("listings.detail.capacity")}: {listing.capacity} {t("listings.detail.guests")}
            </p>
          </div>
        </div>

        {/* Booking sidebar */}
        <div className="md:w-72">
          <div className="rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-2xl font-bold text-slate-900">
              {formatRate(listing.nightlyRateCents, listing.currency)}
              <span className="text-base font-normal text-slate-500"> {t("search.per_night")}</span>
            </p>

            {isGuest && (
              <div className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="sidebar-checkin"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    {t("booking.ui.checkin_label")}
                  </label>
                  <Input
                    id="sidebar-checkin"
                    type="date"
                    value={checkIn}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setCheckIn(e.target.value);
                      setSearchParams(
                        (prev) => {
                          const next = new URLSearchParams(prev);
                          next.set("checkIn", e.target.value);
                          return next;
                        },
                        { replace: true },
                      );
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="sidebar-checkout"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    {t("booking.ui.checkout_label")}
                  </label>
                  <Input
                    id="sidebar-checkout"
                    type="date"
                    value={checkOut}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setCheckOut(e.target.value);
                      setSearchParams(
                        (prev) => {
                          const next = new URLSearchParams(prev);
                          next.set("checkOut", e.target.value);
                          return next;
                        },
                        { replace: true },
                      );
                    }}
                  />
                </div>

                {datesValid ? (
                  <Link to={`/listings/${listing.id}/book?checkIn=${checkIn}&checkOut=${checkOut}`}>
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
              <div className="mt-4">
                <Link to="/login">
                  <Button variant="secondary" className="w-full">
                    {t("listings.detail.login_to_book")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
