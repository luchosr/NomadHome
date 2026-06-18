import { useSearchParams, Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button } from "@nomadhome/ui";

export function BookingCancelPage() {
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get("listingId");

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h1 className="mb-4 text-2xl font-bold text-fg-1">{t("booking.ui.cancel_title")}</h1>
      <p className="text-fg-2">{t("booking.ui.cancel_message")}</p>
      <div className="mt-8">
        {listingId ? (
          <Link to={`/listings/${listingId}`}>
            <Button variant="secondary">{t("booking.ui.back_to_listing")}</Button>
          </Link>
        ) : (
          <Link to="/search">
            <Button variant="secondary">{t("booking.ui.back_to_search")}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
