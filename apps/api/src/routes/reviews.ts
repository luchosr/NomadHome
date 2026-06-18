import { Router } from "express";
import { ReviewController } from "../controllers/review.controller.js";
import { ReviewService } from "../services/review.service.js";
import { ReviewRepository } from "../repositories/review.repository.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { ListingController } from "../controllers/listing.controller.js";
import { ListingService } from "../services/listing.service.js";

const reviewController = new ReviewController(
  new ReviewService(new ReviewRepository(), new BookingRepository(), new ListingRepository()),
);

const listingController = new ListingController(new ListingService(new ListingRepository()));

const router = Router();
// Public — no auth required
router.get("/:id/reviews", reviewController.listForListing);
// ponytail: UUID constraint prevents shadowing /listings/mine in listingsRouter
router.get(
  "/:id([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})",
  listingController.getPublic,
);

export const reviewsRouter = router;
