import { prisma, type Booking, type PlatformFeeConfig, type RefundRequest } from "@nomadhome/db";

export class BookingRepository {
  create(data: {
    listingId: string;
    guestId: string;
    hostId: string;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    nightlyRateCents: number;
    subtotalCents: number;
    guestServiceFeeBps: number;
    guestServiceFeeCents: number;
    hostCommissionBps: number;
    hostCommissionCents: number;
    currency: string;
    totalChargedCents: number;
    payoutCents: number;
  }): Promise<Booking> {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({ data });
      await tx.availabilityBlock.create({
        data: {
          listingId: data.listingId,
          startDate: data.checkIn,
          endDate: data.checkOut,
          source: "BOOKING_HOLD",
          bookingId: booking.id,
        },
      });
      return booking;
    });
  }

  findById(id: string): Promise<Booking | null> {
    return prisma.booking.findUnique({ where: { id } });
  }

  findByGuest(
    guestId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Booking[]; total: number }> {
    return prisma.$transaction(async (tx) => {
      const [data, total] = await Promise.all([
        tx.booking.findMany({
          where: { guestId },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        tx.booking.count({ where: { guestId } }),
      ]);
      return { data, total };
    });
  }

  cancel(
    id: string,
    cancellationReason: string | undefined,
  ): Promise<{ booking: Booking; refund: RefundRequest }> {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason },
      });
      await tx.availabilityBlock.deleteMany({
        where: { bookingId: id, source: "BOOKING_HOLD" },
      });
      const refund = await tx.refundRequest.create({
        data: {
          bookingId: id,
          amountCents: booking.totalChargedCents,
          currency: booking.currency,
          status: "PENDING_ADMIN",
        },
      });
      return { booking, refund };
    });
  }

  findHostUpcoming(hostId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return prisma.booking.findMany({
      where: { hostId, status: "CONFIRMED", checkIn: { gte: today } },
      orderBy: { checkIn: "asc" },
      include: {
        listing: { select: { title: true } },
        guest: { select: { email: true } },
      },
    });
  }

  latestFeeConfig(): Promise<PlatformFeeConfig | null> {
    return prisma.platformFeeConfig.findFirst({ orderBy: { createdAt: "desc" } });
  }
}
