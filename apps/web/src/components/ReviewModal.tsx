import { useState } from "react";
import { t } from "@nomadhome/shared";
import { Button } from "@nomadhome/ui";
import { bookingsApi } from "../api/bookings.js";
import { ApiError } from "../api/client.js";
import { Modal } from "./Modal.js";

interface Props {
  bookingId: string;
  onSuccess: () => void;
  onClose: () => void;
}

const STAR_COUNT = 5;

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
      if (err instanceof ApiError && err.status === 409) {
        setError(t("booking.dashboard.review_already_exists"));
      } else {
        setError(t("error.generic.unexpected"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hovered || rating;

  return (
    <Modal labelledBy="review-modal-title">
      <h2 id="review-modal-title" className="mb-4 text-xl font-semibold text-fg-1">
        {t("booking.dashboard.review_modal_title")}
      </h2>

      {success ? (
        <p className="py-4 text-center text-success">{t("booking.dashboard.review_success")}</p>
      ) : (
        <>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-fg-2">
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
                    className="text-2xl text-warning transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2"
                  >
                    {filled ? "★" : "☆"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="review-text" className="mb-1 block text-sm font-medium text-fg-2">
              {t("booking.dashboard.review_text_label")}
            </label>
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder={t("booking.dashboard.review_text_placeholder")}
              className="w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 placeholder:text-fg-muted focus-visible:border-forest-500 focus-visible:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="mb-3 text-sm text-danger">
              {error}
            </p>
          )}

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
