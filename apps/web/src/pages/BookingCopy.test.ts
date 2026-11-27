import { describe, it, expect, vi, afterEach } from "vitest";
import { en, t } from "@nomadhome/shared";
import type { LocaleKey } from "@nomadhome/shared";
import formSource from "./BookingFormPage.tsx?raw";
import successSource from "./BookingSuccessPage.tsx?raw";
import cancelSource from "./BookingCancelPage.tsx?raw";
import myBookingsSource from "./MyBookingsPage.tsx?raw";
import cancelModalSource from "../components/CancelBookingModal.tsx?raw";
import reviewModalSource from "../components/ReviewModal.tsx?raw";
import modalSource from "../components/Modal.tsx?raw";
import emptyStateSource from "../components/EmptyState.tsx?raw";

// NH-124 task 1.12 (booking-payment-identity D11): the restyle changes no copy. The literals below
// are the baseline values captured before the change, extended in NH-146 with the four new
// booking.ui keys, and with booking.ui.star_one / star_other for the review star names.
// Any key rename or string edit fails here.

const BOOKING_UI = {
  form_title: "Confirm your booking",
  checkin_label: "Check-in",
  checkout_label: "Check-out",
  nights: "nights",
  night: "night",
  nightly_rate: "per night",
  service_fee: "Service fee",
  total: "Total",
  pay_now: "Pay now",
  select_dates: "Select check-in and check-out dates to book.",
  back_to_listing: "Back to listing",
  success_title: "Booking confirmed!",
  success_message: "Your booking is confirmed. You will receive a confirmation email shortly.",
  view_bookings: "View my bookings",
  cancel_title: "Payment cancelled",
  cancel_message: "Your payment was not completed. No charges were made.",
  back_to_search: "Back to search",
  processing: "Processing your payment…",
  // NH-146 (booking-admin-error-states): neutral states for the success page.
  processing_title: "Still processing",
  processing_message:
    "We have not confirmed your payment yet. This can take a few minutes, so check My bookings shortly.",
  not_found_title: "We could not find your booking",
  not_found_message: "Open My bookings to see your reservations.",
  star_one: "star",
  star_other: "stars",
};

const BOOKING_DASHBOARD = {
  title: "My Bookings",
  no_bookings: "You have no bookings yet.",
  no_bookings_cta: "Browse listings",
  status_pending: "Pending Payment",
  status_confirmed: "Confirmed",
  status_cancelled: "Cancelled",
  status_completed: "Completed",
  complete_payment_button: "Complete payment",
  cancel_button: "Cancel",
  cancel_modal_title: "Cancel booking",
  cancel_modal_body: "Are you sure you want to cancel this booking?",
  cancel_reason_label: "Reason (optional)",
  cancel_reason_placeholder: "Tell us why you're cancelling...",
  cancel_confirm: "Yes, cancel",
  cancel_error_passed: "Check-in date has already passed.",
  cancel_error_generic: "This booking cannot be cancelled.",
  review_button: "Leave a review",
  review_modal_title: "How was your stay?",
  review_rating_label: "Rating",
  review_text_label: "Your review (optional)",
  review_text_placeholder: "Share your experience...",
  review_submit: "Submit review",
  review_success: "Review submitted!",
  review_already_exists: "You've already reviewed this booking.",
  nights: "nights",
  night: "night",
};

const OTHER_KEYS: Record<string, string> = {
  "listings.error.not_found": "Listing not found.",
  "error.generic.unexpected": "Something went wrong. Please try again.",
  "common.loading": "Loading…",
  "common.submitting": "…",
  "common.action.close": "Close",
};

const SOURCES = [
  formSource,
  successSource,
  cancelSource,
  myBookingsSource,
  cancelModalSource,
  reviewModalSource,
  modalSource,
  emptyStateSource,
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("booking and payment copy is unchanged (NH-124)", () => {
  it("booking.ui keys and values equal the baseline", () => {
    expect(en.booking.ui).toEqual(BOOKING_UI);
  });

  it("booking.dashboard keys and values equal the baseline", () => {
    expect(en.booking.dashboard).toEqual(BOOKING_DASHBOARD);
  });

  it("t() resolves every baseline literal to the same string", () => {
    const entries: [string, string][] = [
      ...Object.entries(BOOKING_UI).map(([k, v]): [string, string] => [`booking.ui.${k}`, v]),
      ...Object.entries(BOOKING_DASHBOARD).map(([k, v]): [string, string] => [
        `booking.dashboard.${k}`,
        v,
      ]),
      ...Object.entries(OTHER_KEYS),
    ];
    for (const [key, value] of entries) {
      expect(t(key as LocaleKey)).toBe(value);
    }
  });

  it("every key the booking screens read exists in the dictionary", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const keys = new Set<string>();
    for (const source of SOURCES) {
      for (const match of source.matchAll(/\bt\(\s*"([a-z0-9_.]+)"\s*\)/g)) {
        keys.add(match[1] as string);
      }
    }
    expect(keys.size).toBeGreaterThan(20);
    for (const key of keys) {
      expect(t(key as LocaleKey), key).not.toMatch(/^<key-not-found/);
    }
    expect(warn).not.toHaveBeenCalled();
  });
});
