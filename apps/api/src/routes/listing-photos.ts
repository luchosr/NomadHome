import { Router } from "express";
import { ListingPhotoController } from "../controllers/listing-photo.controller.js";
import { ListingPhotoService } from "../services/listing-photo.service.js";
import { ListingPhotoRepository } from "../repositories/listing-photo.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { StorageService } from "../services/storage.service.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireRole } from "../middleware/require-role.js";

export function createListingPhotosRouter(): Router {
  const controller = new ListingPhotoController(
    new ListingPhotoService(
      new ListingPhotoRepository(),
      new ListingRepository(),
      new StorageService(),
    ),
  );

  const router = Router();
  router.post("/:id/photos/upload-url", requireAuth, requireRole("host"), controller.getUploadUrl);
  router.post("/:id/photos", requireAuth, requireRole("host"), controller.register);
  router.get("/:id/photos", requireAuth, requireRole("host"), controller.list);
  router.patch(
    "/:id/photos/:photoId/position",
    requireAuth,
    requireRole("host"),
    controller.updatePosition,
  );
  router.delete("/:id/photos/:photoId", requireAuth, requireRole("host"), controller.deletePhoto);
  return router;
}

export const listingPhotosRouter = createListingPhotosRouter();
