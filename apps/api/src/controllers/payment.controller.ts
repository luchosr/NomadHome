import type { Request, Response } from "express";
import Stripe from "stripe";
import { RecordPayoutSchema, t } from "@nomadhome/shared";
import {
  PaymentService,
  BookingNotPendingError,
  PaymentBookingNotFoundError,
  DoublePayoutError,
} from "../services/payment.service.js";
import { getUser } from "../middleware/require-auth.js";

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  private userId(req: Request): string {
    return getUser(req).id;
  }

  createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.createCheckoutSession(
        this.userId(req),
        req.params.id ?? "",
      );
      res.json(result);
    } catch (err) {
      if (err instanceof PaymentBookingNotFoundError) {
        res.status(404).json({ error: t("payments.error.booking_not_found") });
        return;
      }
      if (err instanceof BookingNotPendingError) {
        res
          .status(422)
          .json({ error: "BOOKING_NOT_PENDING", message: t("payments.error.booking_not_pending") });
        return;
      }
      if (err instanceof Stripe.errors.StripeError) {
        res.status(502).json({ error: "payment_provider_error" });
        return;
      }
      throw err;
    }
  };

  syncPaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const booking = await this.service.syncPaymentStatus(this.userId(req), req.params.id ?? "");
      res.json(booking);
    } catch (err) {
      if (err instanceof PaymentBookingNotFoundError) {
        res.status(404).json({ error: t("payments.error.booking_not_found") });
        return;
      }
      if (err instanceof Stripe.errors.StripeError) {
        res.status(502).json({ error: "payment_provider_error" });
        return;
      }
      throw err;
    }
  };

  getPayoutSummary = async (_req: Request, res: Response): Promise<void> => {
    const rows = await this.service.getPayoutSummary();
    res.json(rows);
  };

  recordPayout = async (req: Request, res: Response): Promise<void> => {
    const parsed = RecordPayoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    try {
      const payout = await this.service.recordPayout({
        ...parsed.data,
        adminId: this.userId(req),
      });
      res.status(201).json(payout);
    } catch (err) {
      if (err instanceof DoublePayoutError) {
        res
          .status(409)
          .json({ error: "DOUBLE_PAYOUT", message: t("payments.error.double_payout") });
        return;
      }
      throw err;
    }
  };
}
