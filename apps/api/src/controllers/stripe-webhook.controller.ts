import type { NextFunction, Request, Response } from "express";
import Stripe from "stripe";
import { PaymentService } from "../services/payment.service.js";

export class StripeWebhookController {
  constructor(
    private readonly service: PaymentService,
    private readonly stripe: Stripe,
    private readonly webhookSecret: string,
  ) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).json({ error: "missing stripe-signature header" });
      return;
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(req.body as Buffer, sig, this.webhookSecret);
    } catch (err) {
      // ponytail: log the real error — secret mismatch is the #1 cause in dev
      console.error(
        "[stripe-webhook] signature verification failed — is STRIPE_WEBHOOK_SECRET current?",
        err instanceof Error ? err.message : err,
      );
      res.status(400).json({ error: "invalid webhook signature" });
      return;
    }

    try {
      const session = event.data.object as Stripe.Checkout.Session;

      if (event.type === "checkout.session.completed") {
        await this.service.handleCheckoutCompleted(
          event.id,
          session.id,
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? ""),
        );
      } else if (event.type === "checkout.session.expired") {
        await this.service.handleCheckoutExpired(event.id, session.id);
      }

      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  };
}
