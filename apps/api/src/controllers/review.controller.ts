import type { NextFunction, Request, Response } from "express";
import { CreateReviewSchema, t } from "@nomadhome/shared";
import {
  ReviewService,
  ReviewNotFoundError,
  BookingNotConfirmedError,
  CheckoutNotPassedError,
  ReviewAlreadyExistsError,
} from "../services/review.service.js";
import type { AuthedRequest } from "../middleware/require-auth.js";

export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    const guestId = (req as AuthedRequest).user!.id;
    try {
      const review = await this.service.create(
        guestId,
        req.params.id ?? "",
        parsed.data.rating,
        parsed.data.text,
      );
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof ReviewNotFoundError) {
        res.status(404).json({
          error: "BOOKING_NOT_FOUND",
          message: t("reviews.error.booking_not_found"),
        });
        return;
      }
      if (err instanceof BookingNotConfirmedError) {
        res.status(422).json({
          error: "BOOKING_NOT_CONFIRMED",
          message: t("reviews.error.booking_not_confirmed"),
        });
        return;
      }
      if (err instanceof CheckoutNotPassedError) {
        res
          .status(422)
          .json({ error: "CHECKOUT_NOT_PASSED", message: t("reviews.error.checkout_not_passed") });
        return;
      }
      if (err instanceof ReviewAlreadyExistsError) {
        res
          .status(409)
          .json({ error: "REVIEW_ALREADY_EXISTS", message: t("reviews.error.already_exists") });
        return;
      }
      throw err;
    }
  };

  listForListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.listForListing(req.params["id"] ?? "");
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
