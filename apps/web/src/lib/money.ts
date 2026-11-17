/** Formats integer minor units (cents) in the given ISO currency, without conversion. */
export function formatRate(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
