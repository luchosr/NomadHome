import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { listingsApi } from "../api/listings.js";
import { bookingsApi } from "../api/bookings.js";
import { ApiError } from "../api/client.js";

function computeNights(checkIn: string, checkOut: string): number {
  const [cy, cm, cd] = checkIn.split("-").map(Number);
  const [oy, om, od] = checkOut.split("-").map(Number);
  const inMs = Date.UTC(cy!, cm! - 1, cd!);
  const outMs = Date.UTC(oy!, om! - 1, od!);
  if (isNaN(inMs) || isNaN(outMs)) return 0;
  return Math.max(0, (outMs - inMs) / (1000 * 60 * 60 * 24));
}

function mapBookingError(err: unknown): string {
  if (err instanceof ApiError && err.status === 422) {
    const errorCode =
      err.body !== null && typeof err.body === "object" && !Array.isArray(err.body)
        ? (err.body as { error?: string }).error
        : undefined;
    if (errorCode === "BOOKING_OVERLAP") return t("booking.error.overlap");
    if (errorCode === "SELF_BOOKING") return t("booking.error.self_booking");
  }
  return t("error.generic.unexpected");
}

export function useBookingForm() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";

  const hasDates = checkIn.length > 0 && checkOut.length > 0;

  const {
    data: listing,
    isLoading,
    error: listingError,
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
    mutate: pay,
    isPending,
    error: mutationError,
  } = useMutation({
    mutationFn: async (listingId: string) => {
      const booking = await bookingsApi.create({ listingId, checkIn, checkOut });
      const { url } = await bookingsApi.checkout(booking.id);
      window.location.href = url;
    },
  });

  const handlePayNow = () => {
    if (listing) pay(listing.id);
  };

  return {
    listing: { data: listing, isLoading, error: listingError },
    form: { id, checkIn, checkOut, nights: computeNights(checkIn, checkOut), hasDates },
    action: {
      handlePayNow,
      isSubmitting: isPending,
      serverError: mutationError ? mapBookingError(mutationError) : null,
    },
  };
}
