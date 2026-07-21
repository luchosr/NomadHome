import { Router } from "express";
import { ListingController } from "../controllers/listing.controller.js";
import { ListingService } from "../services/listing.service.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireRole } from "../middleware/require-role.js";

export function createListingsRouter(): Router {
  const controller = new ListingController(new ListingService(new ListingRepository()));
  const router = Router();

  // /mine must come before /:id — otherwise "mine" is treated as an ID parameter
  router.get("/mine", requireAuth, requireRole("host"), controller.listMine);
  router.get("/:id", controller.getPublic);
  router.get("/:id/manage", requireAuth, requireRole("host"), controller.getOne);
  router.post("/", requireAuth, requireRole("host"), controller.create);
  router.patch("/:id", requireAuth, requireRole("host"), controller.update);
  router.patch("/:id/publish", requireAuth, requireRole("host"), controller.publish);
  router.patch("/:id/unpublish", requireAuth, requireRole("host"), controller.unpublish);

  return router;
}

export const listingsRouter = createListingsRouter();
