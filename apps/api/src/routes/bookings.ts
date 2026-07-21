import { Router } from "express";
import Stripe from "stripe";
import { BookingController } from "../controllers/booking.controller.js";
import { PaymentController } from "../controllers/payment.controller.js";
import { ReviewController } from "../controllers/review.controller.js";
import { BookingService } from "../services/booking.service.js";
import { PaymentService } from "../services/payment.service.js";
import { ReviewService } from "../services/review.service.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { ReviewRepository } from "../repositories/review.repository.js";
import { LoggingEmailService } from "../services/email.service.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireRole } from "../middleware/require-role.js";

const emailService = new LoggingEmailService();
const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "sk_test_placeholder");

const bookingController = new BookingController(
  new BookingService(
    new BookingRepository(),
    new ListingRepository(),
    new UserRepository(),
    emailService,
  ),
);

const paymentController = new PaymentController(
  new PaymentService(
    new PaymentRepository(),
    new BookingRepository(),
    new ListingRepository(),
    new UserRepository(),
    emailService,
    stripe,
    process.env["STRIPE_SUCCESS_URL"] ?? "http://localhost:5173/booking/success",
    process.env["STRIPE_CANCEL_URL"] ?? "http://localhost:5173/listings",
  ),
);

const reviewController = new ReviewController(
  new ReviewService(new ReviewRepository(), new BookingRepository(), new ListingRepository()),
);

const router = Router();
router.use(requireAuth);
router.get("/host-upcoming", requireRole("host"), bookingController.listHostUpcoming);
router.get("/host-all", requireRole("host"), bookingController.listHostAll);
router.post("/", bookingController.create);
router.get("/me", bookingController.listMine);
router.get("/:id", bookingController.getById);
router.post("/:id/cancel", bookingController.cancel);
router.post("/:id/checkout", paymentController.createCheckoutSession);
router.post("/:id/sync-payment", paymentController.syncPaymentStatus);
router.post("/:id/review", reviewController.create);

export const bookingsRouter = router;
