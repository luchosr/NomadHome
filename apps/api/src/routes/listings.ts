import { Router } from "express";
import { ListingController } from "../controllers/listing.controller.js";
import { ListingService } from "../services/listing.service.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireRole } from "../middleware/require-role.js";

/** Host-only listing management routes. */
export function createListingsRouter(): Router {
  const controller = new ListingController(new ListingService(new ListingRepository()));

  const router = Router();
  router.use(requireAuth, requireRole("host"));
  router.post("/", controller.create);
  router.get("/mine", controller.listMine);
  router.get("/:id", controller.getOne);
  router.patch("/:id", controller.update);
  router.patch("/:id/publish", controller.publish);
  router.patch("/:id/unpublish", controller.unpublish);
  return router;
}

export const listingsRouter = createListingsRouter();
