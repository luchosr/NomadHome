import { useState, type ReactNode } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Button, Skeleton } from "@nomadhome/ui";
import { listingsApi } from "../api/listings.js";
import { bookingsApi } from "../api/bookings.js";
import { ApiError, getDisplayMessage } from "../api/client.js";
import { ServerErrorAlert } from "../components/ServerErrorAlert.js";

// Links styled as the Button variants, so an action is one interactive element instead of a Button
// nested in a Link. Issue #138 tracks a shared solution in the Button primitive.
const CTA_BASE =
  "inline-flex min-h-11 items-center justify-center rounded-sm border-2 px-[22px] py-[14px] text-sm font-bold no-underline transition-colors duration-med ease-out active:translate-y-px";
const SECONDARY_CTA = `${CTA_BASE} border-border bg-transparent text-fg hover:bg-surface-inset`;
const TERTIARY_CTA =
  "inline-flex min-h-11 items-center justify-center px-2 text-sm font-bold text-fg underline underline-offset-4 hover:no-underline";

const TILE_CLASS = "flex h-12 w-12 shrink-0 items-center justify-center border-2";
const TILE_GLYPH = {
  viewBox: "0 0 24 24",
  "aria-hidden": true,
  focusable: false,
  className: "h-8 w-8",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "square",
  strokeLinejoin: "miter",
} as const;

/** Sign panel for the page states: paper with an ink tile (dates), danger tint with a filled tile (errors). */
function StatePanel({
  variant,
  message,
  action,
}: {
  variant: "info" | "error";
  message: string;
  action?: ReactNode;
}) {
  const isError = variant === "error";
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div
        role={isError ? "alert" : undefined}
        className={`mx-auto flex min-w-0 max-w-[36rem] flex-col items-start gap-5 rounded-card border-2 border-solid p-6 ${
          isError ? "border-danger bg-danger-bg" : "border-border bg-surface-raised"
        }`}
      >
        <span
          aria-hidden="true"
          className={`${TILE_CLASS} ${
            isError
              ? "border-danger bg-danger text-fg-inverse"
              : "border-border bg-fg text-fg-inverse"
          }`}
        >
          <svg {...TILE_GLYPH}>
            {isError ? <path d="M12 5v9M12 18v1" /> : <path d="M4 6H20V20H4ZM4 11H20" />}
          </svg>
        </span>
        <h1
          className={`m-0 min-w-0 break-words text-2xl leading-tight ${
            isError ? "font-bold text-danger" : "font-black text-fg"
          }`}
        >
          {message}
        </h1>
        {action}
      </div>
    </div>
  );
}

function formatRate(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function computeNights(checkIn: string, checkOut: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (isNaN(diff)) return 0;
  return Math.max(0, Math.round(diff / msPerDay));
}

export function BookingFormPage() {
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

  const {
    data: quote,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = useQuery({
    queryKey: ["booking-quote", id, checkIn, checkOut],
    queryFn: () => bookingsApi.quote(id!, checkIn, checkOut),
    enabled: !!id && hasDates,
    retry: (failCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failCount < 2;
    },
  });

  if (!hasDates) {
    return (
      <StatePanel
        variant="info"
        message={t("booking.ui.select_dates")}
        action={
          <Link to={id ? `/listings/${id}` : "/search"} className={SECONDARY_CTA}>
            {t("booking.ui.back_to_listing")}
          </Link>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div aria-busy="true" className="mx-auto max-w-xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48 rounded-none" />
        <div className="border-2 border-border bg-surface-raised">
          <div className="space-y-4 p-4 sm:p-5">
            <Skeleton className="h-40 w-full rounded-none" />
            <Skeleton className="h-5 w-2/3 rounded-none" />
            <Skeleton className="h-4 w-1/3 rounded-none" />
            <Skeleton className="h-4 w-full rounded-none" />
            <Skeleton className="h-4 w-full rounded-none" />
            <Skeleton className="h-4 w-full rounded-none" />
          </div>
          <Skeleton className="h-14 w-full rounded-none" />
        </div>
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return <StatePanel variant="error" message={t("listings.error.not_found")} />;
  }

  if (error || !listing) {
    return <StatePanel variant="error" message={t("error.generic.unexpected")} />;
  }

  if (quoteError) {
    return <StatePanel variant="error" message={t("error.generic.unexpected")} />;
  }

  const nights = computeNights(checkIn, checkOut);
  const nightlyRate = formatRate(listing.nightlyRateCents, listing.currency);
  const subtotal = quote ? formatRate(quote.subtotalCents, quote.currency) : t("common.loading");
  const serviceFee = quote
    ? formatRate(quote.guestServiceFeeCents, quote.currency)
    : t("common.loading");
  const total = quote ? formatRate(quote.totalChargedCents, quote.currency) : t("common.loading");

  const handlePayNow = async () => {
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
      setServerError(getDisplayMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedPhotos = [...(listing.photos ?? [])].sort((a, b) => a.position - b.position);
  const primaryPhoto = sortedPhotos[0];

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="m-0 mb-6 text-3xl font-black leading-solid text-fg md:text-4xl">
        {t("booking.ui.form_title")}
      </h1>

      <div className="rounded-card border-2 border-border bg-surface-raised">
        <div className="space-y-4 p-4 sm:p-5">
          {primaryPhoto && (
            <img
              src={primaryPhoto.url}
              alt={listing.title}
              className="h-40 w-full rounded-none border-2 border-border object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="m-0 break-words text-lg font-bold text-fg">{listing.title}</p>
            <p className="m-0 break-words text-sm text-fg-muted">
              {listing.city}, {listing.country}
            </p>
          </div>

          <div className="flex justify-between gap-4 text-sm text-fg-muted">
            <span>{t("booking.ui.checkin_label")}</span>
            <span className="font-medium text-fg">{checkIn}</span>
          </div>

          <div className="flex justify-between gap-4 text-sm text-fg-muted">
            <span>{t("booking.ui.checkout_label")}</span>
            <span className="font-medium text-fg">{checkOut}</span>
          </div>

          <div className="flex justify-between gap-4 text-sm text-fg-muted">
            <span className="min-w-0 break-words">
              {nightlyRate} &times; {nights}{" "}
              {nights === 1 ? t("booking.ui.night") : t("booking.ui.nights")}
            </span>
            <span className="font-medium text-fg">{subtotal}</span>
          </div>

          <div className="flex justify-between gap-4 text-sm text-fg-muted">
            <span>{t("booking.ui.service_fee")}</span>
            <span className="font-medium text-fg">{serviceFee}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-b-[2px] border-t-2 border-border bg-ember px-4 py-4 text-fg sm:px-5">
          <span className="text-base font-bold">{t("booking.ui.total")}</span>
          <span className="min-w-0 break-words text-2xl font-black tabular-nums">{total}</span>
        </div>
      </div>

      <ServerErrorAlert error={serverError} className="mt-4" />

      <div className="mt-6">
        <Button
          className="w-full"
          disabled={isSubmitting || isQuoteLoading || !quote}
          onClick={() => void handlePayNow()}
        >
          {isSubmitting ? t("common.submitting") : t("booking.ui.pay_now")}
        </Button>
      </div>

      <div className="mt-4 flex justify-center">
        <Link to={`/listings/${listing.id}`} className={TERTIARY_CTA}>
          {t("booking.ui.back_to_listing")}
        </Link>
      </div>
    </div>
  );
}
