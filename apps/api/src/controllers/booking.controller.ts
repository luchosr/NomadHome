import type { Request, Response } from "express";
import {
  CreateBookingSchema,
  CancelBookingSchema,
  BookingListQuerySchema,
  BookingQuoteQuerySchema,
  t,
} from "@nomadhome/shared";
import {
  BookingService,
  BookingNotFoundError,
  BookingNotCancellableError,
  BookingOverlapError,
  ListingNotAvailableError,
  PastCheckInError,
  SelfBookingError,
  NoFeeConfigError,
} from "../services/booking.service.js";
import { EmailNotVerifiedError } from "../services/auth.service.js";
import { getUser } from "../middleware/require-auth.js";

export class BookingController {
  constructor(private readonly service: BookingService) {}

  private userId(req: Request): string {
    return getUser(req).id;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    try {
      const booking = await this.service.create(
        this.userId(req),
        parsed.data.listingId,
        new Date(parsed.data.checkIn),
        new Date(parsed.data.checkOut),
      );
      res.status(201).json(booking);
    } catch (err) {
      this.mapError(err, res);
    }
  };

  quote = async (req: Request, res: Response): Promise<void> => {
    const parsed = BookingQuoteQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(422).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    try {
      const quote = await this.service.quote(
        parsed.data.listingId,
        new Date(parsed.data.checkIn),
        new Date(parsed.data.checkOut),
      );
      res.status(200).json({
        nights: quote.nights,
        nightlyRateCents: quote.nightlyRateCents,
        subtotalCents: quote.subtotalCents,
        guestServiceFeeBps: quote.guestServiceFeeBps,
        guestServiceFeeCents: quote.guestServiceFeeCents,
        totalChargedCents: quote.totalChargedCents,
        currency: quote.currency,
      });
    } catch (err) {
      this.mapError(err, res);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const booking = await this.service.getForGuest(this.userId(req), req.params.id ?? "");
      res.json(booking);
    } catch (err) {
      this.mapError(err, res);
    }
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    const parsed = BookingListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    const result = await this.service.listForGuest(
      this.userId(req),
      parsed.data.page,
      parsed.data.limit,
    );
    res.json(result);
  };

  listHostUpcoming = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.listHostUpcoming(this.userId(req)));
  };

  listHostAll = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.listAllForHost(this.userId(req)));
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const parsed = CancelBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    try {
      const booking = await this.service.cancel(
        this.userId(req),
        req.params.id ?? "",
        parsed.data.cancellationReason,
      );
      res.json(booking);
    } catch (err) {
      this.mapError(err, res);
    }
  };

  private mapError(err: unknown, res: Response): void {
    if (err instanceof EmailNotVerifiedError) {
      res
        .status(403)
        .json({ error: "EMAIL_NOT_VERIFIED", message: t("booking.error.email_not_verified") });
      return;
    }
    if (err instanceof PastCheckInError) {
      res.status(422).json({ error: "PAST_CHECKIN", message: t("booking.error.checkin_passed") });
      return;
    }
    if (err instanceof BookingNotFoundError) {
      res.status(404).json({ error: "BOOKING_NOT_FOUND", message: t("booking.error.not_found") });
      return;
    }
    if (err instanceof ListingNotAvailableError) {
      res.status(404).json({
        error: "LISTING_NOT_AVAILABLE",
        message: t("booking.error.listing_not_found"),
      });
      return;
    }
    if (err instanceof SelfBookingError) {
      res
        .status(422)
        .json({ error: "SELF_BOOKING_NOT_ALLOWED", message: t("booking.error.self_booking") });
      return;
    }
    if (err instanceof BookingOverlapError) {
      res.status(409).json({
        error: "OVERLAP_CONFLICT",
        message: t("booking.error.overlap"),
        conflict: err.conflict,
      });
      return;
    }
    if (err instanceof BookingNotCancellableError) {
      res.status(422).json({
        error: err.code,
        message: t(
          `booking.error.${err.code === "CHECKIN_ALREADY_PASSED" ? "checkin_passed" : "not_cancellable"}`,
        ),
      });
      return;
    }
    if (err instanceof NoFeeConfigError) {
      res.status(500).json({ error: "NO_FEE_CONFIG", message: err.message });
      return;
    }
    throw err;
  }
}
