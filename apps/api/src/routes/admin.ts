import { Router } from "express";
import Stripe from "stripe";
import { PaymentController } from "../controllers/payment.controller.js";
import { AdminModerationController } from "../controllers/admin-moderation.controller.js";
import { PaymentService } from "../services/payment.service.js";
import { AdminService } from "../services/admin.service.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import { AdminRepository } from "../repositories/admin.repository.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { LoggingEmailService } from "../services/email.service.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireRole } from "../middleware/require-role.js";

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "sk_test_placeholder");

const paymentController = new PaymentController(
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

const moderationController = new AdminModerationController(new AdminService(new AdminRepository()));

const router = Router();
router.use(requireAuth, requireRole("admin"));
router.get("/payouts", paymentController.getPayoutSummary);
router.post("/payouts", paymentController.recordPayout);
router.patch("/users/:id/disable", moderationController.disableUser);
router.patch("/users/:id/enable", moderationController.enableUser);
router.patch("/listings/:id/disable", moderationController.disableListing);
router.patch("/listings/:id/enable", moderationController.enableListing);

export const adminRouter = router;
