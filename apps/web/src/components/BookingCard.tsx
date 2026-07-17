import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Badge, Button, Card } from "@nomadhome/ui";
import { type BookingWithListing } from "../api/bookings.js";

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface Props {
  booking: BookingWithListing;
  checkingOut: string | null;
  onCompletePayment: (id: string) => Promise<void>;
  onCancel: (id: string) => void;
  onReview: (id: string) => void;
}

export function BookingCard({
  booking,
  checkingOut,
  onCompletePayment,
  onCancel,
  onReview,
}: Props) {
  const nights = computeNights(booking.checkIn, booking.checkOut);
  const isCancellable = booking.status === "CONFIRMED" && new Date(booking.checkIn) > new Date();

  return (
    <Card>
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
              {nights === 1 ? t("booking.dashboard.night") : t("booking.dashboard.nights")})
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge>
          {booking.status === "PENDING_PAYMENT" && (
            <Button
              onClick={() => void onCompletePayment(booking.id)}
              disabled={checkingOut === booking.id}
            >
              {checkingOut === booking.id
                ? t("common.action.loading")
                : t("booking.dashboard.complete_payment_button")}
            </Button>
          )}
          {isCancellable && (
            <Button variant="destructive" onClick={() => onCancel(booking.id)}>
              {t("booking.dashboard.cancel_button")}
            </Button>
          )}
          {booking.status === "COMPLETED" && (
            <Button variant="secondary" onClick={() => onReview(booking.id)}>
              {t("booking.dashboard.review_button")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
