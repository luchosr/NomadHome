import { t } from "@nomadhome/shared";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function formatRate(cents: number, currency: string): string {
  const locale = navigator.language;
  const key = `${locale}:${currency}`;
  if (!currencyFormatters.has(key)) {
    currencyFormatters.set(key, new Intl.NumberFormat(locale, { style: "currency", currency }));
  }
  return currencyFormatters.get(key)!.format(cents / 100);
}

interface Props {
  title: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  nightlyRateCents: number;
  currency: string;
}

export function BookingSummaryCard({
  title,
  checkIn,
  checkOut,
  nights,
  nightlyRateCents,
  currency,
}: Props) {
  const nightlyRate = formatRate(nightlyRateCents, currency);
  const total = formatRate(nightlyRateCents * nights, currency);

  return (
    <div className="space-y-4 rounded-xl border border-subtle bg-elevated p-6 shadow-sm">
      <p className="text-lg font-semibold text-fg-1">{title}</p>

      <div className="flex justify-between text-sm text-fg-2">
        <span>{t("booking.ui.checkin_label")}</span>
        <span className="font-medium text-fg-1">{checkIn}</span>
      </div>

      <div className="flex justify-between text-sm text-fg-2">
        <span>{t("booking.ui.checkout_label")}</span>
        <span className="font-medium text-fg-1">{checkOut}</span>
      </div>

      <div className="flex justify-between text-sm text-fg-2">
        <span>
          {nightlyRate} &times; {nights}{" "}
          {nights === 1 ? t("booking.ui.night") : t("booking.ui.nights")}
        </span>
        <span className="font-medium text-fg-1">{total}</span>
      </div>

      <div className="flex justify-between border-t border-subtle pt-4">
        <span className="font-semibold text-fg-1">{t("booking.ui.total")}</span>
        <span className="font-bold text-fg-1">{total}</span>
      </div>
    </div>
  );
}
