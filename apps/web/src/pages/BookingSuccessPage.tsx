import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Skeleton, buttonVariants, cn } from "@nomadhome/ui";
import { bookingsApi } from "../api/bookings.js";
import { useAuth } from "../contexts/auth.js";

const POLL_MS = 2000;
const TIMEOUT_MS = 30_000;

export function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const { isLoading: authLoading } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!bookingId || authLoading) return;

    let cancelled = false;
    const deadline = Date.now() + TIMEOUT_MS;

    const poll = async () => {
      if (cancelled) return;
      try {
        const booking = await bookingsApi.getById(bookingId);
        if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
          if (!cancelled) setConfirmed(true);
          return;
        }
      } catch {
        // auth not ready yet or transient error — keep trying
      }
      if (Date.now() >= deadline) {
        if (!cancelled) setTimedOut(true);
        return;
      }
      setTimeout(() => void poll(), POLL_MS);
    };

    // Sync payment status directly with Stripe before polling — covers cases
    // where the webhook hasn't arrived yet or is misconfigured.
    const start = async () => {
      try {
        await bookingsApi.syncPayment(bookingId);
      } catch {
        // non-fatal — fall through to polling
      }
      void poll();
    };

    void start();
    return () => {
      cancelled = true;
    };
  }, [bookingId, authLoading]);

  const waiting = bookingId && !confirmed && !timedOut;

  if (waiting) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div
          role="status"
          aria-busy="true"
          className="border-2 border-dashed border-border bg-surface-inset p-6 text-fg md:p-8"
        >
          <p className="m-0 mb-6 text-base font-bold">{t("booking.ui.processing")}</p>
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3 rounded-none bg-ink/10" />
            <Skeleton className="h-4 w-1/2 rounded-none bg-ink/10" />
            <Skeleton className="h-4 w-1/3 rounded-none bg-ink/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-card border-2 border-border bg-ember text-fg">
        <div className="p-6 md:p-8">
          <span
            aria-hidden="true"
            className="mb-5 flex h-16 w-16 shrink-0 items-center justify-center border-2 border-border bg-ink text-fg-inverse"
          >
            <svg
              viewBox="0 0 32 32"
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="square"
              strokeLinejoin="miter"
              focusable={false}
            >
              <path d="M6 17 13 24 26 8" />
            </svg>
          </span>
          <h1 className="m-0 mb-3 break-words text-3xl font-black leading-[0.95] tracking-[-0.03em] text-fg">
            {t("booking.ui.success_title")}
          </h1>
          <p className="m-0 break-words text-base font-medium text-fg">
            {t("booking.ui.success_message")}
          </p>
          {bookingId && (
            <p className="m-0 mt-3 break-words text-sm font-bold text-fg">#{bookingId}</p>
          )}
        </div>
        <div className="rounded-b-[2px] border-t-2 border-border bg-surface-raised p-4 md:px-8">
          <Link
            to="/bookings"
            className={cn(buttonVariants({ variant: "primary" }), "w-full sm:w-auto")}
          >
            {t("booking.ui.view_bookings")}
          </Link>
        </div>
      </div>
    </div>
  );
}
