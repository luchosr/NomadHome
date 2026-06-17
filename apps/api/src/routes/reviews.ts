import { Router } from "express";
import { ReviewController } from "../controllers/review.controller.js";
import { ReviewService } from "../services/review.service.js";
import { ReviewRepository } from "../repositories/review.repository.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";

const controller = new ReviewController(
  new ReviewService(new ReviewRepository(), new BookingRepository(), new ListingRepository()),
);

const router = Router();
// Public — no auth required
router.get("/:id/reviews", controller.listForListing);

export const reviewsRouter = router;
