import type { Request, Response } from "express";
import Stripe from "stripe";
import { PaymentService } from "../services/payment.service.js";

export class StripeWebhookController {
  constructor(
    private readonly service: PaymentService,
    private readonly stripe: Stripe,
    private readonly webhookSecret: string,
  ) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).json({ error: "missing stripe-signature header" });
      return;
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(req.body as Buffer, sig, this.webhookSecret);
    } catch {
      res.status(400).json({ error: "invalid webhook signature" });
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.service.handleCheckoutCompleted(
        event.id,
        session.id,
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? ""),
      );
    }

    res.json({ received: true });
  };
}
