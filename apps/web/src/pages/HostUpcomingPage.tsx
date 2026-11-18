import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Skeleton } from "@nomadhome/ui";
import { bookingsApi, type HostBooking } from "../api/bookings.js";
import { PageWrapper } from "../components/PageWrapper.js";
import { EmptyState } from "../components/EmptyState.js";
import { formatDate } from "../lib/dates.js";

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

const TAG_SHAPE: Record<HostBooking["status"], string> = {
  PENDING_PAYMENT: "border-dashed border-border text-fg",
  CONFIRMED: "border-solid border-border text-fg",
  CANCELLED: "border-solid border-border-muted text-fg-muted line-through",
  COMPLETED: "border-solid border-border text-fg",
};

/** Status as shape plus text: dashed (tentative), solid, struck through (gone), solid with a marker (done). */
function StatusTag({ status }: { status: HostBooking["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-sm border-2 bg-surface-raised px-2 py-1 text-xs font-bold ${TAG_SHAPE[status]}`}
    >
      {status === "COMPLETED" && <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-ink" />}
      {statusLabel(status)}
    </span>
  );
}

function StatePanel({ children }: { children: string }) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-w-0 max-w-[36rem] items-start gap-4 rounded-card border-2 border-solid border-danger bg-danger-bg p-6"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-danger bg-danger text-fg-inverse"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="square"
          strokeLinejoin="miter"
          focusable={false}
        >
          <path d="M12 5v9M12 18v1" />
        </svg>
      </span>
      <h1 className="m-0 min-w-0 break-words text-2xl font-bold leading-tight text-danger">
        {children}
      </h1>
    </div>
  );
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

  if (isLoading) {
    return (
      <PageWrapper>
        <div aria-busy="true">
          <Skeleton className="mb-6 h-8 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border-muted pb-3">
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }
  if (error || !data) {
    return (
      <PageWrapper>
        <StatePanel>{t("error.generic.unexpected")}</StatePanel>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <h1 className="m-0 mb-6 text-3xl font-black leading-solid text-fg md:text-4xl">
        {t("host.bookings.title")}
      </h1>

      {data.length === 0 ? (
        <EmptyState
          message={t("host.bookings.no_bookings")}
          ctaLabel={t("host.bookings.no_bookings_cta")}
          ctaTo="/host/listings"
        />
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-4 p-0 sm:hidden">
            {data.map((booking) => (
              <li
                key={booking.id}
                className="min-w-0 rounded-card border-2 border-border bg-surface-raised p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="m-0 min-w-0 break-words font-bold text-fg">
                    {booking.listing.title}
                  </p>
                  <StatusTag status={booking.status} />
                </div>
                <dl className="m-0 mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="col-span-2 min-w-0">
                    <dt className="font-bold text-fg">{t("host.bookings.guest_col")}</dt>
                    <dd className="m-0 break-all text-fg-muted">{booking.guest.email}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="font-bold text-fg">{t("host.bookings.checkin_col")}</dt>
                    <dd className="m-0 text-fg-muted">{formatDate(booking.checkIn)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="font-bold text-fg">{t("host.bookings.checkout_col")}</dt>
                    <dd className="m-0 text-fg-muted">{formatDate(booking.checkOut)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-bold text-fg">{t("host.bookings.amount_col")}</dt>
                    <dd className="m-0 tabular-nums text-fg-muted">
                      {formatAmount(booking.totalCents, booking.currency)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border text-left">
                  <th className="pb-2 pr-4 font-bold text-fg">{t("host.bookings.listing_col")}</th>
                  <th className="pb-2 pr-4 font-bold text-fg">{t("host.bookings.guest_col")}</th>
                  <th className="pb-2 pr-4 font-bold text-fg">{t("host.bookings.checkin_col")}</th>
                  <th className="pb-2 pr-4 font-bold text-fg">{t("host.bookings.checkout_col")}</th>
                  <th className="pb-2 pr-4 font-bold text-fg">{t("host.bookings.status_col")}</th>
                  <th className="pb-2 font-bold text-fg">{t("host.bookings.amount_col")}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((booking) => (
                  <tr key={booking.id} className="border-b border-border-muted last:border-0">
                    <td className="py-3 pr-4 text-fg">{booking.listing.title}</td>
                    <td className="py-3 pr-4 text-fg-muted">{booking.guest.email}</td>
                    <td className="py-3 pr-4 text-fg-muted">{formatDate(booking.checkIn)}</td>
                    <td className="py-3 pr-4 text-fg-muted">{formatDate(booking.checkOut)}</td>
                    <td className="py-3 pr-4">
                      <StatusTag status={booking.status} />
                    </td>
                    <td className="py-3 tabular-nums text-fg-muted">
                      {formatAmount(booking.totalCents, booking.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
