import express, { type Express } from "express";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { listingsRouter } from "./routes/listings.js";
import { listingPhotosRouter } from "./routes/listing-photos.js";
import { availabilityRouter } from "./routes/availability.js";
import { searchRouter } from "./routes/search.js";
import { bookingsRouter } from "./routes/bookings.js";
import { stripeRouter } from "./routes/stripe.js";
import { adminRouter } from "./routes/admin.js";

/**
 * Build the Express application.
 *
 * Kept separate from server startup (`index.ts`) so tests can exercise the app
 * without binding a port. Routes follow the layered architecture
 * (controller → service → repository) defined in openspec/project.md §5.
 *
 * The Stripe webhook route (/stripe/webhook) is mounted before express.json()
 * so it receives the raw body buffer needed for signature verification.
 */
export function createApp(): Express {
  const app = express();
  // Stripe webhook needs raw body — mount before express.json()
  app.use("/stripe", stripeRouter);
  app.use(express.json());
  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/listings", listingsRouter);
  app.use("/listings", listingPhotosRouter);
  app.use("/listings", availabilityRouter);
  app.use("/search", searchRouter);
  app.use("/bookings", bookingsRouter);
  app.use("/admin", adminRouter);
  return app;
}
