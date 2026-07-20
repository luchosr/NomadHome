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

export function CancelBookingModal({ bookingId, onSuccess, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await bookingsApi.cancel(bookingId, reason.trim() || undefined);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { error?: string };
        if (body?.error === "CHECKIN_ALREADY_PASSED") {
          setError(t("booking.dashboard.cancel_error_passed"));
        } else {
          setError(t("booking.dashboard.cancel_error_generic"));
        }
      } else {
        setError(t("booking.dashboard.cancel_error_generic"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal labelledBy="cancel-modal-title">
      <h2 id="cancel-modal-title" className="mb-2 text-xl font-semibold text-fg-1">
        {t("booking.dashboard.cancel_modal_title")}
      </h2>
      <p className="mb-4 text-fg-2">{t("booking.dashboard.cancel_modal_body")}</p>

      <label htmlFor="cancel-reason" className="mb-1 block text-sm font-medium text-fg-2">
        {t("booking.dashboard.cancel_reason_label")}
      </label>
      <textarea
        id="cancel-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={t("booking.dashboard.cancel_reason_placeholder")}
        className="w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 placeholder:text-fg-muted focus-visible:border-forest-500 focus-visible:outline-none"
      />

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          {t("common.action.close")}
        </Button>
        <Button variant="destructive" onClick={() => void handleConfirm()} disabled={isSubmitting}>
          {isSubmitting ? "..." : t("booking.dashboard.cancel_confirm")}
        </Button>
      </div>
    </Modal>
  );
}
