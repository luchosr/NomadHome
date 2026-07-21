import type { Request, Response } from "express";
import {
  CreateBookingSchema,
  CancelBookingSchema,
  BookingListQuerySchema,
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
    const hostId = this.userId(req);
    const bookings = await this.service.listHostUpcoming(hostId);
    res.json(bookings);
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
    if (err instanceof PastCheckInError) {
      res.status(422).json({ error: "PAST_CHECKIN", message: t("booking.error.checkin_passed") });
      return;
    }
    if (err instanceof BookingNotFoundError) {
      res.status(404).json({ error: t("booking.error.not_found") });
      return;
    }
    if (err instanceof ListingNotAvailableError) {
      res.status(404).json({ error: t("booking.error.listing_not_found") });
      return;
    }
    if (err instanceof SelfBookingError) {
      res
        .status(422)
        .json({ error: "SELF_BOOKING_NOT_ALLOWED", message: t("booking.error.self_booking") });
      return;
    }
    if (err instanceof BookingOverlapError) {
      res.status(409).json({ error: "OVERLAP_CONFLICT", conflict: err.conflict });
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
      res.status(500).json({ error: err.message });
      return;
    }
    throw err;
  }
}
