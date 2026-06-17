import express, { Router } from "express";
import Stripe from "stripe";
import { StripeWebhookController } from "../controllers/stripe-webhook.controller.js";
import { PaymentService } from "../services/payment.service.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { LoggingEmailService } from "../services/email.service.js";

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "sk_test_placeholder");
const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"] ?? "whsec_placeholder";

const controller = new StripeWebhookController(
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
  stripe,
  webhookSecret,
);

const router = Router();
// Raw body required for Stripe signature verification — must be mounted before express.json()
router.post("/webhook", express.raw({ type: "application/json" }), controller.handle);

export const stripeRouter = router;
