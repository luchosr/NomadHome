import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { bookingsApi } from "../api/bookings.js";
import { PageWrapper } from "../components/PageWrapper.js";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function HostUpcomingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["host", "upcoming"],
    queryFn: () => bookingsApi.hostUpcoming(),
  });

  if (isLoading) return <p className="text-fg-3">{t("common.action.loading")}</p>;
  if (error || !data) {
    return (
      <p role="alert" className="text-danger">
        {t("error.generic.unexpected")}
      </p>
    );
  }

  return (
    <PageWrapper>
      <h1 className="mb-6 text-2xl font-bold text-fg-1">{t("host.upcoming.title")}</h1>

      {data.length === 0 ? (
        <p className="text-fg-2">{t("host.upcoming.no_bookings")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-muted text-left text-fg-3">
                <th className="pb-2 pr-4 font-medium">{t("host.upcoming.listing_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("host.upcoming.guest_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("host.upcoming.checkin_col")}</th>
                <th className="pb-2 font-medium">{t("host.upcoming.checkout_col")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((booking) => (
                <tr key={booking.id} className="border-b border-muted last:border-0">
                  <td className="py-3 pr-4 text-fg-1">{booking.listing.title}</td>
                  <td className="py-3 pr-4 text-fg-2">{booking.guest.email}</td>
                  <td className="py-3 pr-4 text-fg-2">{formatDate(booking.checkIn)}</td>
                  <td className="py-3 text-fg-2">{formatDate(booking.checkOut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
}
