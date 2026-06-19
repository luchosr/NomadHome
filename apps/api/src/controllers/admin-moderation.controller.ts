import type { Request, Response } from "express";
import { AdminService, AdminTargetNotFoundError } from "../services/admin.service.js";
import type { AuthedRequest } from "../middleware/require-auth.js";

export class AdminModerationController {
  constructor(private readonly service: AdminService) {}

  private adminId(req: Request): string {
    return (req as AuthedRequest).user!.id;
  }

  disableUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.service.disableUser(this.adminId(req), req.params.id ?? "");
      res.json(user);
    } catch (err) {
      if (err instanceof AdminTargetNotFoundError) {
        res.status(404).json({ error: "USER_NOT_FOUND" });
        return;
      }
      throw err;
    }
  };

  enableUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.service.enableUser(req.params.id ?? "");
      res.json(user);
    } catch (err) {
      if (err instanceof AdminTargetNotFoundError) {
        res.status(404).json({ error: "USER_NOT_FOUND" });
        return;
      }
      throw err;
    }
  };

  disableListing = async (req: Request, res: Response): Promise<void> => {
    try {
      const listing = await this.service.disableListing(req.params.id ?? "");
      res.json(listing);
    } catch (err) {
      if (err instanceof AdminTargetNotFoundError) {
        res.status(404).json({ error: "LISTING_NOT_FOUND" });
        return;
      }
      throw err;
    }
  };

  enableListing = async (req: Request, res: Response): Promise<void> => {
    try {
      const listing = await this.service.enableListing(req.params.id ?? "");
      res.json(listing);
    } catch (err) {
      if (err instanceof AdminTargetNotFoundError) {
        res.status(404).json({ error: "LISTING_NOT_FOUND" });
        return;
      }
      throw err;
    }
  };

  listUsers = async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(String(req.query["page"] ?? "1"), 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query["limit"] ?? "50"), 10) || 50),
    );
    const result = await this.service.listUsers(page, limit);
    res.json({ ...result, page, limit });
  };

  listListings = async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(String(req.query["page"] ?? "1"), 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query["limit"] ?? "50"), 10) || 50),
    );
    const result = await this.service.listListings(page, limit);
    res.json({ ...result, page, limit });
  };
}
