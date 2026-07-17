import { t } from "@nomadhome/shared";
import { ApiError } from "../api/client.js";
import { useListingDetail } from "../hooks/useListingDetail.js";
import { ListingGallery } from "../components/ListingGallery.js";
import { BookingSidebar } from "../components/BookingSidebar.js";

export function ListingDetailPage() {
  const {
    listing,
    isLoading,
    error,
    authLoading,
    user,
    isGuest,
    checkIn,
    checkOut,
    blockedRanges,
    datesValid,
    handleDateChange,
    primaryPhoto,
    thumbnails,
  } = useListingDetail();

  if (isLoading) {
    return <p>{t("common.action.loading")}</p>;
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ListingGallery primaryPhoto={primaryPhoto} thumbnails={thumbnails} title={listing.title} />

      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {listing.type === "PROPERTY"
              ? t("host.listings.type_property")
              : t("host.listings.type_workspace")}
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

        <BookingSidebar
          listing={listing}
          checkIn={checkIn}
          checkOut={checkOut}
          blockedRanges={blockedRanges}
          datesValid={datesValid}
          isGuest={isGuest}
          authLoading={authLoading}
          user={user}
          onDateChange={handleDateChange}
        />
      </div>
    </div>
  );
}
