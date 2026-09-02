import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Button } from "@nomadhome/ui";
import { listingsApi } from "../api/listings.js";
import { bookingsApi } from "../api/bookings.js";
import { ApiError, getDisplayMessage } from "../api/client.js";

function formatRate(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function computeNights(checkIn: string, checkOut: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (isNaN(diff)) return 0;
  return Math.max(0, Math.round(diff / msPerDay));
}

export function BookingFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const hasDates = checkIn.length > 0 && checkOut.length > 0;

  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingsApi.getDetail(id!),
    enabled: !!id && hasDates,
    retry: (failCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failCount < 2;
    },
  });

  const {
    data: quote,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = useQuery({
    queryKey: ["booking-quote", id, checkIn, checkOut],
    queryFn: () => bookingsApi.quote(id!, checkIn, checkOut),
    enabled: !!id && hasDates,
    retry: (failCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failCount < 2;
    },
  });

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
    return <p className="text-fg-3">{t("common.loading")}</p>;
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

  if (quoteError) {
    return (
      <p role="alert" className="text-danger">
        {t("error.generic.unexpected")}
      </p>
    );
  }

  const nights = computeNights(checkIn, checkOut);
  const nightlyRate = formatRate(listing.nightlyRateCents, listing.currency);
  const subtotal = quote ? formatRate(quote.subtotalCents, quote.currency) : t("common.loading");
  const serviceFee = quote
    ? formatRate(quote.guestServiceFeeCents, quote.currency)
    : t("common.loading");
  const total = quote ? formatRate(quote.totalChargedCents, quote.currency) : t("common.loading");

  const handlePayNow = async () => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const booking = await bookingsApi.create({
        listingId: listing.id,
        checkIn,
        checkOut,
      });
      const { url } = await bookingsApi.checkout(booking.id);
      window.location.href = url;
    } catch (err) {
      setServerError(getDisplayMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-fg-1">{t("booking.ui.form_title")}</h1>

      <div className="space-y-4 rounded-xl border border-subtle bg-elevated p-6 shadow-sm">
        <p className="text-lg font-semibold text-fg-1">{listing.title}</p>

        <div className="flex justify-between text-sm text-fg-2">
          <span>{t("booking.ui.checkin_label")}</span>
          <span className="font-medium text-fg-1">{checkIn}</span>
        </div>

        <div className="flex justify-between text-sm text-fg-2">
          <span>{t("booking.ui.checkout_label")}</span>
          <span className="font-medium text-fg-1">{checkOut}</span>
        </div>

        <div className="flex justify-between text-sm text-fg-2">
          <span>
            {nightlyRate} &times; {nights}{" "}
            {nights === 1 ? t("booking.ui.night") : t("booking.ui.nights")}
          </span>
          <span className="font-medium text-fg-1">{subtotal}</span>
        </div>

        <div className="flex justify-between text-sm text-fg-2">
          <span>{t("booking.ui.service_fee")}</span>
          <span className="font-medium text-fg-1">{serviceFee}</span>
        </div>

        <div className="flex justify-between border-t border-subtle pt-4">
          <span className="font-semibold text-fg-1">{t("booking.ui.total")}</span>
          <span className="font-bold text-fg-1">{total}</span>
        </div>
      </div>

      {serverError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {serverError}
        </p>
      )}

      <div className="mt-6">
        <Button
          className="w-full"
          disabled={isSubmitting || isQuoteLoading || !quote}
          onClick={() => void handlePayNow()}
        >
          {isSubmitting ? t("common.submitting") : t("booking.ui.pay_now")}
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
