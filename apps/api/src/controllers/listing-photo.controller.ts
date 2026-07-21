import type { Request, Response } from "express";
import {
  UploadUrlRequestSchema,
  RegisterPhotoSchema,
  UpdatePhotoPositionSchema,
  t,
} from "@nomadhome/shared";
import {
  ListingPhotoService,
  PhotoForbiddenError,
  PhotoNotFoundError,
  PhotoPositionConflictError,
} from "../services/listing-photo.service.js";
import { getUser } from "../middleware/require-auth.js";

export class ListingPhotoController {
  constructor(private readonly service: ListingPhotoService) {}

  private hostId(req: Request): string {
    return getUser(req).id;
  }

  getUploadUrl = async (req: Request, res: Response): Promise<void> => {
    const parsed = UploadUrlRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    try {
      const result = await this.service.getUploadUrl(
        this.hostId(req),
        req.params.id ?? "",
        parsed.data.contentType,
      );
      res.json(result);
    } catch (err) {
      this.mapError(err, res);
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    const parsed = RegisterPhotoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    try {
      const photo = await this.service.register(
        this.hostId(req),
        req.params.id ?? "",
        parsed.data.key,
        parsed.data.position,
      );
      res.status(201).json(photo);
    } catch (err) {
      this.mapError(err, res);
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.service.list(this.hostId(req), req.params.id ?? ""));
    } catch (err) {
      this.mapError(err, res);
    }
  };

  updatePosition = async (req: Request, res: Response): Promise<void> => {
    const parsed = UpdatePhotoPositionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    try {
      const photo = await this.service.updatePosition(
        this.hostId(req),
        req.params.id ?? "",
        req.params.photoId ?? "",
        parsed.data.position,
      );
      res.json(photo);
    } catch (err) {
      this.mapError(err, res);
    }
  };

  deletePhoto = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.delete(this.hostId(req), req.params.id ?? "", req.params.photoId ?? "");
      res.status(204).send();
    } catch (err) {
      this.mapError(err, res);
    }
  };

  private mapError(err: unknown, res: Response): void {
    if (err instanceof PhotoNotFoundError) {
      res.status(404).json({ error: t("listings.photo.not_found") });
      return;
    }
    if (err instanceof PhotoForbiddenError) {
      res.status(403).json({ error: t("listings.photo.forbidden") });
      return;
    }
    if (err instanceof PhotoPositionConflictError) {
      res.status(409).json({ error: t("listings.photo.position_conflict") });
      return;
    }
    throw err;
  }
}
