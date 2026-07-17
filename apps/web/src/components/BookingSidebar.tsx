import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button } from "@nomadhome/ui";
import type { BlockedRange } from "../api/listings.js";
import { DateRangePicker } from "./DateRangePicker.js";

interface ListingProps {
  id: string;
  nightlyRateCents: number;
  currency: string;
}

interface Props {
  listing: ListingProps;
  checkIn: string;
  checkOut: string;
  blockedRanges: BlockedRange[];
  datesValid: boolean;
  isGuest: boolean;
  authLoading: boolean;
  user: { id: string } | null | undefined;
  onDateChange: (checkIn: string, checkOut: string) => void;
}

function formatRate(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export function BookingSidebar({
  listing,
  checkIn,
  checkOut,
  blockedRanges,
  datesValid,
  isGuest,
  authLoading,
  user,
  onDateChange,
}: Props) {
  return (
    <div className="md:w-96">
      <div className="rounded-xl border border-slate-200 p-6 shadow-sm">
        <p className="text-2xl font-bold text-slate-900">
          {formatRate(listing.nightlyRateCents, listing.currency)}
          <span className="text-base font-normal text-slate-500"> {t("search.per_night")}</span>
        </p>

        {isGuest && (
          <div className="mt-4 space-y-3">
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              blockedRanges={blockedRanges}
              onChange={onDateChange}
            />

            {datesValid ? (
              <Link to={`/listings/${listing.id}/book?checkIn=${checkIn}&checkOut=${checkOut}`}>
                <Button className="w-full">{t("listings.detail.book_now")}</Button>
              </Link>
            ) : (
              <Button className="w-full" disabled>
                {t("listings.detail.book_now")}
              </Button>
            )}
          </div>
        )}

        {!authLoading && !user && (
          <div className="mt-4">
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                {t("listings.detail.login_to_book")}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
