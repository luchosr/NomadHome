import { t } from "@nomadhome/shared";
import { CancelBookingModal } from "../components/CancelBookingModal.js";
import { ReviewModal } from "../components/ReviewModal.js";
import { PageWrapper } from "../components/PageWrapper.js";
import { BookingCard } from "../components/BookingCard.js";
import { useMyBookings } from "../hooks/useMyBookings.js";

export function MyBookingsPage() {
  const {
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
  } = useMyBookings();

  if (isLoading) {
    return <p className="text-fg-3">{t("common.action.loading")}</p>;
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
        <p className="text-fg-2">{t("booking.dashboard.no_bookings")}</p>
      ) : (
        <div className="space-y-4">
          {data.data.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              checkingOut={checkingOut}
              onCompletePayment={handleCompletePayment}
              onCancel={setCancelBookingId}
              onReview={setReviewBookingId}
            />
          ))}
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
