import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button } from "@nomadhome/ui";
import { ApiError } from "../api/client.js";
import { useBookingForm } from "../hooks/useBookingForm.js";
import { BookingSummaryCard } from "../components/BookingSummaryCard.js";

export function BookingFormPage() {
  const {
    id,
    listing,
    isLoading,
    error,
    hasDates,
    checkIn,
    checkOut,
    nights,
    isSubmitting,
    serverError,
    handlePayNow,
  } = useBookingForm();

  if (!hasDates) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-fg-2">{t("booking.ui.select_dates")}</p>
        <div className="mt-4">
          <Link to={id ? `/listings/${id}` : "/search"}>
            <Button variant="secondary">{t("booking.ui.back_to_listing")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-fg-3">{t("common.action.loading")}</p>;
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <p role="alert" className="text-danger">
        {t("listings.error.not_found")}
      </p>
    );
  }

  if (error || !listing) {
    return (
      <p role="alert" className="text-danger">
        {t("error.generic.unexpected")}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-fg-1">{t("booking.ui.form_title")}</h1>

      <BookingSummaryCard
        title={listing.title}
        checkIn={checkIn}
        checkOut={checkOut}
        nights={nights}
        nightlyRateCents={listing.nightlyRateCents}
        currency={listing.currency}
      />

      {serverError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {serverError}
        </p>
      )}

      <div className="mt-6">
        <Button className="w-full" disabled={isSubmitting} onClick={() => void handlePayNow()}>
          {isSubmitting ? t("common.action.loading") : t("booking.ui.pay_now")}
        </Button>
      </div>

      <div className="mt-4 text-center">
        <Link to={`/listings/${listing.id}`}>
          <Button variant="tertiary">{t("booking.ui.back_to_listing")}</Button>
        </Link>
      </div>
    </div>
  );
}
