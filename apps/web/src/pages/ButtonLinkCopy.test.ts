import { describe, it, expect, vi, afterEach } from "vitest";
import { t } from "@nomadhome/shared";
import type { LocaleKey } from "@nomadhome/shared";
import listingDetailSource from "./ListingDetailPage.tsx?raw";
import hostListingsSource from "./HostListingsPage.tsx?raw";
import bookingFormSource from "./BookingFormPage.tsx?raw";
import bookingCancelSource from "./BookingCancelPage.tsx?raw";
import bookingSuccessSource from "./BookingSuccessPage.tsx?raw";
import verifyEmailSource from "./VerifyEmailPage.tsx?raw";
import emptyStateSource from "../components/EmptyState.tsx?raw";

// NH-138 task 1.9 (button-link-variants): the CTA migration changes no copy. The literals below are
// the baseline values of every t() key the migrated screens read, captured before the change. This
// whole file is a GUARD: any key rename, addition or removal in those screens fails here.

const BASELINE: Record<string, string> = {
  "booking.ui.back_to_listing": "Back to listing",
  "booking.ui.back_to_search": "Back to search",
  "booking.ui.cancel_message": "Your payment was not completed. No charges were made.",
  "booking.ui.cancel_title": "Payment cancelled",
  "booking.ui.checkin_label": "Check-in",
  "booking.ui.checkout_label": "Check-out",
  "booking.ui.form_title": "Confirm your booking",
  "booking.ui.night": "night",
  "booking.ui.nights": "nights",
  "booking.ui.not_found_message": "Open My bookings to see your reservations.",
  "booking.ui.not_found_title": "We could not find your booking",
  "booking.ui.pay_now": "Pay now",
  "booking.ui.processing": "Processing your payment…",
  "booking.ui.processing_message":
    "We have not confirmed your payment yet. This can take a few minutes, so check My bookings shortly.",
  "booking.ui.processing_title": "Still processing",
  "booking.ui.select_dates": "Select check-in and check-out dates to book.",
  "booking.ui.service_fee": "Service fee",
  "booking.ui.success_message":
    "Your booking is confirmed. You will receive a confirmation email shortly.",
  "booking.ui.success_title": "Booking confirmed!",
  "booking.ui.total": "Total",
  "booking.ui.view_bookings": "View my bookings",
  "common.loading": "Loading…",
  "common.submitting": "…",
  "error.generic.unexpected": "Something went wrong. Please try again.",
  "host.listings.confirmed_booking_plural": "confirmed bookings",
  "host.listings.confirmed_booking_singular": "confirmed booking",
  "host.listings.edit": "Edit",
  "host.listings.new_listing": "New listing",
  "host.listings.no_listings": "You have no listings yet.",
  "host.listings.title": "My Listings",
  "host.listings.type_property": "Property",
  "host.listings.type_workspace": "Workspace",
  "identity.verify_email.error_body":
    "This verification link has already been used or has expired. Please register again.",
  "identity.verify_email.error_cta": "Register",
  "identity.verify_email.error_title": "Link invalid or expired",
  "identity.verify_email.pending": "Verifying your email…",
  "identity.verify_email.success_body": "Your account is confirmed. You can now log in.",
  "identity.verify_email.success_cta": "Log in",
  "identity.verify_email.success_title": "Email verified!",
  "listings.detail.amenities": "Amenities",
  "listings.detail.book_now": "Book now",
  "listings.detail.capacity": "Capacity",
  "listings.detail.guests": "guests",
  "listings.detail.login_to_book": "Log in to book",
  "listings.detail.no_reviews": "No reviews yet.",
  "listings.detail.not_found": "Listing not found.",
  "listings.detail.rating": "Rating",
  "listings.detail.reviews": "Reviews",
  "listings.error.not_found": "Listing not found.",
  "search.per_night": "per night",
};

const SOURCES = [
  listingDetailSource,
  hostListingsSource,
  bookingFormSource,
  bookingCancelSource,
  bookingSuccessSource,
  verifyEmailSource,
  emptyStateSource,
];

function readKeys(): string[] {
  const keys = new Set<string>();
  for (const source of SOURCES) {
    for (const match of source.matchAll(/\bt\(\s*"([a-z0-9_.]+)"/g)) keys.add(match[1] as string);
  }
  return [...keys].sort();
}

describe("button-link-variants copy guard (NH-138)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("t() resolves every baseline literal to the same string", () => {
    for (const [key, value] of Object.entries(BASELINE)) {
      expect(t(key as LocaleKey), key).toBe(value);
    }
  });

  it("the migrated screens read exactly the baseline keys (none added or removed)", () => {
    expect(readKeys()).toEqual(Object.keys(BASELINE).sort());
  });

  it("every key the migrated screens read exists in the dictionary", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const key of readKeys()) {
      expect(t(key as LocaleKey), key).not.toMatch(/^<key-not-found/);
    }
    expect(warn).not.toHaveBeenCalled();
  });
});
