import { Router } from "express";
import { BookingController } from "../controllers/booking.controller.js";
import { BookingService } from "../services/booking.service.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { LoggingEmailService } from "../services/email.service.js";
import { requireAuth } from "../middleware/require-auth.js";

const controller = new BookingController(
  new BookingService(
    new BookingRepository(),
    new ListingRepository(),
    new UserRepository(),
    new LoggingEmailService(),
  ),
);

const router = Router();
router.use(requireAuth);
router.post("/", controller.create);
router.get("/me", controller.listMine);
router.get("/:id", controller.getById);
router.post("/:id/cancel", controller.cancel);

export const bookingsRouter = router;
