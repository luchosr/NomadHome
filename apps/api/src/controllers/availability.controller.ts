import type { Request, Response } from "express";
import { BlockDateRangeSchema, t } from "@nomadhome/shared";
import {
  AvailabilityService,
  BlockNotFoundError,
  ListingForbiddenError,
  ListingNotFoundError,
  OverlapConflictError,
} from "../services/availability.service.js";
import type { AuthedRequest } from "../middleware/require-auth.js";

export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  private hostId(req: Request): string {
    return (req as AuthedRequest).user!.id;
  }

  block = async (req: Request, res: Response): Promise<void> => {
    const parsed = BlockDateRangeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    try {
      const result = await this.service.block(
        this.hostId(req),
        req.params.id ?? "",
        new Date(parsed.data.startDate),
        new Date(parsed.data.endDate),
      );
      res.status(201).json(result);
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

  deleteBlock = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.deleteBlock(
        this.hostId(req),
        req.params.id ?? "",
        req.params.blockId ?? "",
      );
      res.status(204).send();
    } catch (err) {
      this.mapError(err, res);
    }
  };

  private mapError(err: unknown, res: Response): void {
    if (err instanceof OverlapConflictError) {
      res.status(409).json({ error: "OVERLAP_CONFLICT", conflict: err.conflict });
      return;
    }
    if (err instanceof ListingNotFoundError) {
      res.status(404).json({ error: t("listings.error.not_found") });
      return;
    }
    if (err instanceof ListingForbiddenError) {
      res.status(403).json({ error: t("listings.availability.forbidden") });
      return;
    }
    if (err instanceof BlockNotFoundError) {
      res.status(404).json({ error: t("listings.availability.not_found") });
      return;
    }
    throw err;
  }
}
