import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button } from "@nomadhome/ui";
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

    void poll();
    return () => {
      cancelled = true;
    };
  }, [bookingId, authLoading]);

  const waiting = bookingId && !confirmed && !timedOut;

  if (waiting) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-fg-2">Processing your payment…</p>
      </div>
    );
  }

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
