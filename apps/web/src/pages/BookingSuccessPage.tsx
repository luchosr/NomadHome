import { useSearchParams, Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button } from "@nomadhome/ui";

export function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h1 className="mb-4 text-2xl font-bold text-fg-1">{t("booking.ui.success_title")}</h1>
      <p className="text-fg-2">{t("booking.ui.success_message")}</p>
      {bookingId && <p className="mt-2 text-sm text-fg-muted">#{bookingId}</p>}
      <div className="mt-8">
        <Link to="/bookings">
          <Button>{t("booking.ui.view_bookings")}</Button>
        </Link>
      </div>
    </div>
  );
}
