import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Badge } from "@nomadhome/ui";
import { bookingsApi, type HostBooking } from "../api/bookings.js";
import { PageWrapper } from "../components/PageWrapper.js";
import { EmptyState } from "../components/EmptyState.js";
import { formatDate } from "../lib/dates.js";

function statusTone(status: HostBooking["status"]): "warning" | "success" | "neutral" | "info" {
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

function statusLabel(status: HostBooking["status"]): string {
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

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function HostUpcomingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["host", "all-bookings"],
    queryFn: () => bookingsApi.hostAll(),
  });

  if (isLoading) return <p className="text-fg-3">{t("common.loading")}</p>;
  if (error || !data) {
    return (
      <p role="alert" className="text-danger">
        {t("error.generic.unexpected")}
      </p>
    );
  }

  return (
    <PageWrapper>
      <h1 className="mb-6 text-2xl font-bold text-fg-1">{t("host.bookings.title")}</h1>

      {data.length === 0 ? (
        <EmptyState
          message={t("host.bookings.no_bookings")}
          ctaLabel={t("host.bookings.no_bookings_cta")}
          ctaTo="/host/listings"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-muted text-left text-fg-3">
                <th className="pb-2 pr-4 font-medium">{t("host.bookings.listing_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("host.bookings.guest_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("host.bookings.checkin_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("host.bookings.checkout_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("host.bookings.status_col")}</th>
                <th className="pb-2 font-medium">{t("host.bookings.amount_col")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((booking) => (
                <tr key={booking.id} className="border-b border-muted last:border-0">
                  <td className="py-3 pr-4 text-fg-1">{booking.listing.title}</td>
                  <td className="py-3 pr-4 text-fg-2">{booking.guest.email}</td>
                  <td className="py-3 pr-4 text-fg-2">{formatDate(booking.checkIn)}</td>
                  <td className="py-3 pr-4 text-fg-2">{formatDate(booking.checkOut)}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge>
                  </td>
                  <td className="py-3 text-fg-2">
                    {formatAmount(booking.totalCents, booking.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
}
