import { type Booking } from "@nomadhome/db";
import { t } from "@nomadhome/shared";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { type EmailService } from "./email.service.js";

export class BookingNotFoundError extends Error {
  constructor() {
    super("booking_not_found");
    this.name = "BookingNotFoundError";
  }
}

export class ListingNotAvailableError extends Error {
  constructor() {
    super("listing_not_available");
    this.name = "ListingNotAvailableError";
  }
}

export class SelfBookingError extends Error {
  constructor() {
    super("self_booking_not_allowed");
    this.name = "SelfBookingError";
  }
}

export class BookingNotCancellableError extends Error {
  constructor(public readonly code: "BOOKING_NOT_CANCELLABLE" | "CHECKIN_ALREADY_PASSED") {
    super(code);
    this.name = "BookingNotCancellableError";
  }
}

export interface OverlapConflictPayload {
  blockId: string;
  source: string;
  startDate: string;
  endDate: string;
  bookingId?: string;
}

export class BookingOverlapError extends Error {
  constructor(public readonly conflict: OverlapConflictPayload) {
    super("overlap_conflict");
    this.name = "BookingOverlapError";
  }
}

export class NoFeeConfigError extends Error {
  constructor() {
    super(t("booking.error.no_fee_config"));
    this.name = "NoFeeConfigError";
  }
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isExclusionViolation(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.message.includes("23P01") || err.message.includes("availability_no_overlap"))
  );
}

export class BookingService {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly listings: ListingRepository,
    private readonly users: UserRepository,
    private readonly email: EmailService,
  ) {}

  async create(
    guestId: string,
    listingId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<Booking> {
    const listing = await this.listings.findById(listingId);
    if (!listing || listing.status !== "PUBLISHED") throw new ListingNotAvailableError();
    if (listing.hostId === guestId) throw new SelfBookingError();

    const feeConfig = await this.bookings.latestFeeConfig();
    if (!feeConfig) throw new NoFeeConfigError();

    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
    const subtotalCents = listing.nightlyRateCents * nights;
    const guestServiceFeeCents = Math.floor((subtotalCents * feeConfig.guestServiceFeeBps) / 10000);
    const hostCommissionCents = Math.floor((subtotalCents * feeConfig.hostCommissionBps) / 10000);

    try {
      return await this.bookings.create({
        listingId,
        guestId,
        hostId: listing.hostId,
        checkIn,
        checkOut,
        nights,
        nightlyRateCents: listing.nightlyRateCents,
        subtotalCents,
        guestServiceFeeBps: feeConfig.guestServiceFeeBps,
        guestServiceFeeCents,
        hostCommissionBps: feeConfig.hostCommissionBps,
        hostCommissionCents,
        currency: listing.currency,
        totalChargedCents: subtotalCents + guestServiceFeeCents,
        payoutCents: subtotalCents - hostCommissionCents,
      });
    } catch (err) {
      if (!isExclusionViolation(err)) throw err;
      throw new BookingOverlapError({
        blockId: "unknown",
        source: "BOOKING_HOLD",
        startDate: toISODate(checkIn),
        endDate: toISODate(checkOut),
      });
    }
  }

  async getForGuest(guestId: string, bookingId: string): Promise<Booking> {
    const booking = await this.bookings.findById(bookingId);
    if (!booking || booking.guestId !== guestId) throw new BookingNotFoundError();
    return booking;
  }

  async listForGuest(
    guestId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Booking[]; total: number; page: number; limit: number }> {
    const { data, total } = await this.bookings.findByGuest(guestId, page, limit);
    return { data, total, page, limit };
  }

  async cancel(
    guestId: string,
    bookingId: string,
    cancellationReason: string | undefined,
  ): Promise<Booking> {
    const booking = await this.bookings.findById(bookingId);
    if (!booking || booking.guestId !== guestId) throw new BookingNotFoundError();
    if (booking.status !== "CONFIRMED") {
      throw new BookingNotCancellableError("BOOKING_NOT_CANCELLABLE");
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (booking.checkIn <= today) {
      throw new BookingNotCancellableError("CHECKIN_ALREADY_PASSED");
    }

    const { booking: cancelled } = await this.bookings.cancel(bookingId, cancellationReason);

    // Best-effort email — failure must not roll back the cancellation
    try {
      const [host, guest, listing] = await Promise.all([
        this.users.findById(booking.hostId),
        this.users.findById(booking.guestId),
        this.listings.findById(booking.listingId),
      ]);
      if (host && guest && listing) {
        const hostProfile = await this.users.findHostProfile(host.id);
        await this.email.sendCancellationToHost({
          hostEmail: host.email,
          hostName: hostProfile?.displayName ?? host.email,
          guestEmail: guest.email,
          listingTitle: listing.title,
          checkIn: toISODate(booking.checkIn),
          checkOut: toISODate(booking.checkOut),
          bookingId: booking.id,
        });
      }
    } catch (emailErr) {
      console.error("[BookingService] cancellation email failed", emailErr);
    }

    return cancelled;
  }
}
