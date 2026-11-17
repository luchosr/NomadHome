import { useState } from "react";
import { t } from "@nomadhome/shared";
import { Button } from "@nomadhome/ui";
import { bookingsApi } from "../api/bookings.js";
import { getDisplayMessage } from "../api/client.js";
import { Modal } from "./Modal.js";
import { ServerErrorAlert } from "./ServerErrorAlert.js";

interface Props {
  bookingId: string;
  onSuccess: () => void;
  onClose: () => void;
}

const STAR_COUNT = 5;

/** Decorative star on a 24 grid: filled ink or a 2px outline, so state is shape and not colour. */
function StarGlyph({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable={false}
      className="h-8 w-8 shrink-0"
      fill={filled ? "currentColor" : "none"}
    >
      <path
        d="M12 2 15 9 22 9.5 16.5 14.5 18 22 12 18 6 22 7.5 14.5 2 9.5 9 9Z"
        stroke="currentColor"
        strokeWidth={filled ? 1 : 2}
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function ReviewModal({ bookingId, onSuccess, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await bookingsApi.review(bookingId, { rating, text: text.trim() || undefined });
      setSuccess(true);
      setTimeout(onSuccess, 1200);
    } catch (err) {
      setError(getDisplayMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hovered || rating;

  return (
    <Modal labelledBy="review-modal-title">
      <h2 id="review-modal-title" className="m-0 mb-4 text-xl font-black text-fg">
        {t("booking.dashboard.review_modal_title")}
      </h2>

      {success ? (
        <div className="flex items-center gap-3 border-2 border-border bg-surface-raised p-4">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center bg-ink text-fg-inverse"
          >
            <svg
              viewBox="0 0 32 32"
              className="h-6 w-6"
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
          <p className="m-0 min-w-0 break-words font-bold text-fg">
            {t("booking.dashboard.review_success")}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="m-0 mb-2 text-sm font-bold text-fg">
              {t("booking.dashboard.review_rating_label")}
            </p>
            <div
              className="flex gap-1"
              role="group"
              aria-label={t("booking.dashboard.review_rating_label")}
            >
              {Array.from({ length: STAR_COUNT }, (_, i) => {
                const starValue = i + 1;
                const filled = starValue <= displayRating;
                return (
                  <button
                    key={starValue}
                    type="button"
                    aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
                    aria-pressed={starValue === rating}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHovered(starValue)}
                    onMouseLeave={() => setHovered(0)}
                    className="flex h-11 w-11 items-center justify-center text-fg"
                  >
                    <StarGlyph filled={filled} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="review-text" className="mb-2 block text-sm font-bold text-fg">
              {t("booking.dashboard.review_text_label")}
            </label>
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder={t("booking.dashboard.review_text_placeholder")}
              className="w-full rounded-sm border-2 border-border bg-surface-raised px-4 py-3 text-base text-fg placeholder:text-fg-subtle"
            />
          </div>

          <ServerErrorAlert error={error} className="mb-3" />

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              {t("common.action.close")}
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={rating === 0 || isSubmitting}>
              {isSubmitting ? t("common.submitting") : t("booking.dashboard.review_submit")}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
