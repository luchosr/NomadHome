import { prisma } from "@nomadhome/db";

export class AdminRepository {
  disableUser(userId: string, adminId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { disabledAt: new Date() },
      });

      await tx.listing.updateMany({
        where: { hostId: userId, status: { in: ["PUBLISHED", "DRAFT"] } },
        data: { status: "DISABLED", disabledAt: new Date() },
      });

      const upcomingHostBookings = await tx.booking.findMany({
        where: { hostId: userId, status: "CONFIRMED", checkIn: { gte: today } },
        select: { id: true },
      });
      const upcomingGuestBookings = await tx.booking.findMany({
        where: { guestId: userId, status: "CONFIRMED", checkIn: { gte: today } },
        select: { id: true },
      });

      if (upcomingHostBookings.length > 0) {
        await tx.bookingFlag.createMany({
          data: upcomingHostBookings.map((b) => ({
            bookingId: b.id,
            reason: "HOST_DISABLED" as const,
            adminId,
          })),
        });
      }
      if (upcomingGuestBookings.length > 0) {
        await tx.bookingFlag.createMany({
          data: upcomingGuestBookings.map((b) => ({
            bookingId: b.id,
            reason: "GUEST_DISABLED" as const,
            adminId,
          })),
        });
      }

      return user;
    });
  }

  enableUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { disabledAt: null },
    });
  }

  disableListing(listingId: string) {
    return prisma.listing.update({
      where: { id: listingId },
      data: { status: "DISABLED", disabledAt: new Date() },
    });
  }

  enableListing(listingId: string) {
    return prisma.listing.update({
      where: { id: listingId },
      data: { status: "PUBLISHED", disabledAt: null },
    });
  }

  listUsers(page: number, limit: number) {
    return prisma.$transaction(async (tx) => {
      const [data, total] = await Promise.all([
        tx.user.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: { id: true, email: true, roles: true, disabledAt: true, createdAt: true },
        }),
        tx.user.count(),
      ]);
      return { data, total };
    });
  }

  listListings(page: number, limit: number) {
    return prisma.$transaction(async (tx) => {
      const [data, total] = await Promise.all([
        tx.listing.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            title: true,
            type: true,
            city: true,
            status: true,
            createdAt: true,
            host: { select: { email: true } },
          },
        }),
        tx.listing.count(),
      ]);
      return { data, total };
    });
  }
}
