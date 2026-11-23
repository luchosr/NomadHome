import { describe, it, expect, vi, afterEach } from "vitest";
import { t } from "@nomadhome/shared";
import type { LocaleKey } from "@nomadhome/shared";
import modalSource from "../components/Modal.tsx?raw";
import cancelModalSource from "../components/CancelBookingModal.tsx?raw";
import reviewModalSource from "../components/ReviewModal.tsx?raw";

// NH-146 task 1.9 (modal-a11y): the accessible modal changes no copy. The literals below are the
// baseline values of every t() key read by Modal, CancelBookingModal and ReviewModal, captured
// before the change. This whole file is a GUARD: any key rename, addition or removal fails here.

const BASELINE: Record<string, string> = {
  "booking.dashboard.cancel_confirm": "Yes, cancel",
  "booking.dashboard.cancel_modal_body": "Are you sure you want to cancel this booking?",
  "booking.dashboard.cancel_modal_title": "Cancel booking",
  "booking.dashboard.cancel_reason_label": "Reason (optional)",
  "booking.dashboard.cancel_reason_placeholder": "Tell us why you're cancelling...",
  "booking.dashboard.review_modal_title": "How was your stay?",
  "booking.dashboard.review_rating_label": "Rating",
  "booking.dashboard.review_submit": "Submit review",
  "booking.dashboard.review_success": "Review submitted!",
  "booking.dashboard.review_text_label": "Your review (optional)",
  "booking.dashboard.review_text_placeholder": "Share your experience...",
  "common.action.close": "Close",
  "common.submitting": "…",
};

const SOURCES = [modalSource, cancelModalSource, reviewModalSource];

function readKeys(): string[] {
  const keys = new Set<string>();
  for (const source of SOURCES) {
    for (const match of source.matchAll(/\bt\(\s*"([a-z0-9_.]+)"/g)) keys.add(match[1] as string);
  }
  return [...keys].sort();
}

describe("modal-a11y copy guard (NH-146)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("t() resolves every baseline literal to the same string", () => {
    for (const [key, value] of Object.entries(BASELINE)) {
      expect(t(key as LocaleKey), key).toBe(value);
    }
  });

  it("the modals read exactly the baseline keys (none added or removed)", () => {
    expect(readKeys()).toEqual(Object.keys(BASELINE).sort());
  });

  it("every key the modals read exists in the dictionary", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const key of readKeys()) {
      expect(t(key as LocaleKey), key).not.toMatch(/^<key-not-found/);
    }
    expect(warn).not.toHaveBeenCalled();
  });
});
