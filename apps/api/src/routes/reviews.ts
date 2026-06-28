import { Router, type Request, type Response } from "express";
import { ReviewController } from "../controllers/review.controller.js";
import { ReviewService } from "../services/review.service.js";
import { ReviewRepository } from "../repositories/review.repository.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { ListingController } from "../controllers/listing.controller.js";
import { ListingService } from "../services/listing.service.js";
import { AvailabilityRepository } from "../repositories/availability.repository.js";

const reviewController = new ReviewController(
  new ReviewService(new ReviewRepository(), new BookingRepository(), new ListingRepository()),
);

const listingController = new ListingController(new ListingService(new ListingRepository()));
const availabilityRepo = new AvailabilityRepository();

const router = Router();
// Public — no auth required
router.get("/:id/reviews", reviewController.listForListing);

router.get("/:id/blocked-dates", async (req: Request, res: Response) => {
  const blocks = await availabilityRepo.listByListing(req.params.id ?? "");
  res.json(
    blocks.map((b) => ({
      startDate: b.startDate.toISOString().slice(0, 10),
      endDate: b.endDate.toISOString().slice(0, 10),
    })),
  );
});

// ponytail: UUID constraint prevents shadowing /listings/mine in listingsRouter
router.get(
  "/:id([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})",
  listingController.getPublic,
);

export const reviewsRouter = router;
