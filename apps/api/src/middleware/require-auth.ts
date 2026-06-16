import type { NextFunction, Request, Response } from "express";
import { tokenService } from "../services/token.service.js";

export interface AuthedRequest extends Request {
  user?: { id: string; roles: string[] };
}

/** Reject requests without a valid, unexpired Bearer access token. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    const claims = tokenService.verifyAccessToken(header.slice("Bearer ".length));
    (req as AuthedRequest).user = { id: claims.sub, roles: claims.roles };
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
}
