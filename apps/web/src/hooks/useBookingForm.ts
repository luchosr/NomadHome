import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { listingsApi } from "../api/listings.js";
import { bookingsApi } from "../api/bookings.js";
import { ApiError } from "../api/client.js";

function computeNights(checkIn: string, checkOut: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (isNaN(diff)) return 0;
  return Math.max(0, Math.round(diff / msPerDay));
}

export function useBookingForm() {
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

  const nights = computeNights(checkIn, checkOut);

  const handlePayNow = async () => {
    if (!listing) return;
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
      if (err instanceof ApiError && err.status === 422) {
        const errorCode =
          err.body !== null && typeof err.body === "object" && !Array.isArray(err.body)
            ? (err.body as { error?: string }).error
            : undefined;
        if (errorCode === "BOOKING_OVERLAP") {
          setServerError(t("booking.error.overlap"));
        } else if (errorCode === "SELF_BOOKING") {
          setServerError(t("booking.error.self_booking"));
        } else {
          setServerError(t("error.generic.unexpected"));
        }
      } else {
        setServerError(t("error.generic.unexpected"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}
