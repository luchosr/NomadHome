import { Router } from "express";
import Stripe from "stripe";
import { PaymentController } from "../controllers/payment.controller.js";
import { PaymentService } from "../services/payment.service.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { LoggingEmailService } from "../services/email.service.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireRole } from "../middleware/require-role.js";

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "sk_test_placeholder");

const controller = new PaymentController(
  new PaymentService(
    new PaymentRepository(),
    new BookingRepository(),
    new ListingRepository(),
    new UserRepository(),
    new LoggingEmailService(),
    stripe,
    process.env["STRIPE_SUCCESS_URL"] ?? "http://localhost:5173/booking/success",
    process.env["STRIPE_CANCEL_URL"] ?? "http://localhost:5173/listings",
  ),
);

const router = Router();
router.use(requireAuth, requireRole("admin"));
router.get("/payouts", controller.getPayoutSummary);
router.post("/payouts", controller.recordPayout);

export const adminRouter = router;
