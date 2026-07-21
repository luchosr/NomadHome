import { Router, type NextFunction, type Request, type Response } from "express";
import { ListingController } from "../controllers/listing.controller.js";
import { ListingService } from "../services/listing.service.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { AvailabilityRepository } from "../repositories/availability.repository.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireRole } from "../middleware/require-role.js";

export function createListingsRouter(): Router {
  const controller = new ListingController(new ListingService(new ListingRepository()));
  const availabilityRepo = new AvailabilityRepository();

  const router = Router();

  // /mine must come before /:id — otherwise "mine" is treated as an ID parameter
  router.get("/mine", requireAuth, requireRole("host"), controller.listMine);

  // Public listing detail — no auth required
  router.get("/:id", controller.getPublic);

  // Public blocked-dates for the date picker (guest/anonymous)
  router.get("/:id/blocked-dates", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const blocks = await availabilityRepo.listByListing(req.params["id"] ?? "");
      res.json(
        blocks.map((b) => ({
          startDate: b.startDate.toISOString().slice(0, 10),
          endDate: b.endDate.toISOString().slice(0, 10),
        })),
      );
    } catch (err) {
      next(err);
    }
  });

  // Host management view — ownership-checked, auth required
  router.get("/:id/manage", requireAuth, requireRole("host"), controller.getOne);

  // Host CRUD
  router.post("/", requireAuth, requireRole("host"), controller.create);
  router.patch("/:id", requireAuth, requireRole("host"), controller.update);
  router.patch("/:id/publish", requireAuth, requireRole("host"), controller.publish);
  router.patch("/:id/unpublish", requireAuth, requireRole("host"), controller.unpublish);

  return router;
}

export const listingsRouter = createListingsRouter();
