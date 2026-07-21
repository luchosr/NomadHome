import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import cors from "cors";
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
import { reviewsRouter } from "./routes/reviews.js";

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

  app.use(
    cors({
      origin: process.env["CORS_ORIGIN"]?.split(",").map((o) => o.trim()) ?? [
        "http://localhost:5173",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  );
  // Stripe webhook needs raw body — mount before express.json()
  app.use("/stripe", stripeRouter);

  // Local dev file uploads (active only when R2 env vars are absent)
  if (!process.env["CLOUDFLARE_R2_ACCOUNT_ID"]) {
    const uploadsDir = path.join(process.cwd(), "uploads");
    app.put(
      "/dev-upload/:key",
      express.raw({ type: "*/*", limit: "20mb" }),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const safeKey = path.basename(req.params["key"] ?? "");
          await mkdir(uploadsDir, { recursive: true });
          if (!Buffer.isBuffer(req.body)) {
            res.status(400).json({ error: "invalid_body", message: "expected raw bytes" });
            return;
          }
          await writeFile(path.join(uploadsDir, safeKey), req.body);
          res.status(200).send();
        } catch (err) {
          next(err);
        }
      },
    );
    app.use("/uploads", express.static(uploadsDir));
  }

  app.use(express.json());
  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/listings", reviewsRouter);
  app.use("/listings", listingsRouter);
  app.use("/listings", listingPhotosRouter);
  app.use("/listings", availabilityRouter);
  app.use("/search", searchRouter);
  app.use("/bookings", bookingsRouter);
  app.use("/admin", adminRouter);
  return app;
}
