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

const noop = () => {};

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
      setError(getDisplayMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal labelledBy="cancel-modal-title" onClose={isSubmitting ? noop : onClose}>
      <h2 id="cancel-modal-title" className="m-0 mb-2 text-xl font-black text-fg">
        {t("booking.dashboard.cancel_modal_title")}
      </h2>
      <p className="m-0 mb-4 text-fg-muted">{t("booking.dashboard.cancel_modal_body")}</p>

      <label htmlFor="cancel-reason" className="mb-2 block text-sm font-bold text-fg">
        {t("booking.dashboard.cancel_reason_label")}
      </label>
      <textarea
        id="cancel-reason"
        data-autofocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={t("booking.dashboard.cancel_reason_placeholder")}
        className="w-full rounded-sm border-2 border-border bg-surface-raised px-4 py-3 text-base text-fg placeholder:text-fg-subtle"
      />

      <ServerErrorAlert error={error} className="mt-3" />

      <div className="mt-4 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          {t("common.action.close")}
        </Button>
        <Button variant="destructive" onClick={() => void handleConfirm()} disabled={isSubmitting}>
          {isSubmitting ? t("common.submitting") : t("booking.dashboard.cancel_confirm")}
        </Button>
      </div>
    </Modal>
  );
}
