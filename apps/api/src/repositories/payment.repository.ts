import { prisma, type Booking, type Payout, type PayoutBooking } from "@nomadhome/db";

export interface PayoutSummaryRow {
  hostId: string;
  hostEmail: string;
  totalOwedCents: number;
  currency: string;
}

export class PaymentRepository {
  /** Store the Stripe checkout session ID on a booking. */
  setCheckoutSession(bookingId: string, sessionId: string): Promise<Booking> {
    return prisma.booking.update({
      where: { id: bookingId },
      data: { stripeCheckoutSessionId: sessionId },
    });
  }

  /**
   * Atomically confirm a booking from a Stripe webhook event.
   * Inserts a StripeProcessedEvent row first; on unique conflict the event is a
   * duplicate and we return null without touching the booking.
   */
  async confirmFromWebhook(
    stripeEventId: string,
    sessionId: string,
    paymentIntentId: string,
  ): Promise<Booking | null> {
    return prisma.$transaction(async (tx) => {
      try {
        await tx.stripeProcessedEvent.create({
          data: { stripeEventId, eventType: "checkout.session.completed" },
        });
      } catch {
        // Unique constraint violation → already processed
        return null;
      }

      const booking = await tx.booking.findFirst({
        where: { stripeCheckoutSessionId: sessionId },
      });
      if (!booking) return null;

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          stripePaymentIntentId: paymentIntentId,
        },
      });
    });
  }

  /**
   * Atomically cancel a PENDING_PAYMENT booking when its Stripe session expires.
   * Idempotent via StripeProcessedEvent. Deletes the BOOKING_HOLD without
   * creating a RefundRequest (no payment was captured).
   */
  async expireFromWebhook(stripeEventId: string, sessionId: string): Promise<Booking | null> {
    return prisma.$transaction(async (tx) => {
      try {
        await tx.stripeProcessedEvent.create({
          data: { stripeEventId, eventType: "checkout.session.expired" },
        });
      } catch {
        return null;
      }

      const booking = await tx.booking.findFirst({
        where: { stripeCheckoutSessionId: sessionId, status: "PENDING_PAYMENT" },
      });
      if (!booking) return null;

      await tx.availabilityBlock.deleteMany({
        where: { bookingId: booking.id, source: "BOOKING_HOLD" },
      });
      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: "stripe_checkout_expired",
        },
      });
    });
  }

  /**
   * Per-host view of amounts owed: sum of payoutCents for CONFIRMED bookings
   * whose checkOut is in the past and that are not yet in a PayoutBooking row.
   */
  async getPayoutSummary(): Promise<PayoutSummaryRow[]> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const rows = await prisma.booking.groupBy({
      by: ["hostId", "currency"],
      where: {
        status: "CONFIRMED",
        checkOut: { lt: today },
        payoutBooking: null,
      },
      _sum: { payoutCents: true },
    });

    if (rows.length === 0) return [];

    const hostIds = [...new Set(rows.map((r) => r.hostId))];
    const users = await prisma.user.findMany({
      where: { id: { in: hostIds } },
      select: { id: true, email: true },
    });
    const emailMap = new Map(users.map((u) => [u.id, u.email]));

    return rows
      .filter((r) => (r._sum.payoutCents ?? 0) > 0)
      .map((r) => ({
        hostId: r.hostId,
        hostEmail: emailMap.get(r.hostId) ?? r.hostId,
        totalOwedCents: r._sum.payoutCents ?? 0,
        currency: r.currency,
      }));
  }

  /**
   * Record a manual payout and link the provided bookings.
   * PayoutBooking.bookingId is unique → throws on double-settlement.
   */
  recordPayout(data: {
    hostId: string;
    amountCents: number;
    currency: string;
    method: string;
    externalReference: string;
    bookingIds: string[];
    createdBy: string;
  }): Promise<Payout & { payoutBookings: PayoutBooking[] }> {
    return prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          hostId: data.hostId,
          amountCents: data.amountCents,
          currency: data.currency,
          method: data.method,
          externalReference: data.externalReference,
          createdBy: data.createdBy,
        },
      });
      const payoutBookings = await Promise.all(
        data.bookingIds.map((bookingId) =>
          tx.payoutBooking.create({ data: { payoutId: payout.id, bookingId } }),
        ),
      );
      return { ...payout, payoutBookings };
    });
  }
}
