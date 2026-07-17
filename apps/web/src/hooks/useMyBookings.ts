import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "../api/bookings.js";

export function useMyBookings() {
  const queryClient = useQueryClient();
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: () => bookingsApi.listMine(),
  });

  const handleCompletePayment = async (bookingId: string) => {
    setCheckingOut(bookingId);
    try {
      const { url } = await bookingsApi.checkout(bookingId);
      window.location.href = url;
    } finally {
      setCheckingOut(null);
    }
  };

  const handleModalSuccess = () => {
    setCancelBookingId(null);
    setReviewBookingId(null);
    void queryClient.invalidateQueries({ queryKey: ["bookings", "me"] });
  };

  return {
    data,
    isLoading,
    error,
    cancelBookingId,
    reviewBookingId,
    checkingOut,
    setCancelBookingId,
    setReviewBookingId,
    handleCompletePayment,
    handleModalSuccess,
  };
}
