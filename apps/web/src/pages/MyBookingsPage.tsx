import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Badge, Button, Card } from "@nomadhome/ui";
import { bookingsApi, type BookingWithListing } from "../api/bookings.js";
import { CancelBookingModal } from "../components/CancelBookingModal.js";
import { ReviewModal } from "../components/ReviewModal.js";
import { PageWrapper } from "../components/PageWrapper.js";
import { EmptyState } from "../components/EmptyState.js";
import { formatDate } from "../lib/dates.js";

function statusTone(
  status: BookingWithListing["status"],
): "warning" | "success" | "neutral" | "info" {
  switch (status) {
    case "PENDING_PAYMENT":
      return "warning";
    case "CONFIRMED":
      return "success";
    case "CANCELLED":
      return "neutral";
    case "COMPLETED":
      return "info";
  }
}

function statusLabel(status: BookingWithListing["status"]): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return t("booking.dashboard.status_pending");
    case "CONFIRMED":
      return t("booking.dashboard.status_confirmed");
    case "CANCELLED":
      return t("booking.dashboard.status_cancelled");
    case "COMPLETED":
      return t("booking.dashboard.status_completed");
  }
}

function computeNights(checkIn: string, checkOut: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(
    0,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / msPerDay),
  );
}

export function MyBookingsPage() {
  const queryClient = useQueryClient();
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const handleCompletePayment = async (bookingId: string) => {
    setCheckingOut(bookingId);
    try {
      const { url } = await bookingsApi.checkout(bookingId);
      window.location.href = url;
    } finally {
      setCheckingOut(null);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: () => bookingsApi.listMine(),
  });

  const handleModalSuccess = () => {
    setCancelBookingId(null);
    setReviewBookingId(null);
    void queryClient.invalidateQueries({ queryKey: ["bookings", "me"] });
  };

  if (isLoading) {
    return <p className="text-fg-3">{t("common.loading")}</p>;
  }

  if (error || !data) {
    return (
      <p role="alert" className="text-danger">
        {t("error.generic.unexpected")}
      </p>
    );
  }

  return (
    <PageWrapper>
      <h1 className="mb-6 text-2xl font-bold text-fg-1">{t("booking.dashboard.title")}</h1>

      {data.data.length === 0 ? (
        <EmptyState
          message={t("booking.dashboard.no_bookings")}
          ctaLabel={t("booking.dashboard.no_bookings_cta")}
          ctaTo="/search"
        />
      ) : (
        <div className="space-y-4">
          {data.data.map((booking) => {
            const nights = computeNights(booking.checkIn, booking.checkOut);
            const isCancellable =
              booking.status === "CONFIRMED" && new Date(booking.checkIn) > new Date();

            return (
              <Card key={booking.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <Link
                      to={`/listings/${booking.listingId}`}
                      className="font-semibold text-fg-1 hover:underline"
                    >
                      {booking.listing.title}
                    </Link>
                    <p className="mt-1 text-sm text-fg-2">
                      {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}{" "}
                      <span className="text-fg-muted">
                        ({nights}{" "}
                        {nights === 1
                          ? t("booking.dashboard.night")
                          : t("booking.dashboard.nights")}
                        )
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge>
                    {booking.status === "PENDING_PAYMENT" && (
                      <Button
                        onClick={() => void handleCompletePayment(booking.id)}
                        disabled={checkingOut === booking.id}
                      >
                        {checkingOut === booking.id
                          ? t("common.submitting")
                          : t("booking.dashboard.complete_payment_button")}
                      </Button>
                    )}
                    {isCancellable && (
                      <Button variant="destructive" onClick={() => setCancelBookingId(booking.id)}>
                        {t("booking.dashboard.cancel_button")}
                      </Button>
                    )}
                    {booking.status === "COMPLETED" && (
                      <Button variant="secondary" onClick={() => setReviewBookingId(booking.id)}>
                        {t("booking.dashboard.review_button")}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {cancelBookingId && (
        <CancelBookingModal
          bookingId={cancelBookingId}
          onSuccess={handleModalSuccess}
          onClose={() => setCancelBookingId(null)}
        />
      )}
      {reviewBookingId && (
        <ReviewModal
          bookingId={reviewBookingId}
          onSuccess={handleModalSuccess}
          onClose={() => setReviewBookingId(null)}
        />
      )}
    </PageWrapper>
  );
}
