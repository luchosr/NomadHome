import Stripe from "stripe";
import { type Booking, type Payout } from "@nomadhome/db";
import { type EmailService } from "./email.service.js";
import { PaymentRepository, type PayoutSummaryRow } from "../repositories/payment.repository.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { UserRepository } from "../repositories/user.repository.js";

export class BookingNotPendingError extends Error {
  constructor() {
    super("BOOKING_NOT_PENDING");
    this.name = "BookingNotPendingError";
  }
}

export class PaymentBookingNotFoundError extends Error {
  constructor() {
    super("BOOKING_NOT_FOUND");
    this.name = "PaymentBookingNotFoundError";
  }
}

export class DoublePayoutError extends Error {
  constructor() {
    super("DOUBLE_PAYOUT");
    this.name = "DoublePayoutError";
  }
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && err.message.includes("Unique constraint failed");
}

export class PaymentService {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly bookings: BookingRepository,
    private readonly listings: ListingRepository,
    private readonly users: UserRepository,
    private readonly email: EmailService,
    private readonly stripe: Stripe,
    private readonly successUrl: string,
    private readonly cancelUrl: string,
  ) {}

  /** Create (or reuse) a Stripe Checkout session for a PENDING_PAYMENT booking. */
  async createCheckoutSession(
    guestId: string,
    bookingId: string,
  ): Promise<{ url: string; sessionId: string }> {
    const booking = await this.bookings.findById(bookingId);
    if (!booking || booking.guestId !== guestId) throw new PaymentBookingNotFoundError();
    if (booking.status !== "PENDING_PAYMENT") throw new BookingNotPendingError();

    // Reuse existing session if present
    if (booking.stripeCheckoutSessionId) {
      const existing = await this.stripe.checkout.sessions.retrieve(
        booking.stripeCheckoutSessionId,
      );
      if (existing.status === "open" && existing.url) {
        return { url: existing.url, sessionId: existing.id };
      }
    }

    const listing = await this.listings.findById(booking.listingId);
    const listingTitle = listing?.title ?? "Stay";

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: booking.currency.toLowerCase(),
            unit_amount: booking.subtotalCents,
            product_data: { name: listingTitle },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: booking.currency.toLowerCase(),
            unit_amount: booking.guestServiceFeeCents,
            product_data: { name: "Service fee" },
          },
          quantity: 1,
        },
      ],
      metadata: { bookingId: booking.id },
      success_url: `${this.successUrl}?bookingId=${booking.id}`,
      cancel_url: `${this.cancelUrl}?listingId=${booking.listingId}`,
    });

    await this.payments.setCheckoutSession(booking.id, session.id);

    return { url: session.url!, sessionId: session.id };
  }

  /**
   * Handle checkout.session.completed webhook event.
   * Returns the confirmed booking, or null if the event was a duplicate.
   */
  async handleCheckoutCompleted(
    stripeEventId: string,
    sessionId: string,
    paymentIntentId: string,
  ): Promise<Booking | null> {
    const confirmed = await this.payments.confirmFromWebhook(
      stripeEventId,
      sessionId,
      paymentIntentId,
    );
    if (!confirmed) return null;

    // Best-effort confirmation emails
    try {
      const [guest, host, listing] = await Promise.all([
        this.users.findById(confirmed.guestId),
        this.users.findById(confirmed.hostId),
        this.listings.findById(confirmed.listingId),
      ]);
      if (guest && host && listing) {
        const hostProfile = await this.users.findHostProfile(host.id);
        await this.email.sendBookingConfirmation({
          guestEmail: guest.email,
          hostEmail: host.email,
          hostName: hostProfile?.displayName ?? host.email,
          listingTitle: listing.title,
          checkIn: toISODate(confirmed.checkIn),
          checkOut: toISODate(confirmed.checkOut),
          bookingId: confirmed.id,
        });
      }
    } catch (err) {
      console.error("[PaymentService] confirmation email failed", err);
    }

    return confirmed;
  }

  /**
   * Handle checkout.session.expired webhook event.
   * Cancels the PENDING_PAYMENT booking and releases its BOOKING_HOLD.
   * Returns null if already processed or no matching booking found.
   */
  async handleCheckoutExpired(stripeEventId: string, sessionId: string): Promise<Booking | null> {
    return this.payments.expireFromWebhook(stripeEventId, sessionId);
  }

  getPayoutSummary(): Promise<PayoutSummaryRow[]> {
    return this.payments.getPayoutSummary();
  }

  async recordPayout(data: {
    hostId: string;
    amountCents: number;
    currency: string;
    method: string;
    externalReference: string;
    bookingIds: string[];
    adminId: string;
  }): Promise<Payout> {
    try {
      return await this.payments.recordPayout({
        ...data,
        createdBy: data.adminId,
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw new DoublePayoutError();
      throw err;
    }
  }
}
