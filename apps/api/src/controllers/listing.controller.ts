import type { Request, Response } from "express";
import { CreateListingSchema, UpdateListingSchema, t } from "@nomadhome/shared";
import {
  ListingForbiddenError,
  ListingNoPhotoError,
  ListingNotFoundError,
  ListingService,
  UnknownAmenityError,
} from "../services/listing.service.js";
import type { AuthedRequest } from "../middleware/require-auth.js";

/** HTTP edge for listing management. All routes are host-guarded upstream. */
export class ListingController {
  constructor(private readonly listings: ListingService) {}

  private hostId(req: Request): string {
    return (req as AuthedRequest).user!.id;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    try {
      const listing = await this.listings.create(this.hostId(req), parsed.data);
      res.status(201).json(listing);
    } catch (err) {
      if (err instanceof UnknownAmenityError) {
        res.status(422).json({ error: t("listings.create.unknown_amenity") });
        return;
      }
      throw err;
    }
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.listings.listOwn(this.hostId(req)));
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.listings.getOwned(this.hostId(req), req.params.id ?? ""));
    } catch (err) {
      this.mapError(err, res);
    }
  };

  /** Public endpoint — no auth required. Returns a PUBLISHED listing's full detail. */
  getPublic = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.listings.getPublic(req.params.id ?? ""));
    } catch (err) {
      this.mapError(err, res);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const parsed = UpdateListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    try {
      res.json(await this.listings.update(this.hostId(req), req.params.id ?? "", parsed.data));
    } catch (err) {
      this.mapError(err, res);
    }
  };

  publish = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.listings.publish(this.hostId(req), req.params.id ?? ""));
    } catch (err) {
      if (err instanceof ListingNoPhotoError) {
        res.status(422).json({ error: t("listings.publish.no_photo") });
        return;
      }
      this.mapError(err, res);
    }
  };

  unpublish = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.listings.unpublish(this.hostId(req), req.params.id ?? ""));
    } catch (err) {
      this.mapError(err, res);
    }
  };

  private mapError(err: unknown, res: Response): void {
    if (err instanceof ListingNotFoundError) {
      res.status(404).json({ error: t("listings.error.not_found") });
      return;
    }
    if (err instanceof ListingForbiddenError) {
      res.status(403).json({ error: t("listings.error.forbidden") });
      return;
    }
    if (err instanceof UnknownAmenityError) {
      res.status(422).json({ error: t("listings.create.unknown_amenity") });
      return;
    }
    throw err;
  }
}
