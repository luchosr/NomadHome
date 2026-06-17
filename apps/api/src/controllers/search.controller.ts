import type { Request, Response } from "express";
import { SearchQuerySchema } from "@nomadhome/shared";
import { SearchService } from "../services/search.service.js";

export class SearchController {
  constructor(private readonly service: SearchService) {}

  search = async (req: Request, res: Response): Promise<void> => {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "validation", issues: parsed.error.flatten() });
      return;
    }
    const result = await this.service.search(parsed.data);
    res.json(result);
  };
}
