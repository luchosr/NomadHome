import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Button, Skeleton } from "@nomadhome/ui";
import { bookingsApi, type BookingWithListing } from "../api/bookings.js";
import { CancelBookingModal } from "../components/CancelBookingModal.js";
import { ReviewModal } from "../components/ReviewModal.js";
import { PageWrapper } from "../components/PageWrapper.js";
import { EmptyState } from "../components/EmptyState.js";
import { formatDate } from "../lib/dates.js";

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

const TAG_SHAPE: Record<BookingWithListing["status"], string> = {
  PENDING_PAYMENT: "border-dashed border-border text-fg",
  CONFIRMED: "border-solid border-border text-fg",
  CANCELLED: "border-solid border-border-muted text-fg-muted line-through",
  COMPLETED: "border-solid border-border text-fg",
};

/** Status as shape plus text: dashed (tentative), solid, struck through (gone), solid with a marker (done). */
function StatusTag({ status }: { status: BookingWithListing["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-sm border-2 bg-surface-raised px-2 py-1 text-xs font-bold ${TAG_SHAPE[status]}`}
    >
      {status === "COMPLETED" && <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-ink" />}
      {statusLabel(status)}
    </span>
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
    return (
      <PageWrapper>
        <div aria-busy="true">
          <Skeleton className="mb-6 h-8 w-52" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-2 border-border bg-surface-raised p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-11 w-24" />
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
            {t("error.generic.unexpected")}
          </h1>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <h1 className="m-0 mb-6 text-3xl font-black leading-solid text-fg md:text-4xl">
        {t("booking.dashboard.title")}
      </h1>

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
              <div
                key={booking.id}
                className="rounded-card border-2 border-border bg-surface-raised p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/listings/${booking.listingId}`}
                      className="break-words font-bold text-fg hover:underline"
                    >
                      {booking.listing.title}
                    </Link>
                    <p className="m-0 mt-1 text-sm text-fg-muted">
                      {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}{" "}
                      <span className="text-fg-subtle">
                        ({nights}{" "}
                        {nights === 1
                          ? t("booking.dashboard.night")
                          : t("booking.dashboard.nights")}
                        )
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusTag status={booking.status} />
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
              </div>
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
