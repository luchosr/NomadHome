import { Router } from "express";
import { AvailabilityController } from "../controllers/availability.controller.js";
import { AvailabilityService } from "../services/availability.service.js";
import { AvailabilityRepository } from "../repositories/availability.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireRole } from "../middleware/require-role.js";

export function createAvailabilityRouter(): Router {
  const controller = new AvailabilityController(
    new AvailabilityService(new AvailabilityRepository(), new ListingRepository()),
  );

  const router = Router();
  router.get("/:id/blocked-dates", controller.getBlockedDates);
  router.post("/:id/availability", requireAuth, requireRole("host"), controller.block);
  router.get("/:id/availability", requireAuth, requireRole("host"), controller.list);
  router.delete(
    "/:id/availability/:blockId",
    requireAuth,
    requireRole("host"),
    controller.deleteBlock,
  );
  return router;
}

export const availabilityRouter = createAvailabilityRouter();
