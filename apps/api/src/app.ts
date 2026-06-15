import express, { type Express } from "express";
import { healthRouter } from "./routes/health.js";

/**
 * Build the Express application.
 *
 * Kept separate from server startup (`index.ts`) so tests can exercise the app
 * without binding a port. Routes follow the layered architecture
 * (controller → service → repository) defined in openspec/project.md §5.
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/health", healthRouter);
  return app;
}
